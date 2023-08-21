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

import { EventEmitter } from 'events';

import Moveable from 'moveable';

import { HIGHLIGHT_EL_ID_PREFIX, ZIndex } from './const';
import TargetShadow from './TargetShadow';
import type { GetRootContainer, StageHighlightConfig } from './types';

export default class StageHighlight extends EventEmitter {
  public container: HTMLElement;
  public target?: HTMLElement;
  public moveable?: Moveable;
  public targetShadow?: TargetShadow;
  private getRootContainer: GetRootContainer;

  constructor(config: StageHighlightConfig) {
    super();

    this.container = config.container;
    this.getRootContainer = config.getRootContainer;

    this.targetShadow = new TargetShadow({
      container: config.container,
      updateDragEl: config.updateDragEl,
      zIndex: ZIndex.HIGHLIGHT_EL,
      idPrefix: HIGHLIGHT_EL_ID_PREFIX,
    });
  }

  /**
   * 高亮鼠标悬停的组件
   * @param el 选中组件的Dom节点元素
   */
  public highlight(el: HTMLElement): void {
    if (!el || el === this.target) return;
    this.target = el;

    this.targetShadow?.update(el);
    if (this.moveable) {
      this.moveable.zoom = 2;
      this.moveable.updateRect();
    } else {
      this.moveable = new Moveable(this.container, {
        target: this.targetShadow?.el,
        origin: false,
        rootContainer: this.getRootContainer(),
        zoom: 2,
      });
    }
  }

  /**
   * 清空高亮
   */
  public clearHighlight(): void {
    if (!this.moveable || !this.target) return;
    this.moveable.zoom = 0;
    this.moveable.updateRect();
    this.target = undefined;
  }

  /**
   * 销毁实例
   */
  public destroy(): void {
    this.moveable?.destroy();
    this.targetShadow?.destroy();
    this.moveable = undefined;
    this.targetShadow = undefined;
  }
}
