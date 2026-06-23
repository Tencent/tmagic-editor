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

import type { Id } from '@tmagic/core';
import { guid } from '@tmagic/utils';

import type {
  BaseStepValue,
  CodeBlockStepValue,
  DataSourceStepValue,
  HistoryEvents,
  HistoryGroup,
  HistoryOpSource,
  HistoryPersistOptions,
  HistoryState,
  HistoryStepEntry,
  HistoryStepType,
  PersistedHistoryState,
  StepValue,
  SyncHookPlugin,
} from '@editor/type';
import { getEditorConfig } from '@editor/utils/config';
import {
  deserializeStacks,
  getOrCreateStack,
  markStackSaved,
  mergeSteps,
  serializeStacks,
  undoFloor,
} from '@editor/utils/history';
import { idbGet, idbSet } from '@editor/utils/indexed-db';
import { UndoRedo } from '@editor/utils/undo-redo';

import BaseService from './BaseService';
import editorService from './editor';

const canUsePluginMethods = {
  sync: ['push', 'undo', 'redo'] as const,
};

/** 各内置历史类型的默认展示名称（用于历史面板 tab / 分组标题等）。扩展类型可通过 registerStepType / setStepName 登记。 */
const DEFAULT_STEP_NAMES: Record<string, string> = {
  page: '页面',
  codeBlock: '代码块',
  dataSource: '数据源',
};

/** 各历史类型对应的分组 `kind`（展示用）：page→page，codeBlock→code-block，dataSource→data-source。扩展类型缺省回退到 stepType 本身。 */
const STEP_TYPE_KIND: Record<string, string> = {
  page: 'page',
  codeBlock: 'code-block',
  dataSource: 'data-source',
};

type SyncMethodName = Writable<(typeof canUsePluginMethods)['sync']>;

/** 历史记录持久化快照的默认存储位置与结构版本。 */
const DEFAULT_DB_NAME = 'tmagic-editor';
const DEFAULT_STORE_NAME = 'history';
const DEFAULT_KEY: IDBValidKey = 'default';
// 仅把每条 step 的 diff 序列化成字符串，其余字段交给 IndexedDB 结构化克隆原生存储（见 saveToIndexedDB）；
// 全部历史栈统一收敛到 steps 字段（见 HistorySteps）。
const PERSIST_VERSION = 3;

class History extends BaseService {
  public state = reactive<HistoryState>({
    steps: {
      page: {},
      codeBlock: {},
      dataSource: {},
    },
    stepNames: { ...DEFAULT_STEP_NAMES },
  });

  constructor() {
    super([...canUsePluginMethods.sync.map((methodName) => ({ name: methodName, isAsync: false }))]);
  }

  /**
   * 注册一个扩展历史类型，使其可与内置 `page` / `codeBlock` / `dataSource` 一样走统一的
   * {@link push} / {@link undo} / {@link redo}（按 id 分栈、独立 undo/redo）。
   *
   * @param stepType 自定义历史类型标识（勿与内置类型重名）
   * @param options.event push/undo/redo 后派发的事件名，缺省为 `${stepType}-history-change`
   * @param options.name 历史面板中的展示名称（tab / 分组标题等），缺省回退到 stepType 本身
   */
  public registerStepType(stepType: string, options: { event?: string; name?: string } = {}): void {
    this.getStepBucket(stepType);
    if (options.name !== undefined) this.state.stepNames[stepType] = options.name;
  }

  /**
   * 读取指定历史类型的展示名称（用于历史面板 tab / 分组标题等）。
   * 未登记名称时回退到 stepType 本身。
   */
  public getStepName(stepType: HistoryStepType): string {
    return this.state.stepNames[stepType] ?? `${stepType}`;
  }

  /**
   * 设置指定历史类型的展示名称（用于历史面板 tab / 分组标题等）。
   * 内置 `page` / `codeBlock` / `dataSource` 也可在此覆盖默认中文名。
   */
  public setStepName(stepType: HistoryStepType, name: string): void {
    this.state.stepNames[stepType] = name;
  }

  public reset() {
    this.clearAllSteps();
  }

  public resetState(): void {
    this.clearAllSteps();
  }

  /**
   * 为指定历史栈（默认 `page`，也适用于 codeBlock / dataSource / 扩展类型）种入一条「初始基线」记录。
   *
   * 该记录是一条 `opType: 'initial'` 的 step，作为对应栈 **index 0 的固定底线**：
   * - 它是一条真实入栈的 step（随栈一起持久化），但被钉为撤销/回滚的下限——cursor 永不低于它，
   *   因此不会被 undo / goto / revert 触达（详见 {@link undo} / {@link undoFloor}）；
   * - 历史面板把它过滤出分组列表（见 {@link getHistoryGroups}），改由底部「初始」行展示。
   *
   * 仅当目标栈为空时种入（保证 initial 一定位于 index 0）；已存在 initial 底线时不重复种入。
   *
   * @param stepType 历史类型
   * @param id       目标栈 id（page 为 pageId，其余类型为对应资源 id）
   * @param options  基线展示信息（名称 / 描述 / 来源）
   */
  public setMarker(
    stepType: HistoryStepType,
    id: Id,
    options: { name?: string; description?: string; source?: HistoryOpSource; extra?: Record<string, any> } = {},
  ): StepValue | null {
    if (!this.isValidStackId(id)) return null;

    const existing = this.getMarker(stepType, id);
    if (existing) return existing;

    const stack = getOrCreateStack(this.getStepBucket(stepType), id);
    // initial 必须是 index 0；栈非空（已有真实记录、却无 initial，如旧数据）时不强行前插，优雅降级为无基线。
    if (stack.getLength() > 0) return null;

    const marker: StepValue = {
      uuid: guid(),
      opType: 'initial',
      diff: [],
      data: { name: options.name || '', id },
      extra: {
        ...(options.extra || {}),
        ...(stepType === 'page'
          ? {
              selectedBefore: [],
              selectedAfter: [],
              modifiedNodeIds: new Map(),
            }
          : {}),
      },
      historyDescription: options.description || '未修改的初始状态',
      timestamp: Date.now(),
      ...(options.source ? { source: options.source } : {}),
    };
    stack.pushElement(marker);
    this.emit('marker-change', { id, marker, stepType });
    return marker;
  }

  /**
   * 读取指定历史栈的初始基线 step（栈 index 0 且 `opType: 'initial'`）；
   * 不存在或 id 缺省时返回 undefined。
   */
  public getMarker(stepType: HistoryStepType, id?: Id): StepValue | undefined {
    if (!this.isValidStackId(id)) return undefined;
    const first = this.state.steps[stepType]?.[id]?.getElementList()[0];
    return first?.opType === 'initial' ? (first as StepValue) : undefined;
  }

  /**
   * 把一条步骤推入指定历史栈。统一入口，所有类型（page / codeBlock / dataSource / 扩展）行为完全一致：
   * 按 `stepType` 选择目标栈类型，按 `id`（必填）选择具体栈，按需建栈后入栈，并派发对应的历史变更事件
   * （`page` 为 `change`，其余见 {@link registerStepType}），回调签名统一为 `(id, step)`。
   *
   * 跨页 / 跨资源操作（如 `moveToContainer` 把节点搬到其它页）必须显式传入目标 id，
   * 否则无法落到正确的栈。step 可由 `createStackStep` 等构造后传入。
   *
   * @param stepType 历史类型
   * @param step     已构造好的历史记录（缺省自动补全 uuid / timestamp）
   * @param id       目标栈 id（page 为 pageId，其余类型为对应资源 id），必填
   */
  public push(stepType: 'page', step: StepValue, id: Id): StepValue | null;
  public push(stepType: 'codeBlock', step: CodeBlockStepValue, id: Id): CodeBlockStepValue | null;
  public push(stepType: 'dataSource', step: DataSourceStepValue, id: Id): DataSourceStepValue | null;
  public push<T extends BaseStepValue>(stepType: string, step: T, id: Id): T | null;
  public push(stepType: HistoryStepType, step: BaseStepValue, id: Id): BaseStepValue | null {
    if (!this.isValidStackId(id)) return null;
    this.fillStepMeta(step);
    getOrCreateStack(this.getStepBucket(stepType), id).pushElement(step);
    this.emit('change', step, stepType, id);
    return step;
  }

  /**
   * 撤销指定历史栈的最近一次变更。统一入口，所有类型行为一致：
   * 按 `id`（必填）+ `stepType` 定位栈，不会越过 index 0 的 initial 基线（所有类型同等适用），
   * 仅在确有可撤销 step 时派发对应的历史变更事件（`page` 为 `change`，回调签名 `(id, step)`）。
   *
   * @param stepType 历史类型
   * @param id       目标栈 id（page 为 pageId，其余类型为对应资源 id），必填
   */
  public undo(stepType: 'page', id: Id): StepValue | null;
  public undo(stepType: 'codeBlock', id: Id): CodeBlockStepValue | null;
  public undo(stepType: 'dataSource', id: Id): DataSourceStepValue | null;
  public undo<T extends BaseStepValue>(stepType: string, id: Id): T | null;
  public undo(stepType: HistoryStepType, id: Id): BaseStepValue | null {
    if (!this.isValidStackId(id)) return null;
    const undoRedo = this.state.steps[stepType]?.[id];
    if (!undoRedo) return null;
    // 不允许撤销越过初始基线（index 0 的 initial step）；无基线时 floor 为 0。
    if (undoRedo.getCursor() <= undoFloor(undoRedo)) return null;
    const step = undoRedo.undo();
    if (step) this.emit('change', step, stepType, id);
    return step;
  }

  /**
   * 重做指定历史栈的下一次变更。语义与 {@link undo} 对称，详见其说明。
   *
   * @param stepType 历史类型
   * @param id       目标栈 id（page 为 pageId，其余类型为对应资源 id），必填
   */
  public redo(stepType: 'page', id: Id): StepValue | null;
  public redo(stepType: 'codeBlock', id: Id): CodeBlockStepValue | null;
  public redo(stepType: 'dataSource', id: Id): DataSourceStepValue | null;
  public redo<T extends BaseStepValue>(stepType: string, id: Id): T | null;
  public redo(stepType: HistoryStepType, id: Id): BaseStepValue | null {
    if (!this.isValidStackId(id)) return null;
    const undoRedo = this.state.steps[stepType]?.[id];
    if (!undoRedo) return null;
    const step = undoRedo.redo();
    if (step) this.emit('change', step, stepType, id);
    return step;
  }

  /**
   * 是否可对指定历史栈撤销（cursor 高于 initial 基线底线）。
   * @param stepType 历史类型
   * @param id       目标栈 id；缺省 / 无效时返回 false
   */
  public canUndo(stepType: HistoryStepType, id?: Id): boolean {
    if (!this.isValidStackId(id)) return false;
    const undoRedo = this.state.steps[stepType]?.[id];
    return undoRedo ? undoRedo.getCursor() > undoFloor(undoRedo) : false;
  }

  /**
   * 是否可对指定历史栈重做。
   * @param stepType 历史类型
   * @param id       目标栈 id；缺省 / 无效时返回 false
   */
  public canRedo(stepType: HistoryStepType, id?: Id): boolean {
    if (!this.isValidStackId(id)) return false;
    return this.state.steps[stepType]?.[id]?.canRedo() ?? false;
  }

  /** 读取指定页面历史栈当前游标所在的 step（cursor - 1）；无则返回 null。 */
  public getCurrentPageStep(pageId: Id): StepValue | null {
    if (!this.isValidStackId(pageId)) return null;
    return this.state.steps.page[pageId]?.getCurrentElement() ?? null;
  }

  /**
   * 用 `state` 替换指定页面栈当前游标所在的 step（并丢弃其后的重做尾部），游标不变。
   * 用于「连续 set root 记录合并」等就地替换最新一条的场景；替换成功后派发 `change`。
   */
  public replaceCurrentStep(stepType: HistoryStepType, state: StepValue, id: Id): StepValue | null {
    if (!this.isValidStackId(id)) return null;
    const undoRedo = getOrCreateStack(this.getStepBucket(stepType), id);

    this.fillStepMeta(state);

    if (!undoRedo.replaceCurrentElement(state)) return null;
    this.emit('change', state, stepType, id);
    return state;
  }

  public destroy(): void {
    this.resetState();
    this.removeAllListeners();
    this.removeAllPlugins();
  }

  /**
   * 清空历史记录栈。统一入口，所有类型（page / codeBlock / dataSource / 扩展）行为一致：
   * - 传入 `id`：仅清空 `stepType` 下该 id 对应的栈；
   * - 缺省 `id`：清空 `stepType` 下的全部栈。
   *
   * 仅删除撤销/重做记录，不会改动 DSL / 代码块 / 数据源本身。清空时会**保留各栈原有的
   * initial 基线**（文案 / 来源），无基线时清空成空栈。清空后派发 `clear`（签名 `(id, stepType)`）。
   *
   * @param stepType 历史类型
   * @param id       目标栈 id；缺省表示清空该类型下全部栈
   */
  public clear(stepType: HistoryStepType, id?: Id): void {
    const bucket = this.state.steps[stepType];
    if (!bucket) return;

    if (this.isValidStackId(id)) {
      this.clearStack(stepType, id);
    } else if (id === undefined) {
      Object.keys(bucket).forEach((stackId) => this.clearStack(stepType, stackId as Id));
    } else {
      return;
    }
    this.emit('clear', { id: id as Id, stepType });
  }

  /**
   * 标记历史记录为「已保存」（把对应栈当前游标所在的记录标为 `saved`）。统一入口：
   * - 缺省 `id`：标记**全部类型、全部栈**（整份 DSL 落库场景），派发 `mark-saved` 且 `kind: 'all'`；
   * - 传入 `id`：仅标记 `stepType` 下该 id 对应的栈，派发 `mark-saved` 且 `kind` 为 `stepType`。
   *
   * 同一栈内任意时刻最多只有一条记录为 `saved`；从 IndexedDB 恢复时游标会被定位到最近一条已保存记录之后。
   *
   * @param stepType 历史类型
   * @param id       目标栈 id；缺省表示标记全部类型 / 全部栈
   */
  public markSaved(stepType: HistoryStepType, id?: Id): void {
    if (id === undefined) {
      Object.values(this.state.steps).forEach((bucket) => Object.values(bucket).forEach(markStackSaved));
      this.emit('mark-saved', { kind: 'all' });
      return;
    }
    if (!this.isValidStackId(id)) return;
    markStackSaved(this.state.steps[stepType]?.[id]);
    this.emit('mark-saved', { kind: stepType, id });
  }

  /**
   * 把当前内存中的全部历史栈（页面 / 代码块 / 数据源 / 扩展类型）序列化后写入本地 IndexedDB。
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
    const steps: PersistedHistoryState['steps'] = { page: {}, codeBlock: {}, dataSource: {} };
    Object.entries(this.state.steps).forEach(([stepType, bucket]) => {
      steps[stepType] = serializeStacks(bucket);
    });

    const snapshot: PersistedHistoryState = {
      version: PERSIST_VERSION,
      steps,
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
   * - 会整体覆盖当前内存中的历史状态（活动页由 editorService 维护，不在此恢复）；
   * - 找不到对应记录时返回 null，且不改动当前状态；
   * - 不支持 IndexedDB 的环境（如 SSR）会 reject。
   */
  public async restoreFromIndexedDB(options: HistoryPersistOptions = {}): Promise<PersistedHistoryState | null> {
    const { dbName = DEFAULT_DB_NAME, storeName = DEFAULT_STORE_NAME, key = DEFAULT_KEY, appId } = options;

    const snapshot = await idbGet<PersistedHistoryState>(this.resolveDbName(dbName, appId), storeName, key);
    if (!snapshot) return null;

    // 各 step 的 diff 以序列化字符串存储（含函数），由 deserializeStacks 逐条用 parseDSL 还原。
    const parseDSL = getEditorConfig('parseDSL');

    const steps: HistoryState['steps'] = { page: {}, codeBlock: {}, dataSource: {} };
    Object.entries(snapshot.steps).forEach(([stepType, bucket]) => {
      steps[stepType] = deserializeStacks(bucket, parseDSL);
    });
    this.state.steps = steps;
    // initial 基线作为各栈 index 0 的 step 随 steps 一并还原，无需单独恢复；活动页由 editorService 维护。
    this.emit('restore-from-indexed-db', snapshot);
    return snapshot;
  }

  /**
   * 取出指定历史类型（页面 / 代码块 / 数据源 / 扩展类型）某个栈的平铺步骤列表（含 applied 标记）。
   * 统一入口，替代旧的 `getPageStepList` / `getCodeBlockStepList` / `getDataSourceStepList`。
   *
   * 列表按时间正序，最早一步在最前面；`applied` 表示该步骤处于栈游标之前（已应用）。
   * 供 revert / goto 等按 index 索引步骤的场景使用。通常 UI 应使用
   * {@link getHistoryGroups} 取已合并分组的版本；本方法仅为兼容/调试保留。
   *
   * @param stepType 历史类型
   * @param id       目标栈 id（page 为 pageId，其余类型为对应资源 id）；缺省 / 无效时返回空数组
   */
  public getStepList(stepType: 'page', id?: Id): HistoryStepEntry<StepValue>[];
  public getStepList(stepType: 'codeBlock', id: Id): HistoryStepEntry<CodeBlockStepValue>[];
  public getStepList(stepType: 'dataSource', id: Id): HistoryStepEntry<DataSourceStepValue>[];
  public getStepList<T extends BaseStepValue>(stepType: HistoryStepType, id?: Id): HistoryStepEntry<T>[];
  public getStepList(stepType: HistoryStepType, id?: Id): HistoryStepEntry<any>[] {
    if (!this.isValidStackId(id)) return [];
    const undoRedo = this.state.steps[stepType]?.[id];
    if (!undoRedo) return [];
    const list = undoRedo.getElementList();
    const cursor = undoRedo.getCursor();
    return list.map((step, index) => ({ step, index, applied: index < cursor }));
  }

  /**
   * 取出指定历史类型的历史分组（页面 / 代码块 / 数据源 / 扩展类型统一入口）。
   *
   * 把目标栈的步骤列表按"目标"做相邻合并（连续修改同一目标的 update 合并为一组，组内可展开查看每步；
   * add / remove / 多实体 update 始终独立成组），并过滤掉 index 0 的 initial 基线（底部「初始」行由
   * {@link getMarker} 驱动）。各类型行为完全一致，仅 `kind` 与 step 快照类型不同。
   *
   * 作用域：
   * - 传入 `id`：仅取该 id 对应的单个栈（页面历史按活动页查看，传入 pageId）；
   * - 缺省 `id`：遍历该类型下全部栈并汇总（代码块 / 数据源按全部资源分桶展示）。
   *
   * @param stepType 历史类型，缺省 `page`
   * @param id       目标栈 id；缺省表示遍历该类型下全部栈
   */
  public getHistoryGroups(stepType: 'page', id?: Id): HistoryGroup<StepValue>[];
  public getHistoryGroups(stepType: 'codeBlock', id?: Id): HistoryGroup<CodeBlockStepValue>[];
  public getHistoryGroups(stepType: 'dataSource', id?: Id): HistoryGroup<DataSourceStepValue>[];
  public getHistoryGroups<T extends BaseStepValue>(stepType: HistoryStepType, id?: Id): HistoryGroup<T>[];
  public getHistoryGroups(stepType: HistoryStepType, id?: Id): HistoryGroup[] {
    const bucket = this.state.steps[stepType];
    if (!bucket) return [];
    const kind = STEP_TYPE_KIND[stepType] ?? stepType;
    const collect = (stackId: Id): HistoryGroup[] => {
      const undoRedo = bucket[stackId];
      if (!undoRedo) return [];
      const list = undoRedo.getElementList();
      if (!list.length) return [];
      // initial 基线（index 0）不作为普通操作组展示，过滤掉；其余真实 step 的 index 保持不变，
      // 以便面板 goto(index+1) / revert(index) 仍直接对应栈内位置。
      return mergeSteps(kind, stackId, list, undoRedo.getCursor()).filter((group) => group.opType !== 'initial');
    };
    if (this.isValidStackId(id)) return collect(id);
    return Object.keys(bucket).flatMap((stackId) => collect(stackId as Id));
  }

  /**
   * 读取指定历史栈的当前游标（已应用步骤数量）。统一入口，替代旧的
   * `getPageCursor` / `getCodeBlockCursor` / `getDataSourceCursor`。
   * - `id` 缺省或非法、或对应栈不存在时返回 0；
   * - `stepType` 支持 `page` / `codeBlock` / `dataSource` / 扩展类型。
   */
  public getCursor(stepType: HistoryStepType, id?: Id): number {
    if (!this.isValidStackId(id)) return 0;
    return this.state.steps[stepType]?.[id]?.getCursor() ?? 0;
  }

  /**
   * 按历史记录 uuid 在指定历史类型的栈中查找其所属 id 与索引，统一入口，替代旧的
   * `getPageStepIndexByUuid` / `findCodeBlockStepLocationByUuid` / `findDataSourceStepLocationByUuid`。
   *
   * - 传入 `id`：仅在该 id 对应的单个栈中查找（如页面历史按活动页查看，传入 pageId）；
   * - 缺省 `id`：遍历该类型下全部栈查找（代码块 / 数据源等按全部资源分桶的场景）。
   *
   * 找不到时返回 null。供「按 uuid 回滚」等需要把 uuid 映射回 (id, index) 的场景使用。
   *
   * @param stepType 历史类型
   * @param uuid     目标历史记录的 uuid
   * @param id       目标栈 id；缺省表示遍历该类型下全部栈
   */
  public findStepLocationByUuid(stepType: HistoryStepType, uuid: string, id?: Id): { id: Id; index: number } | null {
    if (!uuid) return null;
    const bucket = this.state.steps[stepType];
    if (!bucket) return null;

    if (this.isValidStackId(id)) {
      const index = this.getStepList(stepType, id).findIndex((entry) => entry.step.uuid === uuid);
      return index >= 0 ? { id, index } : null;
    }

    for (const stackId of Object.keys(bucket)) {
      const index = this.getStepList(stepType, stackId as Id).findIndex((entry) => entry.step.uuid === uuid);
      if (index >= 0) return { id: stackId as Id, index };
    }
    return null;
  }

  public usePlugin(options: SyncHookPlugin<SyncMethodName, History>): void {
    super.usePlugin(options);
  }

  public emit<Name extends keyof HistoryEvents, Param extends HistoryEvents[Name]>(eventName: Name, ...args: Param) {
    return super.emit(eventName, ...args);
  }

  /**
   * 取出指定历史类型的栈桶（`Record<id, UndoRedo>`）；不存在时按需创建空桶，
   * 从而支持通过 {@link registerStepType} 或首次 push 动态扩展历史类型。
   */
  private getStepBucket(stepType: string): Record<Id, UndoRedo<any>> {
    if (!this.state.steps[stepType]) {
      this.state.steps[stepType] = {};
    }
    return this.state.steps[stepType];
  }

  /**
   * 清空单个历史栈并按需重建其 initial 基线（保留原基线的文案 / 来源）。
   */
  private clearStack(stepType: HistoryStepType, id: Id): void {
    // 保留原 initial 基线的文案 / 来源（仅清空其后的真实操作记录），无基线时清空成空栈。
    const marker = this.getMarker(stepType, id);
    this.getStepBucket(stepType)[id] = new UndoRedo<any>();
    if (marker) {
      this.setMarker(stepType, id, {
        name: marker.data?.name,
        description: marker.historyDescription,
        source: marker.source,
      });
    }
  }

  /** 入栈前补全 step 的 uuid / timestamp（调用方未指定时）。 */
  private fillStepMeta(step: BaseStepValue): void {
    if (step.uuid === undefined) step.uuid = guid();
    if (step.timestamp === undefined) step.timestamp = Date.now();
  }

  /** 校验「按 id 分栈」类型（codeBlock / dataSource / 扩展）的 id 是否有效。 */
  private isValidStackId(id?: Id): id is Id {
    return id !== undefined && id !== null && `${id}` !== '';
  }

  /** 清空全部历史栈内容（保留已注册的类型键，使扩展类型在 reset 后仍可用）。 */
  private clearAllSteps(): void {
    Object.keys(this.state.steps).forEach((stepType) => {
      this.state.steps[stepType] = {};
    });
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
}

export type HistoryService = History;

export default new History();
