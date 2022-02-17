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

import Guides from '@scena/guides';
import { isNumber } from 'lodash';

import { GHOST_EL_ID_PREFIX } from './const';
import type StageCore from './StageCore';
import type { CanSelect, StageMaskConfig } from './types';
import { MouseButton, ZIndex } from './types';

const wrapperClassName = 'editor-mask-wrapper';

const hideScrollbar = () => {
  const style = globalThis.document.createElement('style');
  style.innerHTML = `
    .${wrapperClassName}::-webkit-scrollbar { width: 0 !important; display: none }
  `;
  globalThis.document.head.appendChild(style);
};

const createContent = (): HTMLDivElement => {
  const el = globalThis.document.createElement('div');
  el.className = 'editor-mask';
  el.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    transform: translate3d(0, 0, 0);
  `;
  return el;
};

const createWrapper = (): HTMLDivElement => {
  const el = globalThis.document.createElement('div');
  el.className = wrapperClassName;
  el.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    overflow: auto;
    z-index: ${ZIndex.MASK};
  `;

  hideScrollbar();

  return el;
};

/**
 * 蒙层
 * @description 用于拦截页面的点击动作，避免点击时触发组件自身动作；在编辑器中点击组件应当是选中组件；
 */
export default class StageMask extends EventEmitter {
  public content: HTMLDivElement = createContent();
  public wrapper: HTMLDivElement = createWrapper();
  public core: StageCore;
  public page: HTMLElement | null = null;

  public hGuides: Guides;
  public vGuides: Guides;

  private target: Element | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private parentResizeObserver: ResizeObserver | null = null;
  private canSelect: CanSelect;

  constructor(config: StageMaskConfig) {
    super();

    this.core = config.core;
    const { config: coreConfig } = config.core;

    this.canSelect = coreConfig.canSelect || ((el: HTMLElement) => !!el.id);
    this.content.addEventListener('mousedown', this.mouseDownHandler, true);
    this.content.addEventListener('contextmenu', this.contextmenuHandler, true);
    this.wrapper.appendChild(this.content);

    this.hGuides = this.createGuides('horizontal');
    this.vGuides = this.createGuides('vertical');
  }

  /**
   * 设置成固定定位模式
   */
  public setFixed(): void {
    this.wrapper.scrollTo({
      top: 0,
    });
    this.wrapper.style.overflow = 'hidden';
    // 要等滚动条滚上去，才刷新选中框
    setTimeout(() => {
      this.core.dr.refresh();
    });
  }

  /**
   * 设置成绝对定位模式
   */
  public setAbsolute(): void {
    this.wrapper.style.overflow = 'auto';
  }

  /**
   * 监听页面大小变化
   * @description 同步页面与mask的大小
   * @param page 页面Dom节点
   */
  public observe(page: HTMLElement): void {
    if (!page) return;

    this.page = page;
    this.resizeObserver?.disconnect();

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        const [entry] = entries;
        const { clientHeight, clientWidth } = entry.target;
        this.setHeight(clientHeight);
        this.setWidth(clientWidth);
      });

      this.resizeObserver.observe(page);
    }
  }

  /**
   * 挂载Dom节点
   * @param el 将蒙层挂载到该Dom节点上
   */
  public mount(el: HTMLDivElement): void {
    if (!this.content) throw new Error('content 不存在');

    el.appendChild(this.wrapper);

    this.parentResizeObserver = new ResizeObserver(() => {
      this.vGuides.resize();
      this.hGuides.resize();
    });
    this.parentResizeObserver.observe(el);
  }

  /**
   * 销毁实例
   */
  public destroy(): void {
    this.content?.remove();
    this.page = null;
    this.resizeObserver?.disconnect();
    this.parentResizeObserver?.disconnect();
    this.removeAllListeners();
  }

  /**
   * 是否显示标尺
   * @param show 是否显示
   */
  public showGuides(show = true) {
    this.hGuides.setState({
      showGuides: show,
    });

    this.vGuides.setState({
      showGuides: show,
    });
  }

  /**
   * 是否显示标尺
   * @param show 是否显示
   */
  public showRule(show = true) {
    this.hGuides.setState({
      rulerStyle: {
        visibility: show ? '' : 'hidden',
      },
    });

    this.vGuides.setState({
      rulerStyle: {
        visibility: show ? '' : 'hidden',
      },
    });
  }

  /**
   * 清空所有参考线
   */
  public clearGuides() {
    this.vGuides.setState({
      defaultGuides: [],
    });
    this.hGuides.setState({
      defaultGuides: [],
    });
  }

  /**
   * 设置蒙层高度
   * @param height 高度
   */
  private setHeight(height: number | string): void {
    this.content.style.height = isNumber(height) ? `${height}px` : height;
  }

  /**
   * 设置蒙层宽度
   * @param width 宽度
   */
  private setWidth(width: number | string): void {
    this.content.style.width = isNumber(width) ? `${width}px` : width;
  }

  /**
   * 点击事件处理函数
   * @param event 事件对象
   */
  private mouseDownHandler = async (event: MouseEvent): Promise<void> => {
    if (event.button !== MouseButton.LEFT) return;

    // 点击的对象如果是选中框，则不需要再触发选中了，而可能是拖动行为
    if ((event.target as HTMLDivElement).className.indexOf('moveable-control') !== -1) {
      return;
    }

    this.select(event);
  };

  private mouseUpHandler = (): void => {
    this.content?.removeEventListener('mouseup', this.mouseUpHandler, true);
    this.emit('selected', this.target);
    this.target = null;
  };

  private contextmenuHandler = async (event: MouseEvent): Promise<void> => {
    await this.select(event);
    this.mouseUpHandler();
  };

  private async select(event: MouseEvent) {
    const { renderer, zoom } = this.core;

    const doc = renderer.contentWindow?.document;
    let x = event.clientX;
    let y = event.clientY;

    if (renderer.iframe) {
      const rect = renderer.iframe.getClientRects()[0];
      if (rect) {
        x = x - rect.left;
        y = y - rect.top;
      }
    }

    const els = doc?.elementsFromPoint(x / zoom, y / zoom) as HTMLElement[];

    let stopped = false;
    const stop = () => (stopped = true);
    for (const el of els) {
      if (!el.id.startsWith(GHOST_EL_ID_PREFIX) && (await this.canSelect(el, stop))) {
        if (stopped) break;

        this.emit('select', el, event);
        this.target = el;
        // 如果是右键点击，这里的mouseup事件监听没有效果
        this.content?.addEventListener('mouseup', this.mouseUpHandler, true);
        break;
      }
    }
  }

  private getGuidesStyle = (type: 'horizontal' | 'vertical') => ({
    position: 'fixed',
    left: type === 'horizontal' ? 0 : '-30px',
    top: type === 'horizontal' ? '-30px' : 0,
    width: type === 'horizontal' ? '100%' : '30px',
    height: type === 'horizontal' ? '30px' : '100%',
  });

  private createGuides = (type: 'horizontal' | 'vertical'): Guides =>
    new Guides(this.wrapper, {
      type,
      displayDragPos: true,
      backgroundColor: '#fff',
      lineColor: '#000',
      textColor: '#000',
      style: this.getGuidesStyle(type),
    });
}
