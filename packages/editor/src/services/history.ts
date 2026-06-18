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
import type { Writable } from 'type-fest';

import type { CodeBlockContent, DataSourceSchema, Id, MPage, MPageFragment } from '@tmagic/core';
import type { ChangeRecord } from '@tmagic/form';
import { guid } from '@tmagic/utils';

import type {
  CodeBlockStepValue,
  DataSourceStepValue,
  HistoryOpSource,
  HistoryPersistOptions,
  HistoryState,
  PageHistoryGroup,
  PageHistoryStepEntry,
  PersistedHistoryState,
  StackHistoryGroup,
  StepValue,
  SyncHookPlugin,
} from '@editor/type';
import { getEditorConfig } from '@editor/utils/config';
import {
  createStackStep,
  deserializeStacks,
  getOrCreateStack,
  markStackSaved,
  mergePageSteps,
  mergeStackSteps,
  serializeStacks,
  undoFloor,
} from '@editor/utils/history';
import { idbGet, idbSet } from '@editor/utils/indexed-db';
import { UndoRedo } from '@editor/utils/undo-redo';

import BaseService from './BaseService';
import editorService from './editor';

const canUsePluginMethods = {
  sync: [
    'push',
    'pushCodeBlock',
    'pushDataSource',
    'undoCodeBlock',
    'redoCodeBlock',
    'undoDataSource',
    'redoDataSource',
    'undo',
    'redo',
  ] as const,
};

type SyncMethodName = Writable<(typeof canUsePluginMethods)['sync']>;

/** 历史记录持久化快照的默认存储位置与结构版本。 */
const DEFAULT_DB_NAME = 'tmagic-editor';
const DEFAULT_STORE_NAME = 'history';
const DEFAULT_KEY: IDBValidKey = 'default';
// v2：仅把每条 step 的 diff 序列化成字符串，其余字段交给 IndexedDB 结构化克隆原生存储（见 saveToIndexedDB）。
const PERSIST_VERSION = 2;

class History extends BaseService {
  public state = reactive<HistoryState>({
    pageSteps: {},
    pageId: undefined,
    canRedo: false,
    canUndo: false,
    codeBlockState: {},
    dataSourceState: {},
  });

  constructor() {
    super([...canUsePluginMethods.sync.map((methodName) => ({ name: methodName, isAsync: false }))]);

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
   * 为指定页面 / 页面片种入一条「初始基线」记录（如加载 DSL 时的「初始 / 加载」基线）。
   *
   * 该记录是一条 `opType: 'initial'` 的 {@link StepValue}，作为页面历史栈 **index 0 的固定底线**：
   * - 它是一条真实入栈的 step（随栈一起持久化），但被钉为撤销/回滚的下限——cursor 永不低于它，
   *   因此不会被 undo / goto / revert 触达（详见 {@link undo} / {@link setCanUndoRedo}）；
   * - 历史面板把它过滤出分组列表（见 {@link getPageHistoryGroups}），改由底部「初始」行展示。
   *
   * 仅当目标页面栈为空时种入（保证 initial 一定位于 index 0）；已存在 initial 底线时默认不重复种入，
   * 传 `force=true` 且栈为空时按新基线种入。
   */
  public setPageMarker(
    pageId: Id,
    options: { name?: string; description?: string; source?: HistoryOpSource } = {},
  ): StepValue | null {
    if (pageId === undefined || pageId === null || `${pageId}` === '') return null;

    const existing = this.getPageMarker(pageId);
    if (existing) return existing;

    const stack = getOrCreateStack(this.state.pageSteps, pageId);
    // initial 必须是 index 0；栈非空（已有真实记录、却无 initial，如旧数据）时不强行前插，优雅降级为无基线。
    if (stack.getLength() > 0) return null;

    const marker: StepValue = {
      uuid: guid(),
      opType: 'initial',
      diff: [],
      data: { name: options.name || '', id: pageId },
      selectedBefore: [],
      selectedAfter: [],
      modifiedNodeIds: new Map(),
      historyDescription: options.description || '未修改的初始状态',
      timestamp: Date.now(),
      ...(options.source ? { source: options.source } : {}),
    };
    stack.pushElement(marker);
    if (`${pageId}` === `${this.state.pageId}`) this.setCanUndoRedo();
    this.emit('page-marker-change', marker);
    return marker;
  }

  /**
   * 读取指定页面（缺省当前活动页）的初始基线 step（页面栈 index 0 且 `opType: 'initial'`）；
   * 不存在时返回 undefined。
   */
  public getPageMarker(pageId?: Id): StepValue | undefined {
    const targetPageId = pageId ?? this.state.pageId;
    if (!targetPageId) return undefined;
    const first = this.state.pageSteps[targetPageId]?.getElementList()[0];
    return first?.opType === 'initial' ? first : undefined;
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

  /** 读取指定页面（缺省当前活动页）历史栈当前游标所在的 step（cursor - 1）；无则返回 null。 */
  public getCurrentPageStep(pageId?: Id): StepValue | null {
    const targetPageId = pageId ?? this.state.pageId;
    if (!targetPageId) return null;
    return this.state.pageSteps[targetPageId]?.getCurrentElement() ?? null;
  }

  /**
   * 用 `state` 替换指定页面栈当前游标所在的 step（并丢弃其后的重做尾部），游标不变。
   * 用于「连续 set root 记录合并」等就地替换最新一条的场景；替换成功后按需刷新 / 通知。
   */
  public replaceCurrentPageStep(state: StepValue, pageId?: Id): StepValue | null {
    const undoRedo = this.getUndoRedo(pageId);
    if (!undoRedo) return null;
    if (state.uuid === undefined) state.uuid = guid();
    if (state.timestamp === undefined) state.timestamp = Date.now();
    if (!undoRedo.replaceCurrentElement(state)) return null;
    this.emit('change', state);
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
    const step = createStackStep<CodeBlockContent, CodeBlockStepValue>(codeBlockId, {
      oldValue: payload.oldContent,
      newValue: payload.newContent,
      changeRecords: payload.changeRecords,
      historyDescription: payload.historyDescription,
      source: payload.source,
    });
    if (!step) return null;
    getOrCreateStack(this.state.codeBlockState, codeBlockId).pushElement(step);
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
    const step = createStackStep<DataSourceSchema, DataSourceStepValue>(dataSourceId, {
      oldValue: payload.oldSchema,
      newValue: payload.newSchema,
      changeRecords: payload.changeRecords,
      historyDescription: payload.historyDescription,
      source: payload.source,
    });
    if (!step) return null;
    getOrCreateStack(this.state.dataSourceState, dataSourceId).pushElement(step);
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
    // 不允许撤销越过初始基线（index 0 的 initial step）。
    if (undoRedo.getCursor() <= undoFloor(undoRedo)) return null;
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
    // 保留该页原 initial 基线的文案 / 来源（仅清空其后的真实操作记录），无基线时清空成空栈。
    const marker = this.getPageMarker(targetPageId);
    this.state.pageSteps[targetPageId] = new UndoRedo<StepValue>();
    if (marker) {
      this.setPageMarker(targetPageId, {
        name: marker.data?.name,
        description: marker.historyDescription,
        source: marker.source,
      });
    }
    if (`${targetPageId}` === `${this.state.pageId}`) {
      this.setCanUndoRedo();
      this.emit('clear-page', null);
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
    Object.values(this.state.pageSteps).forEach(markStackSaved);
    Object.values(this.state.codeBlockState).forEach(markStackSaved);
    Object.values(this.state.dataSourceState).forEach(markStackSaved);
    this.emit('mark-saved', { kind: 'all' });
  }

  /**
   * 标记指定页面（缺省为当前活动页）的历史栈当前记录为已保存。
   * 仅影响该页面自己的栈，不波及代码块 / 数据源 / 其它页面。
   */
  public markPageSaved(pageId?: Id): void {
    const targetPageId = pageId ?? this.state.pageId;
    if (!targetPageId) return;
    markStackSaved(this.state.pageSteps[targetPageId]);
    this.emit('mark-saved', { kind: 'page', id: targetPageId });
  }

  /** 标记指定代码块的历史栈当前记录为已保存，仅影响该代码块自己的栈。 */
  public markCodeBlockSaved(codeBlockId: Id): void {
    if (!codeBlockId) return;
    markStackSaved(this.state.codeBlockState[codeBlockId]);
    this.emit('mark-saved', { kind: 'code-block', id: codeBlockId });
  }

  /** 标记指定数据源的历史栈当前记录为已保存，仅影响该数据源自己的栈。 */
  public markDataSourceSaved(dataSourceId: Id): void {
    if (!dataSourceId) return;
    markStackSaved(this.state.dataSourceState[dataSourceId]);
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
    const { dbName = DEFAULT_DB_NAME, storeName = DEFAULT_STORE_NAME, key = DEFAULT_KEY, appId } = options;

    // serializeStacks 会在序列化各栈时只把每条 step 的 diff（可能含函数）序列化成字符串，其余字段原样保留，
    // 因此整份快照可直接按对象写入 IndexedDB（结构化克隆），避免序列化整份快照的开销；读取时再用 parseDSL 还原 diff。
    const snapshot: PersistedHistoryState = {
      version: PERSIST_VERSION,
      pageId: this.state.pageId,
      pageSteps: serializeStacks(this.state.pageSteps),
      codeBlockState: serializeStacks(this.state.codeBlockState),
      dataSourceState: serializeStacks(this.state.dataSourceState),
      savedAt: Date.now(),
    };

    await idbSet(this.resolveDbName(dbName, appId), storeName, key, snapshot);
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
    const { dbName = DEFAULT_DB_NAME, storeName = DEFAULT_STORE_NAME, key = DEFAULT_KEY, appId } = options;

    const snapshot = await idbGet<PersistedHistoryState>(this.resolveDbName(dbName, appId), storeName, key);
    if (!snapshot) return null;

    // 各 step 的 diff 以序列化字符串存储（含函数），由 deserializeStacks 逐条用 parseDSL 还原。
    const parseDSL = getEditorConfig('parseDSL');
    this.state.pageSteps = deserializeStacks(snapshot.pageSteps, parseDSL);
    this.state.codeBlockState = deserializeStacks(snapshot.codeBlockState, parseDSL);
    this.state.dataSourceState = deserializeStacks(snapshot.dataSourceState, parseDSL);
    // initial 基线作为页面栈 index 0 的 step 随 pageSteps 一并还原，无需单独恢复。
    this.state.pageId = snapshot.pageId;

    this.setCanUndoRedo();
    this.emit('restore-from-indexed-db', snapshot);
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
    // initial 基线（index 0）不作为普通操作组展示，过滤掉；其余真实 step 的 index 保持不变，
    // 以便面板 goto(index+1) / revert(index) 仍直接对应栈内位置。底部「初始」行由 getPageMarker 驱动。
    return mergePageSteps(targetPageId, list, cursor).filter((group) => group.opType !== 'initial');
  }

  /**
   * 取出全部代码块的历史栈，按 codeBlockId 分桶展示。
   * 同一栈内每条操作记录独立成组，不做相邻 update 合并。
   */
  public getCodeBlockHistoryGroups(): StackHistoryGroup<CodeBlockStepValue, 'code-block'>[] {
    const groups: StackHistoryGroup<CodeBlockStepValue, 'code-block'>[] = [];
    Object.entries(this.state.codeBlockState).forEach(([id, undoRedo]) => {
      if (!undoRedo) return;
      const list = undoRedo.getElementList();
      if (!list.length) return;
      const cursor = undoRedo.getCursor();
      groups.push(...mergeStackSteps('code-block', id, list, cursor));
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
   * 取出全部数据源的历史栈，按 dataSourceId 分桶展示。同上，每条操作独立成组。
   */
  public getDataSourceHistoryGroups(): StackHistoryGroup<DataSourceStepValue, 'data-source'>[] {
    const groups: StackHistoryGroup<DataSourceStepValue, 'data-source'>[] = [];
    Object.entries(this.state.dataSourceState).forEach(([id, undoRedo]) => {
      if (!undoRedo) return;
      const list = undoRedo.getElementList();
      if (!list.length) return;
      const cursor = undoRedo.getCursor();
      groups.push(...mergeStackSteps('data-source', id, list, cursor));
    });
    return groups;
  }

  public usePlugin(options: SyncHookPlugin<SyncMethodName, History>): void {
    super.usePlugin(options);
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
  private resolveDbName(dbName: string, appId?: Id): string {
    // 优先用显式传入的 appId（「先恢复再 set root」时 root 尚未就绪）；否则回退到当前 root.id。
    const resolvedAppId = appId ?? editorService.get('root')?.id;
    return resolvedAppId ? `${dbName}-${resolvedAppId}` : dbName;
  }

  private setCanUndoRedo(): void {
    const undoRedo = this.getUndoRedo();
    this.state.canRedo = undoRedo?.canRedo() || false;
    // 初始基线之上才可撤销：cursor 必须高于底线（有 initial 时为 1）。
    this.state.canUndo = undoRedo ? undoRedo.getCursor() > undoFloor(undoRedo) : false;
  }
}

export type HistoryService = History;

export default new History();
