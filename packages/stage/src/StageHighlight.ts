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

import { EventEmitter } from 'events';

import Moveable from 'moveable';

import { HIGHLIGHT_EL_ID_PREFIX } from './const';
import StageCore from './StageCore';
import TargetCalibrate from './TargetCalibrate';
import type { StageHighlightConfig } from './types';
export default class StageHighlight extends EventEmitter {
  public core: StageCore;
  public container: HTMLElement;
  public target?: HTMLElement;
  public moveable?: Moveable;
  public calibrationTarget: TargetCalibrate;

  constructor(config: StageHighlightConfig) {
    super();

    this.core = config.core;
    this.container = config.container;
    this.calibrationTarget = new TargetCalibrate({
      parent: this.core.mask.content,
      mask: this.core.mask,
      dr: this.core.dr,
      core: this.core,
    });
  }

  /**
   * 高亮鼠标悬停的组件
   * @param el 选中组件的Dom节点元素
   */
  public highlight(el: HTMLElement): void {
    if (!el || el === this.target) return;
    this.target = el;
    this.moveable?.destroy();

    this.moveable = new Moveable(this.container, {
      target: this.calibrationTarget.update(el, HIGHLIGHT_EL_ID_PREFIX),
      origin: false,
      rootContainer: this.core.container,
      zoom: 2,
    });
  }

  /**
   * 清空高亮
   */
  public clearHighlight(): void {
    if (!this.moveable) return;
    this.target = undefined;
    this.moveable.target = null;
    this.moveable.updateTarget();
  }

  /**
   * 销毁实例
   */
  public destroy(): void {
    this.moveable?.destroy();
    this.calibrationTarget.destroy();
  }
}
