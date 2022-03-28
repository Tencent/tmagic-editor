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

import { GHOST_EL_ID_PREFIX, GuidesType, Mode } from './const';
import StageCore from './StageCore';
import type { SortEventData, StageDragResizeConfig } from './types';
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
  public dragEl?: HTMLElement;
  public moveable?: Moveable;
  public horizontalGuidelines: number[] = [];
  public verticalGuidelines: number[] = [];

  private moveableOptions: MoveableOptions = {};
  private dragStatus: ActionStatus = ActionStatus.END;
  private ghostEl: HTMLElement | undefined;
  private mode: Mode = Mode.ABSOLUTE;

  constructor(config: StageDragResizeConfig) {
    super();

    this.core = config.core;
    this.container = config.container;
  }

  /**
   * 将选中框渲染并覆盖到选中的组件Dom节点上方
   * 当选中的节点是不是absolute时，会创建一个新的节点出来作为拖拽目标
   * @param el 选中组件的Dom节点元素
   * @param event 鼠标事件
   */
  public async select(el: HTMLElement, event?: MouseEvent): Promise<void> {
    this.target = el;
    this.mode = getMode(el);
    this.destroyDragEl();
    this.destroyGhostEl();

    if (this.mode !== Mode.ABSOLUTE) {
      this.dragEl = this.generateDragEl(el);
    }

    this.moveableOptions = await this.getOptions({
      target: this.dragEl || this.target,
    });

    this.initMoveable();

    if (event) {
      this.moveable?.dragStart(event);
    }
  }

  /**
   * 初始化选中框并渲染出来
   */
  public async refresh() {
    if (!this.moveable) throw new Error('未初始化moveable');

    const options = await this.getOptions();
    Object.entries(options).forEach(([key, value]) => {
      (this.moveable as any)[key] = value;
    });
    this.moveable.updateTarget();
  }

  public setGuidelines(type: GuidesType, guidelines: number[]): void {
    if (type === GuidesType.HORIZONTAL) {
      this.horizontalGuidelines = guidelines;
    } else if (type === GuidesType.VERTICAL) {
      this.verticalGuidelines = guidelines;
    }

    this.refresh();
  }

  public clearGuides() {
    this.verticalGuidelines = [];
    this.horizontalGuidelines = [];
    this.refresh();
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
        if (!this.moveable || !this.target) return;
        const { beforeTranslate } = drag;
        frame.translate = beforeTranslate;
        this.dragStatus = ActionStatus.ING;

        this.target.style.width = `${width}px`;
        this.target.style.height = `${height}px`;

        // 流式布局
        if (this.mode === Mode.SORTABLE && this.ghostEl) {
          this.target.style.top = '0';
          return;
        }

        this.target.style.left = `${beforeTranslate[0]}px`;
        this.target.style.top = `${beforeTranslate[1]}px`;

        if (this.dragEl) {
          this.dragEl.style.width = `${width}px`;
          this.dragEl.style.height = `${height}px`;

          const offset = getAbsolutePosition(this.target, { left: beforeTranslate[0], top: beforeTranslate[1] });
          this.dragEl.style.left = `${offset.left}px`;
          this.dragEl.style.top = `${offset.top}px`;
        }
      })
      .on('resizeEnd', () => {
        this.dragStatus = ActionStatus.END;
        this.drag();
      });
  }

  private bindDragEvent(): void {
    if (!this.moveable) throw new Error('moveable 为初始化');

    this.moveable
      .on('dragStart', () => {
        if (!this.target) throw new Error('未选中组件');

        this.dragStatus = ActionStatus.START;

        if (this.mode === Mode.SORTABLE) {
          this.ghostEl = this.generateGhostEl(this.target);
        }
      })
      .on('drag', ({ left, top }) => {
        if (!this.target) return;
        this.dragStatus = ActionStatus.ING;

        const offset = getAbsolutePosition(this.target, { left, top });

        // 流式布局
        if (this.ghostEl && this.dragEl) {
          this.dragEl.style.top = `${top}px`;
          this.ghostEl.style.top = `${offset.top}px`;
          return;
        }

        // 固定布局
        if (this.dragEl) {
          this.dragEl.style.left = `${left}px`;
          this.dragEl.style.top = `${top}px`;
        }

        this.target.style.left = `${left}px`;
        this.target.style.top = `${top}px`;
      })
      .on('dragEnd', () => {
        // 点击不拖动时会触发dragStart和dragEnd，但是不会有drag事件
        if (this.dragStatus === ActionStatus.ING) {
          switch (this.mode) {
            case Mode.SORTABLE:
              this.sort();
              break;
            default:
              this.drag();
          }
        }

        this.dragStatus = ActionStatus.END;
        this.destroyGhostEl();
      });
  }

  private async getSnapElements(el: HTMLElement): Promise<HTMLElement[]> {
    const { renderer } = this.core;
    const getSnapElements =
      (await renderer.getRuntime())?.getSnapElements ||
      (() => {
        const doc = renderer.contentWindow?.document;
        return doc ? Array.from(doc.querySelectorAll('[id]')) : [];
      });
    return (
      getSnapElements(el)
        // 排除掉当前组件本身
        .filter((element) => element !== this.target && !this.target?.contains(element))
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

  private drag(): void {
    const rect = this.moveable!.getRect();
    const offset =
      this.mode === Mode.SORTABLE ? { left: 0, top: 0 } : getAbsolutePosition(this.target as HTMLElement, rect);

    this.emit('update', {
      el: this.target,
      style: {
        left: this.calcValueByFontsize(offset.left),
        top: this.calcValueByFontsize(offset.top),
        width: this.calcValueByFontsize(rect.width),
        height: this.calcValueByFontsize(rect.height),
      },
    });
  }

  private generateGhostEl(el: HTMLElement): HTMLElement {
    if (this.ghostEl) {
      this.destroyGhostEl();
    }

    const ghostEl = el.cloneNode(true) as HTMLElement;
    const { top, left } = getAbsolutePosition(el, getOffset(el));
    ghostEl.id = `${GHOST_EL_ID_PREFIX}${ghostEl.id}`;
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

  private generateDragEl(el: HTMLElement): HTMLElement {
    if (this.dragEl) {
      this.destroyDragEl();
    }

    const { left, top, width, height } = el.getBoundingClientRect();
    const dragEl = globalThis.document.createElement('div');
    dragEl.style.cssText = `
      position: absolute;
      left: ${left}px;
      top: ${top}px;
      width: ${width}px;
      height: ${height}px;
    `;
    this.container.append(dragEl);
    return dragEl;
  }

  private destroyDragEl(): void {
    this.dragEl?.remove();
    this.dragEl = undefined;
  }

  private async getOptions(options: MoveableOptions = {}): Promise<MoveableOptions> {
    if (!this.target) return {};

    const isAbsolute = this.mode === Mode.ABSOLUTE;

    let { moveableOptions = {} } = this.core.config;

    if (typeof moveableOptions === 'function') {
      moveableOptions = moveableOptions(this.core);
    }

    const boundsOptions = {
      top: 0,
      left: 0,
      right: this.container.clientWidth,
      bottom: this.container.clientHeight,
      ...(moveableOptions.bounds || {}),
    };

    return {
      scrollable: true,
      origin: true,
      zoom: 1,
      dragArea: true,
      draggable: true,
      resizable: true,
      snappable: isAbsolute,
      snapGap: isAbsolute,
      snapElement: isAbsolute,
      snapVertical: isAbsolute,
      snapHorizontal: isAbsolute,
      snapCenter: isAbsolute,

      elementGuidelines: !isAbsolute ? [] : await this.getSnapElements(this.target),
      horizontalGuidelines: this.horizontalGuidelines,
      verticalGuidelines: this.verticalGuidelines,

      bounds: boundsOptions,
      ...options,
      ...moveableOptions,
    };
  }

  private calcValueByFontsize(value: number) {
    const { contentWindow } = this.core.renderer;
    const fontSize = contentWindow?.document.documentElement.style.fontSize;

    if (fontSize) {
      const times = globalThis.parseFloat(fontSize) / 100;
      return value / times;
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
