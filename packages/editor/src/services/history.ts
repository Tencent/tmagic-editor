/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
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

import type { Id, MPage } from '@tmagic/schema';

import { UndoRedo } from '../utils/undo-redo';

import BaseService from './BaseService';

export interface StepValue {
  data: MPage;
  modifiedNodeIds: Map<Id, Id>;
  nodeId: Id;
}

export interface HistoryState {
  pageId?: Id;
  pageSteps: Record<Id, UndoRedo<StepValue>>;
  canRedo: boolean;
  canUndo: boolean;
}

class History extends BaseService {
  public state = reactive<HistoryState>({
    pageSteps: {},
    pageId: undefined,
    canRedo: false,
    canUndo: false,
  });

  constructor() {
    super([]);

    this.on('change', this.setCanUndoRedo);
  }

  public reset() {
    this.state.pageSteps = {};
    this.state.pageId = undefined;
    this.state.canRedo = false;
    this.state.canUndo = false;
  }

  public changePage(page: MPage): void {
    if (!page) return;

    this.state.pageId = page.id;

    if (!this.state.pageSteps[this.state.pageId]) {
      const undoRedo = new UndoRedo<StepValue>();

      undoRedo.pushElement({
        data: page,
        modifiedNodeIds: new Map(),
        nodeId: page.id,
      });

      this.state.pageSteps[this.state.pageId] = undoRedo;
    }

    this.setCanUndoRedo();
  }

  public empty(): void {
    this.state.pageId = undefined;
    this.state.pageSteps = {};
    this.state.canRedo = false;
    this.state.canUndo = false;
  }

  public push(state: StepValue): StepValue | null {
    const undoRedo = this.getUndoRedo();
    if (!undoRedo) return null;
    undoRedo.pushElement(state);
    this.emit('change', state);
    return state;
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
    this.empty();
    this.removeAllListeners();
  }

  private getUndoRedo() {
    if (!this.state.pageId) return null;
    return this.state.pageSteps[this.state.pageId];
  }

  private setCanUndoRedo(): void {
    const undoRedo = this.getUndoRedo();
    this.state.canRedo = undoRedo?.canRedo() || false;
    this.state.canUndo = undoRedo?.canUndo() || false;
  }
}

export type HistoryService = History;

export default new History();
