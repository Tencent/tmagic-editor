/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2023 THL A29 Limited, a Tencent company.  All rights reserved.
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

import { convertToNumber } from '@tmagic/utils';

import editorService from '@editor/services/editor';
import type { AsyncHookPlugin, StageRect, UiState } from '@editor/type';

import BaseService from './BaseService';

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
  columnWidth: {
    left: 0,
    right: 0,
    center: 0,
  },
  showGuides: true,
  showRule: true,
  propsPanelSize: 'small',
  showAddPageButton: true,
  hideSlideBar: false,
  navMenuRect: {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  },
});

const canUsePluginMethods = {
  async: ['zoom', 'calcZoom'] as const,
  sync: [] as const,
};

type AsyncMethodName = Writable<(typeof canUsePluginMethods)['async']>;

class Ui extends BaseService {
  constructor() {
    super(canUsePluginMethods.async.map((methodName) => ({ name: methodName, isAsync: true })));
  }

  public set<K extends keyof UiState, T extends UiState[K]>(name: K, value: T) {
    const mask = editorService.get('stage')?.mask;

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

    state[name] = value;
  }

  public get<K extends keyof UiState>(name: K) {
    return state[name];
  }

  public async zoom(zoom: number) {
    this.set('zoom', (this.get('zoom') * 100 + zoom * 100) / 100);
    if (this.get('zoom') < 0.1) this.set('zoom', 0.1);
  }

  public async calcZoom() {
    const { stageRect, stageContainerRect } = state;
    const { height, width } = stageContainerRect;
    if (!width || !height) return 1;

    let stageWidth: number = convertToNumber(stageRect.width, width);
    let stageHeight: number = convertToNumber(stageRect.height, height);

    // 30为标尺的大小
    stageWidth = stageWidth + 30;
    stageHeight = stageHeight + 30;

    if (width > stageWidth && height > stageHeight) {
      return 1;
    }
    // 60/80是为了不要让画布太过去贴住四周（这样好看些）
    return Math.min((width - 60) / stageWidth || 1, (height - 80) / stageHeight || 1);
  }

  public resetState() {
    this.set('showSrc', false);
    this.set('uiSelectMode', false);
    this.set('zoom', 1);
    this.set('stageContainerRect', {
      width: 0,
      height: 0,
    });
  }

  public destroy() {
    this.resetState();
    this.removeAllListeners();
    this.removeAllPlugins();
  }

  public usePlugin(options: AsyncHookPlugin<AsyncMethodName, Ui>): void {
    super.usePlugin(options);
  }

  private async setStageRect(value: StageRect) {
    state.stageRect = {
      ...state.stageRect,
      ...value,
    };
    state.zoom = await this.calcZoom();
  }
}

export type UiService = Ui;

export default new Ui();
