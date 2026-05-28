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

import type { CodeBlockStepValue, DataSourceStepValue, HistoryState, StepValue } from '@editor/type';
import { UndoRedo } from '@editor/utils/undo-redo';

import BaseService from './BaseService';

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
    },
  ): CodeBlockStepValue | null {
    if (!codeBlockId) return null;

    const step: CodeBlockStepValue = {
      id: codeBlockId,
      oldContent: payload.oldContent ? cloneDeep(payload.oldContent) : null,
      newContent: payload.newContent ? cloneDeep(payload.newContent) : null,
      changeRecords: payload.changeRecords?.length ? cloneDeep(payload.changeRecords) : undefined,
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
    },
  ): DataSourceStepValue | null {
    if (!dataSourceId) return null;

    const step: DataSourceStepValue = {
      id: dataSourceId,
      oldSchema: payload.oldSchema ? cloneDeep(payload.oldSchema) : null,
      newSchema: payload.newSchema ? cloneDeep(payload.newSchema) : null,
      changeRecords: payload.changeRecords?.length ? cloneDeep(payload.changeRecords) : undefined,
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
