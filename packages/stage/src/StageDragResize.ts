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

import { addClassName, removeClassNameByClassName } from '@tmagic/utils';

import { DRAG_EL_ID_PREFIX, GHOST_EL_ID_PREFIX, GuidesType, Mode, ZIndex } from './const';
import StageCore from './StageCore';
import StageMask from './StageMask';
import type { SortEventData, StageDragResizeConfig } from './types';
import { calcValueByFontsize, getAbsolutePosition, getMode, getOffset, getTargetElStyle } from './util';

/** 拖动状态 */
enum ActionStatus {
  /** 开始拖动 */
  START = 'start',
  /** 拖动中 */
  ING = 'ing',
  /** 拖动结束 */
  END = 'end',
}

/**
 * 选中框
 */
export default class StageDragResize extends EventEmitter {
  public core: StageCore;
  public mask: StageMask;
  /** 画布容器 */
  public container: HTMLElement;
  /** 目标节点 */
  public target?: HTMLElement;
  /** 目标节点在蒙层中的占位节点 */
  public dragEl?: HTMLDivElement;
  /** 多选:目标节点组 */
  public targetList: HTMLElement[] = [];
  /** 多选:目标节点在蒙层中的占位节点组 */
  public dragElList: HTMLDivElement[] = [];
  /** Moveable拖拽类实例 */
  public moveable?: Moveable;
  /** Moveable多选拖拽类实例 */
  public moveableForMulti?: Moveable;
  /** 水平参考线 */
  public horizontalGuidelines: number[] = [];
  /** 垂直参考线 */
  public verticalGuidelines: number[] = [];
  /** 对齐元素集合 */
  public elementGuidelines: HTMLElement[] = [];
  /** 布局方式：流式布局、绝对定位、固定定位 */
  public mode: Mode = Mode.ABSOLUTE;

  private moveableOptions: MoveableOptions = {};
  /** 拖动状态 */
  private dragStatus: ActionStatus = ActionStatus.END;
  /** 流式布局下，目标节点的镜像节点 */
  private ghostEl: HTMLElement | undefined;
  private moveableHelper?: MoveableHelper;

  constructor(config: StageDragResizeConfig) {
    super();

    this.core = config.core;
    this.container = config.container;
    this.mask = config.mask;
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

    // 从不能拖动到能拖动的节点之间切换，要重新创建moveable，不然dragStart不生效
    if (!this.moveable || this.target !== oldTarget) {
      this.init(el);
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

  public multiSelect(els: HTMLElement[]): void {
    this.targetList = els;
    this.destroyDragEl();
    this.destroyDragElList();
    // 生成虚拟多选节点
    this.dragElList = els.map((elItem) => {
      const dragElDiv = globalThis.document.createElement('div');
      this.container.append(dragElDiv);
      dragElDiv.style.cssText = this.updateDragEl(elItem);
      dragElDiv.id = `${DRAG_EL_ID_PREFIX}${elItem.id}`;
      return dragElDiv;
    });
    this.moveableForMulti?.destroy();
    this.moveableForMulti = new Moveable(this.container, {
      target: this.dragElList,
      defaultGroupRotate: 0,
      defaultGroupOrigin: '50% 50%',
      draggable: true,
      resizable: true,
      throttleDrag: 0,
      startDragRotate: 0,
      throttleDragRotate: 0,
      zoom: 1,
      origin: true,
      padding: { left: 0, top: 0, right: 0, bottom: 0 },
    });
    const frames: { left: number; top: number; dragLeft: number; dragTop: number; id: string }[] = [];
    this.moveableForMulti
      .on('dragGroupStart', ({ events }) => {
        // 记录拖动前快照
        events.forEach((ev) => {
          // 实际目标元素
          const matchEventTarget = this.targetList.find((targetItem) => targetItem.id === ev.target.id.split('_')[2]);
          // 蒙层虚拟元素（对于在组内的元素拖动时的相对位置不同，因此需要分别记录）
          const dragEventTarget = this.dragElList.find((dragElItem) => dragElItem.id === ev.target.id);
          if (!matchEventTarget || !dragEventTarget) return;
          frames.push({
            left: matchEventTarget.offsetLeft,
            top: matchEventTarget.offsetTop,
            dragLeft: dragEventTarget.offsetLeft,
            dragTop: dragEventTarget.offsetTop,
            id: matchEventTarget.id,
          });
        });
      })
      .on('dragGroup', ({ events }) => {
        // 拖动过程更新
        events.forEach((ev) => {
          const frameSnapShot = frames.find((frameItem) => frameItem.id === ev.target.id.split('_')[2]);
          if (!frameSnapShot) return;
          const targeEl = this.targetList.find((targetItem) => targetItem.id === ev.target.id.split('_')[2]);
          if (!targeEl) return;
          // 元素与其所属组同时加入多选列表时，只更新父元素
          const isParentIncluded = this.targetList.find((targetItem) => targetItem.id === targeEl.parentElement?.id);
          if (!isParentIncluded) {
            // 更新页面元素位置
            targeEl.style.left = `${frameSnapShot.left + ev.beforeTranslate[0]}px`;
            targeEl.style.top = `${frameSnapShot.top + ev.beforeTranslate[1]}px`;
          }
          // 更新蒙层虚拟元素位置
          ev.target.style.left = `${frameSnapShot.dragLeft + ev.beforeTranslate[0]}px`;
          ev.target.style.top = `${frameSnapShot.dragTop + ev.beforeTranslate[1]}px`;
        });
      });
  }

  /**
   * 初始化选中框并渲染出来
   */
  public updateMoveable(el = this.target): void {
    if (!this.moveable) throw new Error('未初始化moveable');
    if (!el) throw new Error('未选中任何节点');

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

    if (this.moveable) {
      this.updateMoveable();
    }
  }

  public clearGuides() {
    this.horizontalGuidelines = [];
    this.verticalGuidelines = [];
    this.moveableOptions.horizontalGuidelines = [];
    this.moveableOptions.verticalGuidelines = [];
    this.updateMoveable();
  }

  public clearSelectStatus(): void {
    if (!this.moveable) return;
    this.destroyDragEl();
    this.moveable.target = null;
    this.moveable.updateTarget();
  }

  public destroyDragEl(): void {
    this.dragEl?.remove();
  }

  /**
   * 销毁实例
   */
  public destroy(): void {
    this.moveable?.destroy();
    this.moveableForMulti?.destroy();
    this.destroyGhostEl();
    this.destroyDragEl();
    this.destroyDragElList();
    this.dragStatus = ActionStatus.END;
    this.removeAllListeners();
  }

  /**
   * 用于在切换选择模式时清除上一次的状态
   * @param selectType 需要清理的选择模式 多选：multiSelect，单选：select
   */
  public clearSelectStatus(selectType: String) {
    if (selectType === 'multiSelect') {
      if (!this.moveableForMulti) return;
      this.destroyDragElList();
      this.moveableForMulti.target = null;
      this.moveableForMulti.updateTarget();
    } else {
      if (!this.moveable) return;
      this.destroyDragEl();
      this.moveable.target = null;
      this.moveable.updateTarget();
    }
  }

  private init(el: HTMLElement): void {
    // 如果有滚动条会导致resize时获取到width，height不准确
    if (/(auto|scroll)/.test(el.style.overflow)) {
      el.style.overflow = 'hidden';
    }
    this.mode = getMode(el);

    this.destroyGhostEl();
    this.destroyDragEl();
    this.dragEl = globalThis.document.createElement('div');
    this.container.append(this.dragEl);
    this.dragEl.style.cssText = getTargetElStyle(el);
    this.dragEl.id = `${DRAG_EL_ID_PREFIX}${el.id}`;

    if (typeof this.core.config.updateDragEl === 'function') {
      this.core.config.updateDragEl(this.dragEl, el);
    }
    this.moveableOptions = this.getOptions({
      target: this.dragEl,
    });
  }

  private setElementGuidelines(nodes: HTMLElement[]) {
    this.elementGuidelines.forEach((node) => {
      node.remove();
    });
    this.elementGuidelines = [];

    if (this.mode === Mode.ABSOLUTE) {
      this.container.append(this.createGuidelineElements(nodes));
    }
  }

  private createGuidelineElements(nodes: HTMLElement[]) {
    const frame = globalThis.document.createDocumentFragment();

    for (const node of nodes) {
      const { width, height } = node.getBoundingClientRect();
      if (node === this.target) continue;
      const { left, top } = getOffset(node as HTMLElement);
      const elementGuideline = globalThis.document.createElement('div');
      elementGuideline.style.cssText = `position: absolute;width: ${width}px;height: ${height}px;top: ${top}px;left: ${left}px`;
      this.elementGuidelines.push(elementGuideline);
      frame.append(elementGuideline);
    }

    return frame;
  }

  private initMoveable() {
    this.moveable?.destroy();

    this.moveable = new Moveable(this.container, {
      ...this.moveableOptions,
    });

    this.bindResizeEvent();
    this.bindDragEvent();
    this.bindRotateEvent();
    this.bindScaleEvent();
  }

  private bindResizeEvent(): void {
    if (!this.moveable) throw new Error('moveable 未初始化');

    const frame = {
      left: 0,
      top: 0,
    };

    this.moveable
      .on('resizeStart', (e) => {
        if (!this.target) return;

        this.dragStatus = ActionStatus.START;
        this.moveableHelper?.onResizeStart(e);

        frame.top = this.target.offsetTop;
        frame.left = this.target.offsetLeft;
      })
      .on('resize', (e) => {
        const { width, height, drag } = e;
        if (!this.moveable || !this.target || !this.dragEl) return;

        const { beforeTranslate } = drag;
        this.dragStatus = ActionStatus.ING;

        this.moveableHelper?.onResize(e);

        // 流式布局
        if (this.mode === Mode.SORTABLE) {
          this.target.style.top = '0px';
        } else {
          this.target.style.left = `${frame.left + beforeTranslate[0]}px`;
          this.target.style.top = `${frame.top + beforeTranslate[1]}px`;
        }

        this.target.style.width = `${width}px`;
        this.target.style.height = `${height}px`;
      })
      .on('resizeEnd', () => {
        this.dragStatus = ActionStatus.END;
        this.update(true);
      });
  }

  private bindDragEvent(): void {
    if (!this.moveable) throw new Error('moveable 未初始化');

    const frame = {
      left: 0,
      top: 0,
    };

    let timeout: NodeJS.Timeout | undefined;

    const { contentWindow } = this.core.renderer;
    const doc = contentWindow?.document;

    this.moveable
      .on('dragStart', (e) => {
        if (!this.target) throw new Error('未选中组件');

        this.dragStatus = ActionStatus.START;

        this.moveableHelper?.onDragStart(e);

        if (this.mode === Mode.SORTABLE) {
          this.ghostEl = this.generateGhostEl(this.target);
        }
        frame.top = this.target.offsetTop;
        frame.left = this.target.offsetLeft;
      })
      .on('drag', (e) => {
        if (!this.target || !this.dragEl) return;

        if (timeout) {
          globalThis.clearTimeout(timeout);
          timeout = undefined;
        }

        timeout = globalThis.setTimeout(async () => {
          const els = this.core.getElementsFromPoint(e.inputEvent);
          for (const el of els) {
            if (
              doc &&
              !el.id.startsWith(GHOST_EL_ID_PREFIX) &&
              el !== this.target &&
              (await this.core.isContainer(el))
            ) {
              addClassName(el, doc, this.core.containerHighlightClassName);
              break;
            }
          }
        }, this.core.containerHighlightDuration);

        this.dragStatus = ActionStatus.ING;

        // 流式布局
        if (this.ghostEl) {
          this.ghostEl.style.top = `${frame.top + e.beforeTranslate[1]}px`;
          return;
        }

        this.moveableHelper?.onDrag(e);

        this.target.style.left = `${frame.left + e.beforeTranslate[0]}px`;
        this.target.style.top = `${frame.top + e.beforeTranslate[1]}px`;
      })
      .on('dragEnd', () => {
        if (timeout) {
          globalThis.clearTimeout(timeout);
          timeout = undefined;
        }

        let parentEl: HTMLElement | null = null;

        if (doc) {
          parentEl = removeClassNameByClassName(doc, this.core.containerHighlightClassName);
        }

        // 点击不拖动时会触发dragStart和dragEnd，但是不会有drag事件
        if (this.dragStatus === ActionStatus.ING) {
          if (parentEl) {
            this.update(false, parentEl);
          } else {
            switch (this.mode) {
              case Mode.SORTABLE:
                this.sort();
                break;
              default:
                this.update();
            }
          }
        }

        this.dragStatus = ActionStatus.END;
        this.destroyGhostEl();
      });
  }

  private bindRotateEvent(): void {
    if (!this.moveable) throw new Error('moveable 未初始化');

    this.moveable
      .on('rotateStart', (e) => {
        this.dragStatus = ActionStatus.START;
        this.moveableHelper?.onRotateStart(e);
      })
      .on('rotate', (e) => {
        if (!this.target || !this.dragEl) return;
        this.dragStatus = ActionStatus.ING;
        this.moveableHelper?.onRotate(e);
        const frame = this.moveableHelper?.getFrame(e.target);
        this.target.style.transform = frame?.toCSSObject().transform || '';
      })
      .on('rotateEnd', (e) => {
        this.dragStatus = ActionStatus.END;
        const frame = this.moveableHelper?.getFrame(e.target);
        this.emit('update', {
          el: this.target,
          style: {
            transform: frame?.get('transform'),
          },
        });
      });
  }

  private bindScaleEvent(): void {
    if (!this.moveable) throw new Error('moveable 未初始化');

    this.moveable
      .on('scaleStart', (e) => {
        this.dragStatus = ActionStatus.START;
        this.moveableHelper?.onScaleStart(e);
      })
      .on('scale', (e) => {
        if (!this.target || !this.dragEl) return;
        this.dragStatus = ActionStatus.ING;
        this.moveableHelper?.onScale(e);
        const frame = this.moveableHelper?.getFrame(e.target);
        this.target.style.transform = frame?.toCSSObject().transform || '';
      })
      .on('scaleEnd', (e) => {
        this.dragStatus = ActionStatus.END;
        const frame = this.moveableHelper?.getFrame(e.target);
        this.emit('update', {
          el: this.target,
          style: {
            transform: frame?.get('transform'),
          },
        });
      });
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

  private update(isResize = false, parentEl: HTMLElement | null = null): void {
    if (!this.target) return;

    const { contentWindow } = this.core.renderer;
    const doc = contentWindow?.document;

    if (!doc) return;

    const offset =
      this.mode === Mode.SORTABLE ? { left: 0, top: 0 } : { left: this.target.offsetLeft, top: this.target.offsetTop };

    let left = calcValueByFontsize(doc, offset.left);
    let top = calcValueByFontsize(doc, offset.top);
    const width = calcValueByFontsize(doc, this.target.clientWidth);
    const height = calcValueByFontsize(doc, this.target.clientHeight);

    if (parentEl && this.mode === Mode.ABSOLUTE && this.dragEl) {
      const [translateX, translateY] = this.moveableHelper?.getFrame(this.dragEl).properties.transform.translate.value;
      const { left: parentLeft, top: parentTop } = getOffset(parentEl);
      left =
        calcValueByFontsize(doc, this.dragEl.offsetLeft) +
        parseFloat(translateX) -
        calcValueByFontsize(doc, parentLeft);
      top =
        calcValueByFontsize(doc, this.dragEl.offsetTop) + parseFloat(translateY) - calcValueByFontsize(doc, parentTop);
    }

    this.emit('update', {
      el: this.target,
      parentEl,
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
    ghostEl.style.zIndex = ZIndex.GHOST_EL;
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

  private getOptions(options: MoveableOptions = {}): MoveableOptions {
    if (!this.target) return {};

    const isAbsolute = this.mode === Mode.ABSOLUTE;
    const isFixed = this.mode === Mode.FIXED;

    let { moveableOptions = {} } = this.core.config;

    if (typeof moveableOptions === 'function') {
      moveableOptions = moveableOptions(this.core);
    }

    const elementGuidelines: any = moveableOptions.elementGuidelines || this.target.parentElement?.children || [];

    this.setElementGuidelines(elementGuidelines);

    if (moveableOptions.elementGuidelines) {
      delete moveableOptions.elementGuidelines;
    }

    return {
      origin: false,
      rootContainer: this.core.container,
      zoom: 1,
      dragArea: false,
      draggable: true,
      resizable: true,
      scalable: false,
      rotatable: false,
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
        // 设置0的话无法移动到left为0，所以只能设置为-1
        left: -1,
        right: this.container.clientWidth,
        bottom: this.container.clientHeight,
        ...(moveableOptions.bounds || {}),
      },
      ...options,
      ...moveableOptions,
    };
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
