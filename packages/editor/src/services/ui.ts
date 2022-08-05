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

import { reactive, toRaw } from 'vue';

import type StageCore from '@tmagic/stage';

import editorService from '../services/editor';
import type { GetColumnWidth, SetColumnWidth, StageRect, UiState } from '../type';

import BaseService from './BaseService';

const DEFAULT_LEFT_COLUMN_WIDTH = 310;
const MIN_LEFT_COLUMN_WIDTH = 45;
const DEFAULT_RIGHT_COLUMN_WIDTH = 480;
const MIN_RIGHT_COLUMN_WIDTH = 1;

const COLUMN_WIDTH_STORAGE_KEY = '$MagicEditorColumnWidthData';

const defaultColumnWidth = {
  left: DEFAULT_LEFT_COLUMN_WIDTH,
  center: globalThis.document.body.clientWidth - DEFAULT_LEFT_COLUMN_WIDTH - DEFAULT_RIGHT_COLUMN_WIDTH,
  right: DEFAULT_RIGHT_COLUMN_WIDTH,
};

const state = reactive<UiState>({
  uiSelectMode: false,
  showSrc: false,
  zoom: 1,
  stageContainerRect: {
    width: 0,
    height: 0,
  },
  stageRect: {
    width: 375,
    height: 817,
  },
  columnWidth: defaultColumnWidth,
  showGuides: true,
  showRule: true,
  propsPanelSize: 'small',
});

class Ui extends BaseService {
  constructor() {
    super([]);
    globalThis.addEventListener('resize', () => {
      this.setColumnWidth({
        center: 'auto',
      });
    });

    const columnWidthCacheData = globalThis.localStorage.getItem(COLUMN_WIDTH_STORAGE_KEY);
    if (columnWidthCacheData) {
      try {
        const columnWidthCache = JSON.parse(columnWidthCacheData);
        this.setColumnWidth(columnWidthCache);
      } catch (e) {
        console.error(e);
      }
    }
  }

  public set<T = any>(name: keyof UiState, value: T) {
    const mask = editorService.get<StageCore>('stage')?.mask;

    if (name === 'columnWidth') {
      this.setColumnWidth(value as unknown as SetColumnWidth);
      return;
    }

    if (name === 'stageRect') {
      this.setStageRect(value as unknown as StageRect);
      return;
    }

    if (name === 'showGuides') {
      mask?.showGuides(value as unknown as boolean);
    }

    if (name === 'showRule') {
      mask?.showRule(value as unknown as boolean);
    }

    (state as any)[name] = value;

    if (name === 'stageContainerRect') {
      state.zoom = this.calcZoom();
    }
  }

  public get<T>(name: keyof typeof state): T {
    return (state as any)[name];
  }

  public zoom(zoom: number) {
    this.set('zoom', (this.get<number>('zoom') * 100 + zoom * 100) / 100);
    if (this.get<number>('zoom') < 0.1) this.set('zoom', 0.1);
  }

  private setColumnWidth({ left, center, right }: SetColumnWidth) {
    const columnWidth = {
      ...toRaw(this.get<GetColumnWidth>('columnWidth')),
    };

    if (left) {
      columnWidth.left = Math.max(left, MIN_LEFT_COLUMN_WIDTH);
    }

    if (right) {
      columnWidth.right = Math.max(right, MIN_RIGHT_COLUMN_WIDTH);
    }

    if (!center || center === 'auto') {
      const bodyWidth = globalThis.document.body.clientWidth;
      columnWidth.center = bodyWidth - (columnWidth?.left || 0) - (columnWidth?.right || 0);
      if (columnWidth.center <= 0) {
        columnWidth.left = defaultColumnWidth.left;
        columnWidth.center = defaultColumnWidth.center;
        columnWidth.right = defaultColumnWidth.right;
      }
    } else {
      columnWidth.center = center;
    }

    globalThis.localStorage.setItem(COLUMN_WIDTH_STORAGE_KEY, JSON.stringify(columnWidth));

    state.columnWidth = columnWidth;
  }

  private setStageRect(value: StageRect) {
    state.stageRect = {
      ...state.stageRect,
      ...value,
    };
    state.zoom = this.calcZoom();
  }

  private calcZoom() {
    const { stageRect, stageContainerRect } = state;
    const { height, width } = stageContainerRect;
    if (!width || !height) return 1;

    // 30为标尺的大小
    const stageWidth = stageRect.width + 30;
    const stageHeight = stageRect.height + 30;

    if (width > stageWidth && height > stageHeight) {
      return 1;
    }
    // 60/80是为了不要让画布太过去贴住四周（这样好看些）
    return Math.min((width - 60) / stageWidth || 1, (height - 80) / stageHeight || 1);
  }
}

export type UiService = Ui;

export default new Ui();
