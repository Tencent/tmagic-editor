/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { reactive } from 'vue';
import { cloneDeep } from 'lodash-es';
import serialize from 'serialize-javascript';

import type { CodeBlockContent, DataSourceSchema, Id, MPage, MPageFragment } from '@tmagic/core';
import type { ChangeRecord } from '@tmagic/form';
import { guid } from '@tmagic/utils';

import type {
  BaseStepValue,
  CodeBlockHistoryGroup,
  CodeBlockStepValue,
  DataSourceHistoryGroup,
  DataSourceStepValue,
  HistoryOpSource,
  HistoryOpType,
  HistoryPersistOptions,
  HistoryState,
  PageHistoryGroup,
  PageHistoryStepEntry,
  PersistedHistoryState,
  StepValue,
} from '@editor/type';
import { getEditorConfig } from '@editor/utils/config';
import { idbGet, idbSet } from '@editor/utils/indexed-db';
import { UndoRedo } from '@editor/utils/undo-redo';

import BaseService from './BaseService';
import editorService from './editor';

/** 历史记录持久化快照的默认存储位置与结构版本。 */
const DEFAULT_DB_NAME = 'tmagic-editor';
const DEFAULT_STORE_NAME = 'history';
const DEFAULT_KEY: IDBValidKey = 'default';
const PERSIST_VERSION = 1;

class History extends BaseService {
  /**
   * 把单个「按 id 分栈」的历史栈（代码块 / 数据源）拆成若干 group：
   * - 把"新增/删除"独立成组（语义上属于一次性事件，不应与 update 合并）；
   * - 连续 'update' 合并到同一组，组内 steps 顺序就是发生顺序。
   *
   * 代码块与数据源除 `kind` 外结构完全一致，统一由本方法处理；`kind` 决定返回的具体分组类型。
   */
  private static mergeStackSteps<S extends BaseStepValue, K extends 'code-block' | 'data-source'>(
    kind: K,
    id: Id,
    list: S[],
    cursor: number,
  ): {
    kind: K;
    id: Id;
    opType: HistoryOpType;
    steps: { step: S; index: number; applied: boolean; isCurrent?: boolean }[];
    applied: boolean;
    isCurrent?: boolean;
  }[] {
    type Group = {
      kind: K;
      id: Id;
      opType: HistoryOpType;
      steps: { step: S; index: number; applied: boolean; isCurrent?: boolean }[];
      applied: boolean;
      isCurrent?: boolean;
    };
    const groups: Group[] = [];
    let current: Group | null = null;
    const currentIndex = cursor - 1;
    list.forEach((step, index) => {
      const { opType } = step;
      const applied = index < cursor;
      const isCurrent = index === currentIndex;
      if (opType === 'update' && current?.opType === 'update') {
        current.steps.push({ step, index, applied, isCurrent });
        current.applied = applied;
        if (isCurrent) current.isCurrent = true;
      } else {
        current = {
          kind,
          id,
          opType,
          steps: [{ step, index, applied, isCurrent }],
          applied,
          isCurrent,
        };
        groups.push(current);
      }
    });
    return groups;
  }

  /**
   * 根据 old/new 是否为 null 推断 opType（与 push 时的约定一致）。
   */
  private static detectOpType(oldVal: unknown, newVal: unknown): 'add' | 'remove' | 'update' {
    if (oldVal === null && newVal !== null) return 'add';
    if (oldVal !== null && newVal === null) return 'remove';
    return 'update';
  }

  /**
   * 把页面栈拆成若干 group：
   * - 单节点的 'update' 按 targetId 与相邻同 targetId 的 update 合并到一个 group；
   * - 'add' / 'remove' 始终独立成组（语义上是结构变更，不应被收纳进单节点修改组）；
   * - 多节点 'update'（如批量改属性）也独立成组（无明确单一目标，避免误合并）。
   */
  private static mergePageSteps(pageId: Id, list: StepValue[], cursor: number): PageHistoryGroup[] {
    const groups: PageHistoryGroup[] = [];
    let current: PageHistoryGroup | null = null;
    const currentIndex = cursor - 1;
    list.forEach((step, index) => {
      const applied = index < cursor;
      const isCurrent = index === currentIndex;
      const targetId = History.detectPageTargetId(step);
      const targetName = History.detectPageTargetName(step);
      const entry: PageHistoryStepEntry = { step, index, applied, isCurrent };

      // 仅"单节点 update"参与合并；其它情形（add/remove/多节点 update）始终独立成组。
      const mergeable = step.opType === 'update' && targetId !== undefined;
      if (mergeable && current?.opType === 'update' && current.targetId === targetId) {
        current.steps.push(entry);
        current.applied = applied;
        if (isCurrent) current.isCurrent = true;
        // 保持目标名为最近一次的（节点重命名时也能反映）
        if (targetName) current.targetName = targetName;
      } else {
        current = {
          kind: 'page',
          pageId,
          opType: step.opType,
          targetId: mergeable ? targetId : undefined,
          targetName,
          steps: [entry],
          applied,
          isCurrent,
        };
        groups.push(current);
      }
    });
    return groups;
  }

  /**
   * 解析 StepValue 中的"目标节点 id"用于合并：
   * - 单节点 update：取唯一一项 updatedItems 的节点 id；
   * - 其它情形（多节点 update / add / remove）：返回 undefined，表示不参与合并。
   */
  private static detectPageTargetId(step: StepValue): Id | undefined {
    if (step.opType !== 'update') return undefined;
    const items = step.diff;
    if (items?.length !== 1) return undefined;
    return items[0].newSchema?.id ?? items[0].oldSchema?.id;
  }

  /** 解析 StepValue 中的目标节点可读名（用于 UI 展示）。 */
  private static detectPageTargetName(step: StepValue): string | undefined {
    const items = step.diff;
    if (step.opType === 'update') {
      if (items?.length === 1) {
        const node = items[0].newSchema || items[0].oldSchema;
        return (node?.name as string) || (node?.type as string) || (node?.id !== undefined ? `${node.id}` : undefined);
      }
      return items?.length ? `${items.length} 个节点` : undefined;
    }
    if (step.opType === 'add') {
      if (items?.length === 1) {
        const n = items[0].newSchema;
        return (n?.name as string) || (n?.type as string) || `${n?.id}`;
      }
      return items?.length ? `${items.length} 个节点` : undefined;
    }
    if (step.opType === 'remove') {
      if (items?.length === 1) {
        const n = items[0].oldSchema;
        return (n?.name as string) || (n?.type as string) || `${n?.id}`;
      }
      return items?.length ? `${items.length} 个节点` : undefined;
    }
    return undefined;
  }

  /**
   * 把单个栈当前游标所在记录标记为已保存：先清除该栈内全部旧标记，保证同一栈最多一条 `saved`。
   * 栈处于「全部已撤销」（cursor 为 0）时不会留下已保存记录，恢复时其游标回到 0。
   */
  private static markStackSaved<S extends { saved?: boolean }>(undoRedo?: UndoRedo<S>): void {
    if (!undoRedo) return;
    undoRedo.updateElements((element) => {
      element.saved = false;
    });
    undoRedo.updateCurrentElement((element) => {
      element.saved = true;
    });
  }

  /** 把 `Record<Id, UndoRedo>` 整体序列化为 `Record<Id, SerializedUndoRedo>`。 */
  private static serializeStacks<T>(stacks: Record<Id, UndoRedo<T>>) {
    const result: Record<Id, ReturnType<UndoRedo<T>['serialize']>> = {};
    Object.entries(stacks).forEach(([id, undoRedo]) => {
      if (undoRedo) result[id] = undoRedo.serialize();
    });
    return result;
  }

  /**
   * 把 `Record<Id, SerializedUndoRedo>` 整体还原为 `Record<Id, UndoRedo>`。
   * 还原时把每个栈的游标定位到最近一条已保存（`saved === true`）记录之后。
   */
  private static deserializeStacks<T extends { saved?: boolean }>(
    stacks: Record<Id, ReturnType<UndoRedo<T>['serialize']>> = {},
  ): Record<Id, UndoRedo<T>> {
    const result: Record<Id, UndoRedo<T>> = {};
    Object.entries(stacks).forEach(([id, serialized]) => {
      if (serialized) {
        result[id] = UndoRedo.fromSerialized<T>(serialized, { isSavedStep: (element) => element.saved === true });
      }
    });
    return result;
  }

  /**
   * 按 id 从「按 id 分栈」的记录表（代码块 / 数据源）中获取（或创建）对应的 UndoRedo 栈。
   */
  private static getOrCreateStack<T>(stacks: Record<Id, UndoRedo<T>>, id: Id): UndoRedo<T> {
    if (!stacks[id]) {
      stacks[id] = new UndoRedo<T>();
    }
    return stacks[id];
  }

  public state = reactive<HistoryState>({
    pageSteps: {},
    pageId: undefined,
    canRedo: false,
    canUndo: false,
    codeBlockState: {},
    dataSourceState: {},
  });

  constructor() {
    super([]);

    this.on('change', this.setCanUndoRedo);
  }

  public reset() {
    this.state.pageSteps = {};
    this.state.codeBlockState = {};
    this.state.dataSourceState = {};
    this.resetPage();
  }

  public resetPage() {
    this.state.pageId = undefined;
    this.state.canRedo = false;
    this.state.canUndo = false;
  }

  public changePage(page: MPage | MPageFragment): void {
    if (!page) return;

    this.state.pageId = page.id;

    if (!this.state.pageSteps[this.state.pageId]) {
      this.state.pageSteps[this.state.pageId] = new UndoRedo<StepValue>();
    }

    this.setCanUndoRedo();

    this.emit('page-change', this.state.pageSteps[this.state.pageId]);
  }

  public resetState(): void {
    this.state.pageId = undefined;
    this.state.pageSteps = {};
    this.state.canRedo = false;
    this.state.canUndo = false;
    this.state.codeBlockState = {};
    this.state.dataSourceState = {};
  }

  /**
   * 把一条步骤推入指定页面的栈；不指定 pageId 时落到当前活动页。
   *
   * 跨页操作（例如 `moveToContainer` 把节点搬到其它页）必须显式传入 `pageId`，
   * 否则会把记录错误地落到操作发起页 / 当前激活页，破坏目标页 / 源页的撤销栈语义。
   */
  public push(state: StepValue, pageId?: Id): StepValue | null {
    const undoRedo = this.getUndoRedo(pageId);
    if (!undoRedo) return null;
    if (state.uuid === undefined) state.uuid = guid();
    if (state.timestamp === undefined) state.timestamp = Date.now();
    undoRedo.pushElement(state);
    // 仅当推入的是当前活动页时才需要刷新 canUndo/canRedo —— 其它页栈对当前 UI 状态没影响。
    if (pageId === undefined || `${pageId}` === `${this.state.pageId}`) {
      this.emit('change', state);
    }
    return state;
  }

  /**
   * 推入一条代码块变更记录（与页面/节点完全无关），按 `codeBlockId` 维度独立一份 UndoRedo 栈。
   *
   * - 新增：oldContent = null，newContent = 新内容
   * - 更新：oldContent / newContent 都为对应内容
   * - 删除：newContent = null，oldContent = 删除前内容
   * - `changeRecords` 来自 form 端，撤销/重做时若有则按 propPath 局部覆盖；缺省才退化为整内容替换。
   * - 不直接驱动 codeBlockService，调用方负责实际写回。
   */
  public pushCodeBlock(
    codeBlockId: Id,
    payload: {
      oldContent: CodeBlockContent | null;
      newContent: CodeBlockContent | null;
      changeRecords?: ChangeRecord[];
      /** 可选的人类可读描述（如「修改按钮颜色」），仅用于历史面板展示。 */
      historyDescription?: string;
      /** 可选的操作途径（配置面板 / 菜单 / 接口等），仅用于历史面板展示与埋点。 */
      source?: HistoryOpSource;
    },
  ): CodeBlockStepValue | null {
    const step = this.createStackStep<CodeBlockContent, CodeBlockStepValue>(codeBlockId, {
      oldValue: payload.oldContent,
      newValue: payload.newContent,
      changeRecords: payload.changeRecords,
      historyDescription: payload.historyDescription,
      source: payload.source,
    });
    if (!step) return null;
    History.getOrCreateStack(this.state.codeBlockState, codeBlockId).pushElement(step);
    this.emit('code-block-history-change', codeBlockId, step);
    return step;
  }

  /**
   * 推入一条数据源变更记录（与页面/节点完全无关），按 `dataSourceId` 维度独立一份 UndoRedo 栈。
   * 行为同 pushCodeBlock（新增 oldSchema=null；删除 newSchema=null）。
   */
  public pushDataSource(
    dataSourceId: Id,
    payload: {
      oldSchema: DataSourceSchema | null;
      newSchema: DataSourceSchema | null;
      changeRecords?: ChangeRecord[];
      /** 可选的人类可读描述，仅用于历史面板展示。 */
      historyDescription?: string;
      /** 可选的操作途径（配置面板 / 菜单 / 接口等），仅用于历史面板展示与埋点。 */
      source?: HistoryOpSource;
    },
  ): DataSourceStepValue | null {
    const step = this.createStackStep<DataSourceSchema, DataSourceStepValue>(dataSourceId, {
      oldValue: payload.oldSchema,
      newValue: payload.newSchema,
      changeRecords: payload.changeRecords,
      historyDescription: payload.historyDescription,
      source: payload.source,
    });
    if (!step) return null;
    History.getOrCreateStack(this.state.dataSourceState, dataSourceId).pushElement(step);
    this.emit('data-source-history-change', dataSourceId, step);
    return step;
  }

  /** 撤销指定代码块的最近一次变更。 */
  public undoCodeBlock(codeBlockId: Id): CodeBlockStepValue | null {
    const undoRedo = this.state.codeBlockState[codeBlockId];
    if (!undoRedo) return null;
    const step = undoRedo.undo();
    if (step) this.emit('code-block-history-change', codeBlockId, step);
    return step;
  }

  /** 重做指定代码块的下一次变更。 */
  public redoCodeBlock(codeBlockId: Id): CodeBlockStepValue | null {
    const undoRedo = this.state.codeBlockState[codeBlockId];
    if (!undoRedo) return null;
    const step = undoRedo.redo();
    if (step) this.emit('code-block-history-change', codeBlockId, step);
    return step;
  }

  /** 是否可对指定代码块撤销。 */
  public canUndoCodeBlock(codeBlockId: Id): boolean {
    return this.state.codeBlockState[codeBlockId]?.canUndo() ?? false;
  }

  /** 是否可对指定代码块重做。 */
  public canRedoCodeBlock(codeBlockId: Id): boolean {
    return this.state.codeBlockState[codeBlockId]?.canRedo() ?? false;
  }

  /** 撤销指定数据源的最近一次变更。 */
  public undoDataSource(dataSourceId: Id): DataSourceStepValue | null {
    const undoRedo = this.state.dataSourceState[dataSourceId];
    if (!undoRedo) return null;
    const step = undoRedo.undo();
    if (step) this.emit('data-source-history-change', dataSourceId, step);
    return step;
  }

  /** 重做指定数据源的下一次变更。 */
  public redoDataSource(dataSourceId: Id): DataSourceStepValue | null {
    const undoRedo = this.state.dataSourceState[dataSourceId];
    if (!undoRedo) return null;
    const step = undoRedo.redo();
    if (step) this.emit('data-source-history-change', dataSourceId, step);
    return step;
  }

  /** 是否可对指定数据源撤销。 */
  public canUndoDataSource(dataSourceId: Id): boolean {
    return this.state.dataSourceState[dataSourceId]?.canUndo() ?? false;
  }

  /** 是否可对指定数据源重做。 */
  public canRedoDataSource(dataSourceId: Id): boolean {
    return this.state.dataSourceState[dataSourceId]?.canRedo() ?? false;
  }

  public undo(): StepValue | null {
    const undoRedo = this.getUndoRedo();
    if (!undoRedo) return null;
    const state = undoRedo.undo();
    this.emit('change', state);
    return state;
  }

  public redo(): StepValue | null {
    const undoRedo = this.getUndoRedo();
    if (!undoRedo) return null;
    const state = undoRedo.redo();
    this.emit('change', state);
    return state;
  }

  public destroy(): void {
    this.resetState();
    this.removeAllListeners();
    this.removeAllPlugins();
  }

  /**
   * 清空指定页面（缺省当前活动页）的历史记录栈。
   * 仅删除撤销/重做记录，不会改动当前 DSL；清空后该页将无法再撤销/重做之前的操作。
   */
  public clearPage(pageId?: Id): void {
    const targetPageId = pageId ?? this.state.pageId;
    if (!targetPageId) return;
    this.state.pageSteps[targetPageId] = new UndoRedo<StepValue>();
    if (`${targetPageId}` === `${this.state.pageId}`) {
      this.setCanUndoRedo();
      this.emit('change', null);
    }
  }

  /**
   * 清空数据源历史记录栈：传入 `dataSourceId` 仅清空该数据源，缺省清空全部数据源。
   * 仅删除撤销/重做记录，不会改动数据源本身。
   */
  public clearDataSource(dataSourceId?: Id): void {
    if (dataSourceId !== undefined) {
      delete this.state.dataSourceState[dataSourceId];
    } else {
      this.state.dataSourceState = {};
    }
  }

  /**
   * 清空代码块历史记录栈：传入 `codeBlockId` 仅清空该代码块，缺省清空全部代码块。
   * 仅删除撤销/重做记录，不会改动代码块本身。
   */
  public clearCodeBlock(codeBlockId?: Id): void {
    if (codeBlockId !== undefined) {
      delete this.state.codeBlockState[codeBlockId];
    } else {
      this.state.codeBlockState = {};
    }
  }

  /**
   * 标记「整份 DSL 已保存」：把页面 / 代码块 / 数据源所有栈当前游标所在的记录都标为 `saved`。
   * 适用于「整体落库」场景；若只保存了其中一类，请改用更细粒度的
   * {@link markPageSaved} / {@link markCodeBlockSaved} / {@link markDataSourceSaved}。
   */
  public markSaved(): void {
    Object.values(this.state.pageSteps).forEach(History.markStackSaved);
    Object.values(this.state.codeBlockState).forEach(History.markStackSaved);
    Object.values(this.state.dataSourceState).forEach(History.markStackSaved);
    this.emit('mark-saved', { kind: 'all' });
  }

  /**
   * 标记指定页面（缺省为当前活动页）的历史栈当前记录为已保存。
   * 仅影响该页面自己的栈，不波及代码块 / 数据源 / 其它页面。
   */
  public markPageSaved(pageId?: Id): void {
    const targetPageId = pageId ?? this.state.pageId;
    if (!targetPageId) return;
    History.markStackSaved(this.state.pageSteps[targetPageId]);
    this.emit('mark-saved', { kind: 'page', id: targetPageId });
  }

  /** 标记指定代码块的历史栈当前记录为已保存，仅影响该代码块自己的栈。 */
  public markCodeBlockSaved(codeBlockId: Id): void {
    if (!codeBlockId) return;
    History.markStackSaved(this.state.codeBlockState[codeBlockId]);
    this.emit('mark-saved', { kind: 'code-block', id: codeBlockId });
  }

  /** 标记指定数据源的历史栈当前记录为已保存，仅影响该数据源自己的栈。 */
  public markDataSourceSaved(dataSourceId: Id): void {
    if (!dataSourceId) return;
    History.markStackSaved(this.state.dataSourceState[dataSourceId]);
    this.emit('mark-saved', { kind: 'data-source', id: dataSourceId });
  }

  /**
   * 把当前内存中的全部历史栈（页面 / 代码块 / 数据源）序列化后写入本地 IndexedDB。
   *
   * - 每个 UndoRedo 栈连同其游标、容量一并保存，恢复后可继续 undo/redo；
   * - `key` 用于区分不同活动页 / 项目（同一 store 下可保存多份快照），缺省为 `default`；
   * - 返回写入成功的快照对象，便于调用方记录 savedAt 等信息；
   * - 不支持 IndexedDB 的环境（如 SSR）会 reject。
   */
  public async saveToIndexedDB(options: HistoryPersistOptions = {}): Promise<PersistedHistoryState> {
    const { dbName = DEFAULT_DB_NAME, storeName = DEFAULT_STORE_NAME, key = DEFAULT_KEY } = options;

    const snapshot: PersistedHistoryState = {
      version: PERSIST_VERSION,
      pageId: this.state.pageId,
      pageSteps: History.serializeStacks(this.state.pageSteps),
      codeBlockState: History.serializeStacks(this.state.codeBlockState),
      dataSourceState: History.serializeStacks(this.state.dataSourceState),
      savedAt: Date.now(),
    };

    // 历史记录里可能包含函数（如代码块内容 / 节点事件 / 数据源方法），IndexedDB 的结构化克隆无法写入函数，
    // 因此用 serialize-javascript 序列化成字符串后再写入（支持函数 / Map 等），读取时用 parseDSL 还原。
    await idbSet(this.resolveDbName(dbName), storeName, key, serialize(snapshot));
    this.emit('save-to-indexed-db', snapshot);
    return snapshot;
  }

  /**
   * 从本地 IndexedDB 读取此前保存的历史快照并重建全部撤销/重做栈。
   *
   * - 读取到的每个栈都会经 {@link UndoRedo.fromSerialized} 还原（含游标），随后可直接 undo/redo；
   * - 会整体覆盖当前内存中的历史状态，并把活动页恢复为快照中的 pageId；
   * - 找不到对应记录时返回 null，且不改动当前状态；
   * - 不支持 IndexedDB 的环境（如 SSR）会 reject。
   */
  public async restoreFromIndexedDB(options: HistoryPersistOptions = {}): Promise<PersistedHistoryState | null> {
    const { dbName = DEFAULT_DB_NAME, storeName = DEFAULT_STORE_NAME, key = DEFAULT_KEY } = options;

    const raw = await idbGet<string | PersistedHistoryState>(this.resolveDbName(dbName), storeName, key);
    if (!raw) return null;

    // 新版以序列化字符串存储（含函数），用 parseDSL 还原；兼容历史上以对象形式存入的旧数据。
    const snapshot = (typeof raw === 'string' ? getEditorConfig('parseDSL')(`(${raw})`) : raw) as PersistedHistoryState;
    if (!snapshot) return null;

    this.state.pageSteps = History.deserializeStacks(snapshot.pageSteps);
    this.state.codeBlockState = History.deserializeStacks(snapshot.codeBlockState);
    this.state.dataSourceState = History.deserializeStacks(snapshot.dataSourceState);
    this.state.pageId = snapshot.pageId;

    this.setCanUndoRedo();
    this.emit('restore-from-indexed-db', snapshot);
    this.emit('change', null);
    return snapshot;
  }

  /**
   * 取出当前活动页的历史步骤平铺列表（包含已应用 + 已撤销）。
   * 列表按时间正序，最早一步在最前面。
   * 通常 UI 应使用 `getPageHistoryGroups` 取已合并分组的版本；本方法仅为兼容/调试保留。
   */
  public getPageStepList(pageId?: Id): PageHistoryStepEntry[] {
    const targetPageId = pageId ?? this.state.pageId;
    if (!targetPageId) return [];
    const undoRedo = this.state.pageSteps[targetPageId];
    if (!undoRedo) return [];
    const list = undoRedo.getElementList();
    const cursor = undoRedo.getCursor();
    return list.map((step, index) => ({
      step,
      index,
      applied: index < cursor,
    }));
  }

  /**
   * 取出当前活动页的历史栈，按"目标节点"做相邻合并：
   * - 连续修改同一节点（单节点 update）的多步合并为一个 group，组内可展开查看每步；
   * - add / remove / 多节点 update 始终独立成组。
   * 用于历史面板的"页面"tab 展示。
   */
  public getPageHistoryGroups(pageId?: Id): PageHistoryGroup[] {
    const targetPageId = pageId ?? this.state.pageId;
    if (!targetPageId) return [];
    const undoRedo = this.state.pageSteps[targetPageId];
    if (!undoRedo) return [];
    const list = undoRedo.getElementList();
    if (!list.length) return [];
    const cursor = undoRedo.getCursor();
    return History.mergePageSteps(targetPageId, list, cursor);
  }

  /**
   * 取出全部代码块的历史栈，按 codeBlockId 分组。
   * 同一栈内相邻、同 opType 且作用于同一 id 的多步会被合并为一个 group：
   * - 这正是"代码块/数据源各自按 id 分栈"的天然表现，再叠加"连续修改同目标的相邻步骤合并展示"。
   * - 合并后 group 暴露子步骤数组，UI 可展开查看每一步的 changeRecords。
   * - applied 字段：组内最后一步是否处于已应用段。
   */
  public getCodeBlockHistoryGroups(): CodeBlockHistoryGroup[] {
    const groups: CodeBlockHistoryGroup[] = [];
    Object.entries(this.state.codeBlockState).forEach(([id, undoRedo]) => {
      if (!undoRedo) return;
      const list = undoRedo.getElementList();
      if (!list.length) return;
      const cursor = undoRedo.getCursor();
      groups.push(...History.mergeStackSteps('code-block', id, list, cursor));
    });
    return groups;
  }

  /**
   * 读取指定页面历史栈的当前游标（已应用步骤数量）。不传则取当前活动页。
   * 没有对应栈时返回 0。
   */
  public getPageCursor(pageId?: Id): number {
    const targetPageId = pageId ?? this.state.pageId;
    if (!targetPageId) return 0;
    return this.state.pageSteps[targetPageId]?.getCursor() ?? 0;
  }

  /** 读取指定代码块历史栈的当前游标。 */
  public getCodeBlockCursor(codeBlockId: Id): number {
    return this.state.codeBlockState[codeBlockId]?.getCursor() ?? 0;
  }

  /** 读取指定数据源历史栈的当前游标。 */
  public getDataSourceCursor(dataSourceId: Id): number {
    return this.state.dataSourceState[dataSourceId]?.getCursor() ?? 0;
  }

  /**
   * 取出指定代码块历史栈的平铺步骤列表（含 applied 标记）。供 revert 等按 index 索引步骤使用。
   */
  public getCodeBlockStepList(codeBlockId: Id): { step: CodeBlockStepValue; index: number; applied: boolean }[] {
    const undoRedo = this.state.codeBlockState[codeBlockId];
    if (!undoRedo) return [];
    const list = undoRedo.getElementList();
    const cursor = undoRedo.getCursor();
    return list.map((step, index) => ({ step, index, applied: index < cursor }));
  }

  /**
   * 取出指定数据源历史栈的平铺步骤列表（含 applied 标记）。供 revert 等按 index 索引步骤使用。
   */
  public getDataSourceStepList(dataSourceId: Id): { step: DataSourceStepValue; index: number; applied: boolean }[] {
    const undoRedo = this.state.dataSourceState[dataSourceId];
    if (!undoRedo) return [];
    const list = undoRedo.getElementList();
    const cursor = undoRedo.getCursor();
    return list.map((step, index) => ({ step, index, applied: index < cursor }));
  }

  /**
   * 按历史记录 uuid 在指定页面（默认当前活动页）的栈中查找其索引。
   * 找不到时返回 -1。供「按 uuid 回滚」等需要把 uuid 映射回 index 的场景使用。
   */
  public getPageStepIndexByUuid(uuid: string, pageId?: Id): number {
    if (!uuid) return -1;
    return this.getPageStepList(pageId).findIndex((entry) => entry.step.uuid === uuid);
  }

  /**
   * 按历史记录 uuid 在全部代码块栈中查找其所属 codeBlockId 与索引。
   * 找不到时返回 null。
   */
  public findCodeBlockStepLocationByUuid(uuid: string): { id: Id; index: number } | null {
    if (!uuid) return null;
    for (const id of Object.keys(this.state.codeBlockState)) {
      const index = this.getCodeBlockStepList(id).findIndex((entry) => entry.step.uuid === uuid);
      if (index >= 0) return { id, index };
    }
    return null;
  }

  /**
   * 按历史记录 uuid 在全部数据源栈中查找其所属 dataSourceId 与索引。
   * 找不到时返回 null。
   */
  public findDataSourceStepLocationByUuid(uuid: string): { id: Id; index: number } | null {
    if (!uuid) return null;
    for (const id of Object.keys(this.state.dataSourceState)) {
      const index = this.getDataSourceStepList(id).findIndex((entry) => entry.step.uuid === uuid);
      if (index >= 0) return { id, index };
    }
    return null;
  }

  /**
   * 取出全部数据源的历史栈，按 dataSourceId 分组。同上。
   */
  public getDataSourceHistoryGroups(): DataSourceHistoryGroup[] {
    const groups: DataSourceHistoryGroup[] = [];
    Object.entries(this.state.dataSourceState).forEach(([id, undoRedo]) => {
      if (!undoRedo) return;
      const list = undoRedo.getElementList();
      if (!list.length) return;
      const cursor = undoRedo.getCursor();
      groups.push(...History.mergeStackSteps('data-source', id, list, cursor));
    });
    return groups;
  }

  /**
   * 取出指定页面的栈；不传 pageId 时按当前活动页取。
   *
   * 跨页 push 时如果目标页的栈尚不存在（用户从未进入过该页），会按需创建一条空栈，
   * 这样切到目标页时 Ctrl+Z 也能撤回该步骤。
   */
  private getUndoRedo(pageId?: Id) {
    const targetPageId = pageId ?? this.state.pageId;
    if (!targetPageId) return null;
    if (!this.state.pageSteps[targetPageId]) {
      this.state.pageSteps[targetPageId] = new UndoRedo<StepValue>();
    }
    return this.state.pageSteps[targetPageId];
  }

  /**
   * 把基础 dbName 与当前 DSL（root app）的 id 拼成最终库名，实现不同应用历史隔离。
   * 取不到 app id（如尚未加载 DSL）时退回基础 dbName。
   */
  private resolveDbName(dbName: string): string {
    const appId = editorService.get('root')?.id;
    return appId ? `${dbName}-${appId}` : dbName;
  }

  private setCanUndoRedo(): void {
    const undoRedo = this.getUndoRedo();
    this.state.canRedo = undoRedo?.canRedo() || false;
    this.state.canUndo = undoRedo?.canUndo() || false;
  }

  /**
   * 构造一条代码块 / 数据源「按 id 分栈」的历史记录：两者除 payload 字段命名外完全一致。
   *
   * - `add`：oldValue = null；`remove`：newValue = null；`update`：两者都有，可带 changeRecords 做局部更新。
   * - 内容会做 cloneDeep 防止后续被外部引用篡改；opType 依据 old/new 是否为 null 推断。
   * - 仅负责构造 step 并返回，入栈与事件 emit 由各公共方法（pushCodeBlock / pushDataSource）自行处理。
   * - 不直接驱动业务 service，调用方负责实际写回。
   */
  private createStackStep<T, S extends BaseStepValue<T> & { id: Id }>(
    id: Id,
    payload: {
      oldValue: T | null;
      newValue: T | null;
      changeRecords?: ChangeRecord[];
      historyDescription?: string;
      source?: HistoryOpSource;
    },
  ): S | null {
    if (!id) return null;

    const oldSchema = payload.oldValue ? cloneDeep(payload.oldValue) : null;
    const newSchema = payload.newValue ? cloneDeep(payload.newValue) : null;
    const changeRecords = payload.changeRecords?.length ? cloneDeep(payload.changeRecords) : undefined;
    const opType = History.detectOpType(payload.oldValue, payload.newValue);

    const step: BaseStepValue<T> & { id: Id } = {
      uuid: guid(),
      id,
      opType,
      diff: [
        {
          ...(newSchema !== null ? { newSchema } : {}),
          ...(oldSchema !== null ? { oldSchema } : {}),
          ...(opType === 'update' && changeRecords ? { changeRecords } : {}),
        },
      ],
      historyDescription: payload.historyDescription,
      source: payload.source,
      timestamp: Date.now(),
    };

    return step as S;
  }
}

export type HistoryService = History;

export default new History();
