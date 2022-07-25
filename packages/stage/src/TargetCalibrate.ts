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

import { Mode, ZIndex } from './const';
import StageCore from './StageCore';
import StageDragResize from './StageDragResize';
import StageMask from './StageMask';
import type { Offset, TargetCalibrateConfig } from './types';
import { getMode } from './util';

/**
 * 将选中的节点修正定位后，添加一个操作节点到蒙层上
 */
export default class TargetCalibrate extends EventEmitter {
  public parent: HTMLElement;
  public mask: StageMask;
  public dr: StageDragResize;
  public core: StageCore;
  public operationEl: HTMLDivElement;

  constructor(config: TargetCalibrateConfig) {
    super();

    this.parent = config.parent;
    this.mask = config.mask;
    this.dr = config.dr;
    this.core = config.core;

    this.operationEl = globalThis.document.createElement('div');
    this.parent.append(this.operationEl);
  }

  public update(el: HTMLElement, prefix: String): HTMLElement {
    const { left, top } = this.getOffset(el);
    const { transform } = getComputedStyle(el);
    this.operationEl.style.cssText = `
      position: absolute;
      transform: ${transform};
      left: ${left}px;
      top: ${top}px;
      width: ${el.clientWidth}px;
      height: ${el.clientHeight}px;
      z-index: ${ZIndex.DRAG_EL};
    `;

    this.operationEl.id = `${prefix}${el.id}`;

    if (typeof this.core.config.updateDragEl === 'function') {
      this.core.config.updateDragEl(this.operationEl, el);
    }

    return this.operationEl;
  }

  public destroy(): void {
    this.operationEl?.remove();
  }

  private getOffset(el: HTMLElement): Offset {
    const { offsetParent } = el;

    const left = el.offsetLeft;
    const top = el.offsetTop;

    if (offsetParent) {
      const parentOffset = this.getOffset(offsetParent as HTMLElement);
      return {
        left: left + parentOffset.left,
        top: top + parentOffset.top,
      };
    }

    // 选中固定定位元素后editor-mask高度被置为视窗大小
    if (this.dr.mode === Mode.FIXED) {
      // 弹窗的情况
      if (getMode(el) === Mode.FIXED) {
        return {
          left,
          top,
        };
      }

      return {
        left: left - this.mask.scrollLeft,
        top: top - this.mask.scrollTop,
      };
    }

    // 无父元素的固定定位需按滚动值计算
    if (getMode(el) === Mode.FIXED) {
      return {
        left: left + this.mask.scrollLeft,
        top: top + this.mask.scrollTop,
      };
    }

    return {
      left,
      top,
    };
  }
}
