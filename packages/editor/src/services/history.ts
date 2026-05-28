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

import type { CodeBlockContent, DataSourceSchema, Id, MPage, MPageFragment } from '@tmagic/core';
import type { ChangeRecord } from '@tmagic/form';

import type {
  CodeBlockHistoryGroup,
  CodeBlockStepValue,
  DataSourceHistoryGroup,
  DataSourceStepValue,
  HistoryState,
  PageHistoryGroup,
  PageHistoryStepEntry,
  StepValue,
} from '@editor/type';
import { UndoRedo } from '@editor/utils/undo-redo';

import BaseService from './BaseService';

class History extends BaseService {
  /**
   * 把单个代码块栈拆成若干 group：
   * - 把"新增/删除"独立成组（语义上属于一次性事件，不应与 update 合并）；
   * - 连续 'update' 合并到同一组，组内 steps 顺序就是发生顺序。
   */
  private static mergeCodeBlockSteps(
    codeBlockId: Id,
    list: CodeBlockStepValue[],
    cursor: number,
  ): CodeBlockHistoryGroup[] {
    const groups: CodeBlockHistoryGroup[] = [];
    let current: CodeBlockHistoryGroup | null = null;
    const currentIndex = cursor - 1;
    list.forEach((step, index) => {
      const opType = History.detectOpType(step.oldContent, step.newContent);
      const applied = index < cursor;
      const isCurrent = index === currentIndex;
      if (opType === 'update' && current?.opType === 'update') {
        current.steps.push({ step, index, applied, isCurrent });
        current.applied = applied;
        if (isCurrent) current.isCurrent = true;
      } else {
        current = {
          kind: 'code-block',
          id: codeBlockId,
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

  private static mergeDataSourceSteps(
    dataSourceId: Id,
    list: DataSourceStepValue[],
    cursor: number,
  ): DataSourceHistoryGroup[] {
    const groups: DataSourceHistoryGroup[] = [];
    let current: DataSourceHistoryGroup | null = null;
    const currentIndex = cursor - 1;
    list.forEach((step, index) => {
      const opType = History.detectOpType(step.oldSchema, step.newSchema);
      const applied = index < cursor;
      const isCurrent = index === currentIndex;
      if (opType === 'update' && current?.opType === 'update') {
        current.steps.push({ step, index, applied, isCurrent });
        current.applied = applied;
        if (isCurrent) current.isCurrent = true;
      } else {
        current = {
          kind: 'data-source',
          id: dataSourceId,
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
    const items = step.updatedItems;
    if (items?.length !== 1) return undefined;
    return items[0].newNode?.id ?? items[0].oldNode?.id;
  }

  /** 解析 StepValue 中的目标节点可读名（用于 UI 展示）。 */
  private static detectPageTargetName(step: StepValue): string | undefined {
    if (step.opType === 'update') {
      const items = step.updatedItems;
      if (items?.length === 1) {
        const node = items[0].newNode || items[0].oldNode;
        return (node?.name as string) || (node?.type as string) || (node?.id !== undefined ? `${node.id}` : undefined);
      }
      return items?.length ? `${items.length} 个节点` : undefined;
    }
    if (step.opType === 'add') {
      if (step.nodes?.length === 1) {
        const n = step.nodes[0];
        return (n.name as string) || (n.type as string) || `${n.id}`;
      }
      return step.nodes?.length ? `${step.nodes.length} 个节点` : undefined;
    }
    if (step.opType === 'remove') {
      if (step.removedItems?.length === 1) {
        const n = step.removedItems[0].node;
        return (n.name as string) || (n.type as string) || `${n.id}`;
      }
      return step.removedItems?.length ? `${step.removedItems.length} 个节点` : undefined;
    }
    return undefined;
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
    },
  ): CodeBlockStepValue | null {
    if (!codeBlockId) return null;

    const step: CodeBlockStepValue = {
      id: codeBlockId,
      oldContent: payload.oldContent ? cloneDeep(payload.oldContent) : null,
      newContent: payload.newContent ? cloneDeep(payload.newContent) : null,
      changeRecords: payload.changeRecords?.length ? cloneDeep(payload.changeRecords) : undefined,
      historyDescription: payload.historyDescription,
    };

    this.getCodeBlockUndoRedo(codeBlockId).pushElement(step);
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
    },
  ): DataSourceStepValue | null {
    if (!dataSourceId) return null;

    const step: DataSourceStepValue = {
      id: dataSourceId,
      oldSchema: payload.oldSchema ? cloneDeep(payload.oldSchema) : null,
      newSchema: payload.newSchema ? cloneDeep(payload.newSchema) : null,
      changeRecords: payload.changeRecords?.length ? cloneDeep(payload.changeRecords) : undefined,
      historyDescription: payload.historyDescription,
    };

    this.getDataSourceUndoRedo(dataSourceId).pushElement(step);
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
      groups.push(...History.mergeCodeBlockSteps(id, list, cursor));
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
   * 取出全部数据源的历史栈，按 dataSourceId 分组。同上。
   */
  public getDataSourceHistoryGroups(): DataSourceHistoryGroup[] {
    const groups: DataSourceHistoryGroup[] = [];
    Object.entries(this.state.dataSourceState).forEach(([id, undoRedo]) => {
      if (!undoRedo) return;
      const list = undoRedo.getElementList();
      if (!list.length) return;
      const cursor = undoRedo.getCursor();
      groups.push(...History.mergeDataSourceSteps(id, list, cursor));
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

  private setCanUndoRedo(): void {
    const undoRedo = this.getUndoRedo();
    this.state.canRedo = undoRedo?.canRedo() || false;
    this.state.canUndo = undoRedo?.canUndo() || false;
  }

  /**
   * 按 id 获取（或创建）指定代码块的 UndoRedo 栈。
   */
  private getCodeBlockUndoRedo(codeBlockId: Id): UndoRedo<CodeBlockStepValue> {
    if (!this.state.codeBlockState[codeBlockId]) {
      this.state.codeBlockState[codeBlockId] = new UndoRedo<CodeBlockStepValue>();
    }
    return this.state.codeBlockState[codeBlockId];
  }

  /**
   * 按 id 获取（或创建）指定数据源的 UndoRedo 栈。
   */
  private getDataSourceUndoRedo(dataSourceId: Id): UndoRedo<DataSourceStepValue> {
    if (!this.state.dataSourceState[dataSourceId]) {
      this.state.dataSourceState[dataSourceId] = new UndoRedo<DataSourceStepValue>();
    }
    return this.state.dataSourceState[dataSourceId];
  }
}

export type HistoryService = History;

export default new History();
