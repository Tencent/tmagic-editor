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

/* eslint-disable no-param-reassign */
import { EventEmitter } from 'events';

import { Mode } from './const';
import StageDragResize from './StageDragResize';
import StageMask from './StageMask';
import type { Offset, Rect, TargetCalibrateConfig } from './types';
import { getMode } from './util';

/**
 * 将选中的节点修正定位后，添加一个操作节点到蒙层上
 */
export default class TargetCalibrate extends EventEmitter {
  public parent: HTMLElement;
  public mask: StageMask;
  public dr: StageDragResize;
  public operationEl: HTMLElement;

  constructor(config: TargetCalibrateConfig) {
    super();

    this.parent = config.parent;
    this.mask = config.mask;
    this.dr = config.dr;

    this.operationEl = globalThis.document.createElement('div');
    this.parent.append(this.operationEl);
  }

  public update(el: HTMLElement, prefix: String): HTMLElement {
    const { width, height } = el.getBoundingClientRect();
    const { left, top } = this.getOffset(el);
    this.operationEl.style.cssText = `
      position: absolute;
      left: ${left}px;
      top: ${top}px;
      width: ${width}px;
      height: ${height}px;
    `;

    this.operationEl.id = `${prefix}${el.id}`;
    return this.operationEl;
  }

  /**
   * 设置样式属性
   * @param rect 样式属性
   */
  public resetRect(rect: Rect): void {
    this.operationEl.style.width = `${rect.width}px`;
    this.operationEl.style.height = `${rect.height}px`;
    Object.keys(rect).forEach((key: string) => {
      this.operationEl.style[key] = `${rect[key]}px`;
    });
  }

  public destroy(): void {
    this.operationEl?.remove();
  }

  private getOffset(el: HTMLElement): Offset {
    const { transform } = getComputedStyle(el);
    const { offsetParent } = el;

    let left = el.offsetLeft;
    let top = el.offsetTop;

    if (transform.indexOf('matrix') > -1) {
      let a = 1;
      let b = 1;
      let c = 1;
      let d = 1;
      let e = 0;
      let f = 0;
      transform.replace(
        /matrix\((.+), (.+), (.+), (.+), (.+), (.+)\)/,
        ($0: string, $1: string, $2: string, $3: string, $4: string, $5: string, $6: string): string => {
          a = +$1;
          b = +$2;
          c = +$3;
          d = +$4;
          e = +$5;
          f = +$6;
          return transform;
        },
      );

      left = a * left + c * top + e;
      top = b * left + d * top + f;
    }

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
