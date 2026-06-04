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

import { getDocument, injectStyle } from '@tmagic/core';

import { ZIndex } from './const';
import { getOffset } from './util';

/** 闪烁提示节点的 class name */
export const FLASH_TIP_CLASS_NAME = 'tmagic-stage-flash-tip';
/** 闪烁动画名称 */
const FLASH_ANIMATION_NAME = 'tmagic-stage-flash';
/** 闪烁动画时长（ms） */
const FLASH_DURATION = 1500;

/**
 * 选中区域闪烁提示
 * @description 当组件不是通过点击画布选中（如从图层树、面包屑等外部选中）时，在画布上对选中区域做一次高亮闪烁，
 * 帮助用户快速定位组件在画布中的位置。
 */
export default class StageFlashHighlight {
  /** 闪烁节点挂载的容器（蒙层的content） */
  private container: HTMLElement;
  private el?: HTMLElement;
  private timer?: NodeJS.Timeout;
  private styleEl?: HTMLStyleElement;

  constructor(config: { container: HTMLElement }) {
    this.container = config.container;
  }

  /**
   * 在目标元素所在区域做一次高亮闪烁
   * @param el 选中组件的Dom节点元素
   */
  public flash(el: HTMLElement): void {
    if (!el) return;

    this.injectStyle();
    this.clear();

    const offset = getOffset(el);
    const { transform } = getComputedStyle(el);

    const flashEl = globalThis.document.createElement('div');
    flashEl.className = FLASH_TIP_CLASS_NAME;
    flashEl.style.cssText = `
      position: absolute;
      box-sizing: border-box;
      pointer-events: none;
      transform: ${transform};
      left: ${offset.left}px;
      top: ${offset.top}px;
      width: ${el.clientWidth}px;
      height: ${el.clientHeight}px;
      z-index: ${ZIndex.SELECTED_EL};
    `;

    this.container.appendChild(flashEl);
    this.el = flashEl;

    this.timer = globalThis.setTimeout(() => {
      this.clear();
    }, FLASH_DURATION);
  }

  /**
   * 清除闪烁节点
   */
  public clear(): void {
    if (this.timer) {
      globalThis.clearTimeout(this.timer);
      this.timer = undefined;
    }
    this.el?.remove();
    this.el = undefined;
  }

  /**
   * 销毁实例
   */
  public destroy(): void {
    this.clear();
    this.styleEl?.remove();
    this.styleEl = undefined;
  }

  /**
   * 注入闪烁动画样式（仅注入一次）
   */
  private injectStyle(): void {
    if (this.styleEl) return;

    this.styleEl = injectStyle(
      getDocument(),
      `
      @keyframes ${FLASH_ANIMATION_NAME} {
        0% {
          opacity: 0;
          background-color: rgba(146, 84, 222, 0);
        }
        20% {
          opacity: 1;
          background-color: rgba(146, 84, 222, 0.7);
        }
        45% {
          opacity: 0.6;
          background-color: rgba(146, 84, 222, 0.4);
        }
        70% {
          opacity: 1;
          background-color: rgba(146, 84, 222, 0.7);
        }
        100% {
          opacity: 0;
          background-color: rgba(146, 84, 222, 0);
        }
      }
      .${FLASH_TIP_CLASS_NAME} {
        border: 2px solid #9254de;
        border-radius: 2px;
        animation: ${FLASH_ANIMATION_NAME} ${FLASH_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1) both;
      }
      `,
    );
  }
}
