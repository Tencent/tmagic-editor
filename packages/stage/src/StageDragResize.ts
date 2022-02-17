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

import { GHOST_EL_ID_PREFIX } from './const';
import StageCore from './StageCore';
import type { SortEventData, StageDragResizeConfig } from './types';
import { getAbsolutePosition, getMode, getOffset, Mode } from './util';

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
  public moveable?: Moveable;

  private dragStatus: ActionStatus = ActionStatus.END;
  private elObserver?: ResizeObserver;
  private ghostEl: HTMLElement | undefined;
  private horizontalGuidelines: number[] = [];
  private verticalGuidelines: number[] = [];
  private mode: Mode = Mode.ABSOLUTE;

  constructor(config: StageDragResizeConfig) {
    super();

    this.core = config.core;
    this.container = config.container;
    this.initObserver();
  }

  /**
   * 将选中框渲染并覆盖到选中的组件Dom节点上方
   * @param el 选中组件的Dom节点元素
   */
  public async select(el: HTMLElement): Promise<void> {
    if (this.target === el) {
      this.refresh();
      return;
    }

    this.moveable?.destroy();

    this.target = el;
    this.mode = getMode(el);

    const options = await this.getOptions();

    this.moveable = new Moveable(this.container, options);
    this.bindResizeEvent();
    this.bindDragEvent();

    this.syncRect(el);
  }

  /**
   * 初始化选中框并渲染出来
   * @param param0
   */

  public async refresh() {
    const options = await this.getOptions();
    Object.entries(options).forEach(([key, value]) => {
      (this.moveable as any)[key] = value;
    });
    this.updateMoveableTarget();
  }

  public async setVGuidelines(verticalGuidelines: number[]): Promise<void> {
    this.verticalGuidelines = verticalGuidelines;
    this.target && (await this.select(this.target));
  }

  public async setHGuidelines(horizontalGuidelines: number[]): Promise<void> {
    this.horizontalGuidelines = horizontalGuidelines;
    this.target && (await this.select(this.target));
  }

  public updateMoveableTarget(target?: HTMLElement): void {
    if (!this.moveable) throw new Error('为初始化目标');

    if (target) {
      this.moveable.target = target;
    }

    if (this.target) {
      this.mode = getMode(this.target);
    }

    this.moveable.updateTarget();
  }

  /**
   * 销毁实例
   */
  public destroy(): void {
    this.destroyGhostEl();
    this.moveable?.destroy();
    this.dragStatus = ActionStatus.END;
    this.elObserver?.disconnect();
    this.removeAllListeners();
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

          if (this.ghostEl) {
            this.destroyGhostEl();
            this.updateMoveableTarget(this.target);
          }
        }
      })
      .on('resize', ({ target, width, height, drag }) => {
        if (!this.moveable) return;
        if (!this.target) return;
        const { beforeTranslate } = drag;
        frame.translate = beforeTranslate;
        this.dragStatus = ActionStatus.ING;

        target.style.width = `${width}px`;
        target.style.height = `${height}px`;

        if ([Mode.ABSOLUTE, Mode.FIXED].includes(this.mode)) {
          target.style.left = `${beforeTranslate[0]}px`;
          target.style.top = `${beforeTranslate[1]}px`;
        }
      })
      .on('resizeEnd', ({ target }) => {
        this.dragStatus = ActionStatus.END;

        const rect = this.moveable!.getRect();
        const offset = getAbsolutePosition(target as HTMLElement, rect);

        this.updateMoveableTarget(this.target);

        this.emit('update', {
          el: this.target,
          style: {
            width: this.calcValueByFontsize(rect.width),
            height: this.calcValueByFontsize(rect.height),
            position: this.target?.style.position,
            ...(this.mode === Mode.SORTABLE
              ? {}
              : {
                  left: this.calcValueByFontsize(offset.left),
                  top: this.calcValueByFontsize(offset.top),
                }),
          },
        });
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
          this.updateMoveableTarget(this.ghostEl);
        }
      })
      .on('drag', ({ target, left, top }) => {
        this.dragStatus = ActionStatus.ING;
        if (this.mode === Mode.SORTABLE && (!this.ghostEl || target !== this.ghostEl)) {
          return;
        }

        if ([Mode.ABSOLUTE, Mode.FIXED].includes(this.mode)) {
          target.style.left = `${left}px`;
          target.style.top = `${top}px`;
        } else if (this.target) {
          const offset = getAbsolutePosition(this.target, getOffset(this.target));
          target.style.top = `${offset.top + top}px`;
        }
      })
      .on('dragEnd', () => {
        // 点击不拖动时会触发dragStart和dragEnd，但是不会有drag事件
        if (this.dragStatus !== ActionStatus.ING) {
          return;
        }

        if (!this.target) return;

        this.dragStatus = ActionStatus.END;
        this.updateMoveableTarget(this.target);

        switch (this.mode) {
          case Mode.SORTABLE:
            this.sort();
            break;
          default:
            this.drag();
        }

        this.destroyGhostEl();
      });
  }

  private async getSnapElements(el: HTMLElement): Promise<HTMLElement[]> {
    const { renderer } = this.core;
    const getSnapElements =
      (await renderer.getRuntime())?.getSnapElements ||
      (() => {
        const doc = renderer.contentWindow?.document;
        const elementGuidelines = (doc ? Array.from(doc.querySelectorAll('[id]')) : [])
          // 排除掉当前组件本身
          .filter((element) => element !== this.target && !this.target?.contains(element));
        return elementGuidelines as HTMLElement[];
      });
    return getSnapElements(el);
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
    const offset = getAbsolutePosition(this.target as HTMLElement, rect);

    this.emit('update', {
      el: this.target,
      style: {
        left: this.calcValueByFontsize(this.mode === Mode.FIXED ? rect.left : offset.left),
        top: this.calcValueByFontsize(this.mode === Mode.FIXED ? rect.top : offset.top),
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

  private async getOptions(options: MoveableOptions = {}): Promise<MoveableOptions> {
    if (!this.target) return {};

    const isSortable = this.mode === Mode.SORTABLE;
    const { config, renderer, mask } = this.core;
    const { iframe } = renderer;

    let { moveableOptions = {} } = config;

    if (typeof moveableOptions === 'function') {
      moveableOptions = moveableOptions(this.core);
    }

    const boundsOptions = {
      top: 0,
      left: 0,
      right: iframe?.clientWidth,
      bottom: this.mode === Mode.FIXED ? iframe?.clientHeight : mask.page?.clientHeight,
      ...(moveableOptions.bounds || {}),
    };

    return {
      target: this.target,
      scrollable: true,
      origin: true,
      zoom: 1,
      dragArea: true,
      draggable: true,
      resizable: true,
      snappable: !isSortable,
      snapGap: !isSortable,
      snapElement: !isSortable,
      snapVertical: !isSortable,
      snapHorizontal: !isSortable,
      snapCenter: !isSortable,
      container: renderer.contentWindow?.document.body,

      elementGuidelines: isSortable ? [] : await this.getSnapElements(this.target),
      horizontalGuidelines: this.horizontalGuidelines,
      verticalGuidelines: this.verticalGuidelines,

      bounds: boundsOptions,
      ...options,
      ...moveableOptions,
    };
  }

  private initObserver(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    this.elObserver = new ResizeObserver(() => {
      const doc = this.core.renderer.contentWindow?.document;
      if (!doc || !this.target || !this.moveable) return;

      /** 组件可能已经重新渲染了，所以需要重新获取新的dom */
      const target = doc.getElementById(this.target.id);

      if (this.ghostEl) {
        this.destroyGhostEl();
      }

      if (target && target !== this.target) {
        this.syncRect(target);
        this.target = target;
      }

      this.updateMoveableTarget(this.target);
    });
  }

  private syncRect(el: HTMLElement): void {
    this.elObserver?.disconnect();
    this.elObserver?.observe(el);
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
