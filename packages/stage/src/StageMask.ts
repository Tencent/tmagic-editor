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

import { throttle } from 'lodash-es';

import { Mode, MouseButton, ZIndex } from './const';
import Rule from './Rule';
import type StageCore from './StageCore';
import type { StageMaskConfig } from './types';
import { createDiv, getScrollParent, isFixedParent } from './util';

const wrapperClassName = 'editor-mask-wrapper';
const throttleTime = 300;

const hideScrollbar = () => {
  const style = globalThis.document.createElement('style');
  style.innerHTML = `
    .${wrapperClassName}::-webkit-scrollbar { width: 0 !important; display: none }
  `;
  globalThis.document.head.appendChild(style);
};

const createContent = (): HTMLDivElement =>
  createDiv({
    className: 'editor-mask',
    cssText: `
    position: absolute;
    top: 0;
    left: 0;
    transform: translate3d(0, 0, 0);
  `,
  });

const createWrapper = (): HTMLDivElement => {
  const el = createDiv({
    className: wrapperClassName,
    cssText: `
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      overflow: hidden;
      z-index: ${ZIndex.MASK};
    `,
  });

  hideScrollbar();

  return el;
};

/**
 * 蒙层
 * @description 用于拦截页面的点击动作，避免点击时触发组件自身动作；在编辑器中点击组件应当是选中组件；
 */
export default class StageMask extends Rule {
  public content: HTMLDivElement = createContent();
  public wrapper: HTMLDivElement;
  public core: StageCore;
  public page: HTMLElement | null = null;
  public pageScrollParent: HTMLElement | null = null;
  public scrollTop = 0;
  public scrollLeft = 0;
  public width = 0;
  public height = 0;
  public wrapperHeight = 0;
  public wrapperWidth = 0;

  private mode: Mode = Mode.ABSOLUTE;
  private pageResizeObserver: ResizeObserver | null = null;
  private wrapperResizeObserver: ResizeObserver | null = null;
  /**
   * 高亮事件处理函数
   * @param event 事件对象
   */
  private highlightHandler = throttle((event: MouseEvent): void => {
    this.emit('highlight', event);
  }, throttleTime);

  constructor(config: StageMaskConfig) {
    const wrapper = createWrapper();
    super(wrapper);

    this.wrapper = wrapper;
    this.core = config.core;

    this.content.addEventListener('mousedown', this.mouseDownHandler);
    this.wrapper.appendChild(this.content);
    this.content.addEventListener('wheel', this.mouseWheelHandler);
    this.content.addEventListener('mousemove', this.highlightHandler);
  }

  public setMode(mode: Mode) {
    this.mode = mode;
    this.scroll();
    if (mode === Mode.FIXED) {
      this.content.style.width = `${this.wrapperWidth}px`;
      this.content.style.height = `${this.wrapperHeight}px`;
    } else {
      this.content.style.width = `${this.width}px`;
      this.content.style.height = `${this.height}px`;
    }
  }

  /**
   * 监听页面大小变化
   * @description 同步页面与mask的大小
   * @param page 页面Dom节点
   */
  public observe(page: HTMLElement): void {
    if (!page) return;

    this.page = page;
    this.pageScrollParent = getScrollParent(page) || this.core.renderer.contentWindow?.document.documentElement || null;
    this.pageResizeObserver?.disconnect();

    if (typeof ResizeObserver !== 'undefined') {
      this.pageResizeObserver = new ResizeObserver((entries) => {
        const [entry] = entries;
        const { clientHeight, clientWidth } = entry.target;
        this.setHeight(clientHeight);
        this.setWidth(clientWidth);
      });

      this.pageResizeObserver.observe(page);

      this.wrapperResizeObserver = new ResizeObserver((entries) => {
        const [entry] = entries;
        const { clientHeight, clientWidth } = entry.target;
        this.wrapperHeight = clientHeight;
        this.wrapperWidth = clientWidth;
      });
      this.wrapperResizeObserver.observe(this.wrapper);
    }
  }

  /**
   * 挂载Dom节点
   * @param el 将蒙层挂载到该Dom节点上
   */
  public mount(el: HTMLDivElement): void {
    if (!this.content) throw new Error('content 不存在');

    el.appendChild(this.wrapper);
  }

  public setLayout(el: HTMLElement): void {
    this.setMode(isFixedParent(el) ? Mode.FIXED : Mode.ABSOLUTE);
  }

  /**
   * 销毁实例
   */
  public destroy(): void {
    this.content?.remove();
    this.page = null;
    this.pageScrollParent = null;
    this.pageResizeObserver?.disconnect();
    this.wrapperResizeObserver?.disconnect();
    super.destroy();
  }

  private scroll() {
    let { scrollLeft, scrollTop } = this;

    if (this.mode === Mode.FIXED) {
      scrollLeft = 0;
      scrollTop = 0;
    }

    this.scrollRule(scrollTop);
    this.scrollTo(scrollLeft, scrollTop);
  }

  private scrollTo(scrollLeft: number, scrollTop: number): void {
    this.content.style.transform = `translate3d(${-scrollLeft}px, ${-scrollTop}px, 0)`;
  }

  /**
   * 设置蒙层高度
   * @param height 高度
   */
  private setHeight(height: number): void {
    this.height = height;
    this.content.style.height = `${height}px`;
  }

  /**
   * 设置蒙层宽度
   * @param width 宽度
   */
  private setWidth(width: number): void {
    this.width = width;
    this.content.style.width = `${width}px`;
  }

  /**
   * 点击事件处理函数
   * @param event 事件对象
   */
  private mouseDownHandler = (event: MouseEvent): void => {
    this.emit('clearHighlight');

    event.stopImmediatePropagation();
    event.stopPropagation();

    if (event.button !== MouseButton.LEFT && event.button !== MouseButton.RIGHT) return;

    // 点击的对象如果是选中框，则不需要再触发选中了，而可能是拖动行为
    if ((event.target as HTMLDivElement).className.indexOf('moveable-control') !== -1) {
      return;
    }

    this.content.removeEventListener('mousemove', this.highlightHandler);

    this.emit('beforeSelect', event);

    // 如果是右键点击，这里的mouseup事件监听没有效果
    globalThis.document.addEventListener('mouseup', this.mouseUpHandler);
  };

  private mouseUpHandler = (): void => {
    globalThis.document.removeEventListener('mouseup', this.mouseUpHandler);
    this.content.addEventListener('mousemove', this.highlightHandler);
    this.emit('select');
  };

  private mouseWheelHandler = (event: WheelEvent) => {
    this.emit('clearHighlight');
    if (!this.page) throw new Error('page 未初始化');

    const { deltaY, deltaX } = event;
    const { height, wrapperHeight, width, wrapperWidth } = this;

    const maxScrollTop = height - wrapperHeight;
    const maxScrollLeft = width - wrapperWidth;

    if (maxScrollTop > 0) {
      if (deltaY > 0) {
        this.scrollTop = this.scrollTop + Math.min(maxScrollTop - this.scrollTop, deltaY);
      } else {
        this.scrollTop = Math.max(this.scrollTop + deltaY, 0);
      }
    }

    if (width > wrapperWidth) {
      if (deltaX > 0) {
        this.scrollLeft = this.scrollLeft + Math.min(maxScrollLeft - this.scrollLeft, deltaX);
      } else {
        this.scrollLeft = Math.max(this.scrollLeft + deltaX, 0);
      }
    }

    if (this.mode !== Mode.FIXED) {
      this.scrollTo(this.scrollLeft, this.scrollTop);
    }

    if (this.pageScrollParent) {
      this.pageScrollParent.scrollTo({
        top: this.scrollTop,
        left: this.scrollLeft,
      });
    }
    this.scroll();

    this.emit('scroll', event);
  };
}
