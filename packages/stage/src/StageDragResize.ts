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

import type { MoveableOptions } from 'moveable';
import Moveable from 'moveable';
import MoveableHelper from 'moveable-helper';

import { DRAG_EL_ID_PREFIX, GHOST_EL_ID_PREFIX, GuidesType, Mode } from './const';
import StageCore from './StageCore';
import type { Offset, Runtime, SortEventData, StageDragResizeConfig } from './types';
import { getAbsolutePosition, getMode, getOffset } from './util';

enum ActionStatus {
  START = 'start',
  ING = 'ing',
  END = 'end',
}

/**
 * 选中框
 */
export default class StageDragResize extends EventEmitter {
  public core: StageCore;
  public container: HTMLElement;
  public target?: HTMLElement;
  public dragEl: HTMLElement;
  public moveable?: Moveable;
  public horizontalGuidelines: number[] = [];
  public verticalGuidelines: number[] = [];
  public elementGuidelines: HTMLElement[] = [];
  public mode: Mode = Mode.ABSOLUTE;

  private moveableOptions: MoveableOptions = {};
  private dragStatus: ActionStatus = ActionStatus.END;
  private ghostEl: HTMLElement | undefined;
  private moveableHelper?: MoveableHelper;

  constructor(config: StageDragResizeConfig) {
    super();

    this.core = config.core;
    this.container = config.container;

    this.dragEl = globalThis.document.createElement('div');
    this.container.append(this.dragEl);
  }

  /**
   * 将选中框渲染并覆盖到选中的组件Dom节点上方
   * 当选中的节点是不是absolute时，会创建一个新的节点出来作为拖拽目标
   * @param el 选中组件的Dom节点元素
   * @param event 鼠标事件
   */
  public select(el: HTMLElement, event?: MouseEvent): void {
    const oldTarget = this.target;
    this.target = el;

    this.init(el);

    // 从不能拖动到能拖动的节点之间切换，要重新创建moveable，不然dragStart不生效
    if (!this.moveable || this.target !== oldTarget) {
      this.moveableHelper = MoveableHelper.create({
        useBeforeRender: true,
        useRender: false,
        createAuto: true,
      });

      this.initMoveable();
    } else {
      this.updateMoveable();
    }

    if (event) {
      this.moveable?.dragStart(event);
    }
  }

  /**
   * 初始化选中框并渲染出来
   */
  public updateMoveable(el = this.target): void {
    if (!this.moveable) throw new Error('未初始化moveable');
    if (!el) throw new Error('为选中任何节点');

    this.target = el;

    this.init(el);

    Object.entries(this.moveableOptions).forEach(([key, value]) => {
      (this.moveable as any)[key] = value;
    });
    this.moveable.updateTarget();
  }

  public setGuidelines(type: GuidesType, guidelines: number[]): void {
    if (type === GuidesType.HORIZONTAL) {
      this.horizontalGuidelines = guidelines;
      this.moveableOptions.horizontalGuidelines = guidelines;
    } else if (type === GuidesType.VERTICAL) {
      this.verticalGuidelines = guidelines;
      this.moveableOptions.verticalGuidelines = guidelines;
    }

    this.updateMoveable();
  }

  public clearGuides() {
    this.horizontalGuidelines = [];
    this.verticalGuidelines = [];
    this.moveableOptions.horizontalGuidelines = [];
    this.moveableOptions.verticalGuidelines = [];
    this.updateMoveable();
  }

  /**
   * 销毁实例
   */
  public destroy(): void {
    this.moveable?.destroy();
    this.destroyGhostEl();
    this.destroyDragEl();
    this.dragStatus = ActionStatus.END;
    this.removeAllListeners();
  }

  private init(el: HTMLElement): void {
    // 如果有滚动条会导致resize时获取到width，height不准确
    if (/(auto|scroll)/.test(el.style.overflow)) {
      el.style.overflow = 'hidden';
    }
    this.mode = getMode(el);

    this.destroyGhostEl();

    this.updateDragEl(el);

    this.moveableOptions = this.getOptions({
      target: this.dragEl,
    });
  }

  private initMoveable() {
    this.moveable?.destroy();

    this.moveable = new Moveable(this.container, {
      ...this.moveableOptions,
    });

    this.bindResizeEvent();
    this.bindDragEvent();
  }

  private bindResizeEvent(): void {
    if (!this.moveable) throw new Error('moveable 为初始化');

    const frame = {
      translate: [0, 0],
    };

    this.moveable
      .on('resizeStart', (e) => {
        if (e.dragStart) {
          const rect = this.moveable!.getRect();
          const offset = getAbsolutePosition(e.target as HTMLElement, rect);
          e.dragStart.set([offset.left, offset.top]);
        }
      })
      .on('resize', ({ width, height, drag }) => {
        if (!this.moveable || !this.target || !this.dragEl) return;

        const { beforeTranslate } = drag;
        frame.translate = beforeTranslate;
        this.dragStatus = ActionStatus.ING;

        this.target.style.width = `${width}px`;
        this.target.style.height = `${height}px`;
        this.dragEl.style.width = `${width}px`;
        this.dragEl.style.height = `${height}px`;

        // 流式布局
        if (this.mode === Mode.SORTABLE) {
          this.dragEl.style.top = `${beforeTranslate[1]}px`;
          this.target.style.top = `0px`;
          return;
        }

        this.dragEl.style.left = `${beforeTranslate[0]}px`;
        this.dragEl.style.top = `${beforeTranslate[1]}px`;

        const offset = getAbsolutePosition(this.target, { left: beforeTranslate[0], top: beforeTranslate[1] });

        this.target.style.left = `${offset.left}px`;
        this.target.style.top = `${offset.top}px`;
      })
      .on('resizeEnd', () => {
        this.dragStatus = ActionStatus.END;
        this.update(true);
      });
  }

  private bindDragEvent(): void {
    if (!this.moveable) throw new Error('moveable 为初始化');

    let offset: Offset | null = null;

    this.moveable
      .on('dragStart', (e) => {
        if (!this.target) throw new Error('未选中组件');

        this.dragStatus = ActionStatus.START;

        this.moveableHelper?.onDragStart(e);

        if (this.mode === Mode.SORTABLE) {
          this.ghostEl = this.generateGhostEl(this.target);
        }
      })
      .on('drag', (e) => {
        if (!this.target || !this.dragEl) return;

        if (!offset) {
          offset = getAbsolutePosition(this.target, { left: 0, top: 0 });
        }

        this.dragStatus = ActionStatus.ING;

        const { left, top } = e;

        // 流式布局
        if (this.ghostEl) {
          this.dragEl.style.top = `${top}px`;
          this.ghostEl.style.top = `${top + offset.top}px`;
          return;
        }

        this.moveableHelper?.onDrag(e);

        this.target.style.left = `${left + offset.left}px`;
        this.target.style.top = `${top + offset.top}px`;
      })
      .on('dragEnd', () => {
        // 点击不拖动时会触发dragStart和dragEnd，但是不会有drag事件
        if (this.dragStatus === ActionStatus.ING) {
          switch (this.mode) {
            case Mode.SORTABLE:
              this.sort();
              break;
            default:
              this.update();
          }
        }
        offset = null;

        this.dragStatus = ActionStatus.END;
        this.destroyGhostEl();
      });
  }

  private getSnapElements(runtime: Runtime, el?: HTMLElement): HTMLElement[] {
    const { renderer, mask } = this.core;
    const getSnapElements =
      runtime?.getSnapElements ||
      (() => {
        const doc = renderer.contentWindow?.document;
        return doc ? Array.from(doc.querySelectorAll('[id]')) : [];
      });
    return getSnapElements(el).filter(
      (element) => element !== this.target && !this.target?.contains(element) && element !== mask.page,
    );
  }

  private sort(): void {
    if (!this.target || !this.ghostEl) throw new Error('未知错误');
    const { top } = this.ghostEl.getBoundingClientRect();
    const { top: oriTop } = this.target.getBoundingClientRect();
    const deltaTop = top - oriTop;
    if (Math.abs(deltaTop) >= this.target.clientHeight / 2) {
      if (deltaTop > 0) {
        this.emit('sort', down(deltaTop, this.target));
      } else {
        this.emit('sort', up(deltaTop, this.target));
      }
    } else {
      this.emit('sort', {
        src: this.target.id,
        dist: this.target.id,
      });
    }
  }

  private update(isResize = false): void {
    const rect = this.moveable!.getRect();
    const offset =
      this.mode === Mode.SORTABLE ? { left: 0, top: 0 } : getAbsolutePosition(this.target as HTMLElement, rect);

    const left = this.calcValueByFontsize(offset.left);
    const top = this.calcValueByFontsize(offset.top);
    const width = this.calcValueByFontsize(rect.width);
    const height = this.calcValueByFontsize(rect.height);

    this.emit('update', {
      el: this.target,
      style: isResize ? { left, top, width, height } : { left, top },
    });
  }

  private generateGhostEl(el: HTMLElement): HTMLElement {
    if (this.ghostEl) {
      this.destroyGhostEl();
    }

    const ghostEl = el.cloneNode(true) as HTMLElement;
    const { top, left } = getAbsolutePosition(el, getOffset(el));
    ghostEl.id = `${GHOST_EL_ID_PREFIX}${el.id}`;
    ghostEl.style.zIndex = '5';
    ghostEl.style.opacity = '.5';
    ghostEl.style.position = 'absolute';
    ghostEl.style.left = `${left}px`;
    ghostEl.style.top = `${top}px`;
    el.after(ghostEl);
    return ghostEl;
  }

  private destroyGhostEl(): void {
    this.ghostEl?.remove();
    this.ghostEl = undefined;
  }

  private updateDragEl(el: HTMLElement) {
    const { width, height } = el.getBoundingClientRect();
    const offset = getOffset(el);

    this.dragEl.style.cssText = `
      position: absolute;
      left: ${offset.left}px;
      top: ${offset.top}px;
      width: ${width}px;
      height: ${height}px;
      z-index: 9;
    `;

    this.dragEl.id = `${DRAG_EL_ID_PREFIX}${el.id}`;
  }

  private destroyDragEl(): void {
    this.dragEl?.remove();
  }

  private getOptions(options: MoveableOptions = {}): MoveableOptions {
    if (!this.target) return {};

    const isAbsolute = this.mode === Mode.ABSOLUTE;
    const isFixed = this.mode === Mode.FIXED;

    let { moveableOptions = {} } = this.core.config;

    if (typeof moveableOptions === 'function') {
      moveableOptions = moveableOptions(this.core);
    }

    return {
      origin: false,
      rootContainer: this.core.container,
      zoom: 1,
      dragArea: false,
      draggable: true,
      resizable: true,
      snappable: isAbsolute || isFixed,
      snapGap: isAbsolute || isFixed,
      snapThreshold: 5,
      snapDigit: 0,
      throttleDrag: 0,
      isDisplaySnapDigit: isAbsolute,
      snapDirections: {
        top: isAbsolute,
        right: isAbsolute,
        bottom: isAbsolute,
        left: isAbsolute,
        center: isAbsolute,
        middle: isAbsolute,
      },
      elementSnapDirections: {
        top: isAbsolute,
        right: isAbsolute,
        bottom: isAbsolute,
        left: isAbsolute,
      },
      isDisplayInnerSnapDigit: true,
      horizontalGuidelines: this.horizontalGuidelines,
      verticalGuidelines: this.verticalGuidelines,
      elementGuidelines: this.elementGuidelines,

      bounds: {
        top: 0,
        left: 0,
        right: this.container.clientWidth,
        bottom: this.container.clientHeight,
        ...(moveableOptions.bounds || {}),
      },
      ...options,
      ...moveableOptions,
    };
  }

  private calcValueByFontsize(value: number) {
    const { contentWindow } = this.core.renderer;
    const fontSize = contentWindow?.document.documentElement.style.fontSize;

    if (fontSize) {
      const times = globalThis.parseFloat(fontSize) / 100;
      return (value / times).toFixed(2);
    }

    return value;
  }
}

/**
 * 下移组件位置
 * @param {number} deltaTop 偏移量
 * @param {Object} detail 当前选中的组件配置
 */
export const down = (deltaTop: number, target: HTMLElement | SVGElement): SortEventData | void => {
  let swapIndex = 0;
  let addUpH = target.clientHeight;
  const brothers = Array.from(target.parentNode?.children || []).filter(
    (node) => !node.id.startsWith(GHOST_EL_ID_PREFIX),
  );
  const index = brothers.indexOf(target);
  // 往下移动
  const downEls = brothers.slice(index + 1) as HTMLElement[];

  for (let i = 0; i < downEls.length; i++) {
    const ele = downEls[i];
    // 是 fixed 不做处理
    if (ele.style?.position === 'fixed') {
      continue;
    }
    addUpH += ele.clientHeight / 2;
    if (deltaTop <= addUpH) {
      break;
    }
    addUpH += ele.clientHeight / 2;
    swapIndex = i;
  }
  return {
    src: target.id,
    dist: downEls.length && swapIndex > -1 ? downEls[swapIndex].id : target.id,
  };
};

/**
 * 上移组件位置
 * @param {Array} brothers 处于同一容器下的所有子组件配置
 * @param {number} index 当前组件所处的位置
 * @param {number} deltaTop 偏移量
 * @param {Object} detail 当前选中的组件配置
 */
export const up = (deltaTop: number, target: HTMLElement | SVGElement): SortEventData | void => {
  const brothers = Array.from(target.parentNode?.children || []).filter(
    (node) => !node.id.startsWith(GHOST_EL_ID_PREFIX),
  );
  const index = brothers.indexOf(target);
  // 往上移动
  const upEls = brothers.slice(0, index) as HTMLElement[];

  let addUpH = target.clientHeight;
  let swapIndex = upEls.length - 1;

  for (let i = upEls.length - 1; i >= 0; i--) {
    const ele = upEls[i];
    if (!ele) continue;
    // 是 fixed 不做处理
    if (ele.style.position === 'fixed') continue;

    addUpH += ele.clientHeight / 2;
    if (-deltaTop <= addUpH) break;
    addUpH += ele.clientHeight / 2;

    swapIndex = i;
  }
  return {
    src: target.id,
    dist: upEls.length && swapIndex > -1 ? upEls[swapIndex].id : target.id,
  };
};
