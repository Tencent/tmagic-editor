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
import Moveable, { MoveableOptions } from 'moveable';
import MoveableHelper from 'moveable-helper';

import { DRAG_EL_ID_PREFIX, GHOST_EL_ID_PREFIX, Mode, ZIndex } from './const';
import MoveableOptionsManager from './MoveableOptionsManager';
import TargetShadow from './TargetShadow';
import type { DelayedMarkContainer, GetRenderDocument, MarkContainerEnd, StageDragResizeConfig } from './types';
import { StageDragStatus } from './types';
import { calcValueByFontsize, down, getAbsolutePosition, getMode, getOffset, up } from './util';

/**
 * 管理单选操作，响应选中操作，初始化moveableOption参数并初始化moveable，处理moveable回调事件对组件进行更新
 * @extends MoveableOptionsManager
 */
export default class StageDragResize extends MoveableOptionsManager {
  /** 目标节点 */
  private target?: HTMLElement;
  /** 目标节点在蒙层中的占位节点 */
  private targetShadow: TargetShadow;
  /** Moveable拖拽类实例 */
  private moveable?: Moveable;
  /** 拖动状态 */
  private dragStatus: StageDragStatus = StageDragStatus.END;
  /** 流式布局下，目标节点的镜像节点 */
  private ghostEl: HTMLElement | undefined;
  private moveableHelper?: MoveableHelper;
  private getRenderDocument: GetRenderDocument;
  private markContainerEnd: MarkContainerEnd;
  private delayedMarkContainer: DelayedMarkContainer;

  constructor(config: StageDragResizeConfig) {
    super(config);

    this.getRenderDocument = config.getRenderDocument;
    this.markContainerEnd = config.markContainerEnd;
    this.delayedMarkContainer = config.delayedMarkContainer;

    this.targetShadow = new TargetShadow({
      container: config.container,
      updateDragEl: config.updateDragEl,
      zIndex: ZIndex.DRAG_EL,
      idPrefix: DRAG_EL_ID_PREFIX,
    });

    this.on('update-moveable', () => {
      if (this.moveable) {
        this.updateMoveable();
      }
    });
  }

  /**
   * 将选中框渲染并覆盖到选中的组件Dom节点上方
   * 当选中的节点不是absolute时，会创建一个新的节点出来作为拖拽目标
   * @param el 选中组件的Dom节点元素
   * @param event 鼠标事件
   */
  public select(el: HTMLElement, event?: MouseEvent): void {
    const oldTarget = this.target;
    this.target = el;

    // 从不能拖动到能拖动的节点之间切换，要重新创建moveable，不然dragStart不生效
    if (!this.moveable || this.target !== oldTarget) {
      this.initMoveable(el);
    } else {
      this.updateMoveable(el);
    }

    if (event) {
      this.moveable?.dragStart(event);
    }
  }

  /**
   * 初始化选中框并渲染出来
   */
  public updateMoveable(el = this.target): void {
    if (!this.moveable) return;
    if (!el) throw new Error('未选中任何节点');

    this.target = el;

    const options: MoveableOptions = this.init(el);

    Object.entries(options).forEach(([key, value]) => {
      (this.moveable as any)[key] = value;
    });
    this.moveable.updateTarget();
  }

  public clearSelectStatus(): void {
    if (!this.moveable) return;
    this.targetShadow.destroyEl();
    this.moveable.target = null;
    this.moveable.updateTarget();
  }

  /**
   * 销毁实例
   */
  public destroy(): void {
    this.moveable?.destroy();
    this.destroyGhostEl();
    this.targetShadow.destroy();
    this.dragStatus = StageDragStatus.END;
    this.removeAllListeners();
  }

  private init(el: HTMLElement): MoveableOptions {
    // 如果有滚动条会导致resize时获取到width，height不准确
    if (/(auto|scroll)/.test(el.style.overflow)) {
      el.style.overflow = 'hidden';
    }

    this.mode = getMode(el);

    this.destroyGhostEl();

    this.targetShadow.update(el);

    // 设置选中元素的周围元素，用于选中元素跟周围元素对齐辅助
    const elementGuidelines: any = this.target?.parentElement?.children || [];
    this.setElementGuidelines([this.target as HTMLElement], elementGuidelines);

    return this.getOptions(false, {
      target: this.targetShadow.el,
    });
  }

  private initMoveable(el: HTMLElement) {
    const options: MoveableOptions = this.init(el);
    this.moveableHelper = MoveableHelper.create({
      useBeforeRender: true,
      useRender: false,
      createAuto: true,
    });

    this.moveable?.destroy();

    this.moveable = new Moveable(this.container, {
      ...options,
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

        this.dragStatus = StageDragStatus.START;
        this.moveableHelper?.onResizeStart(e);

        frame.top = this.target.offsetTop;
        frame.left = this.target.offsetLeft;
      })
      .on('resize', (e) => {
        const { width, height, drag } = e;
        if (!this.moveable || !this.target || !this.targetShadow.el) return;

        const { beforeTranslate } = drag;
        this.dragStatus = StageDragStatus.ING;

        // 流式布局
        if (this.mode === Mode.SORTABLE) {
          this.target.style.top = '0px';
          this.targetShadow.el.style.width = `${width}px`;
          this.targetShadow.el.style.height = `${height}px`;
        } else {
          this.moveableHelper?.onResize(e);
          this.target.style.left = `${frame.left + beforeTranslate[0]}px`;
          this.target.style.top = `${frame.top + beforeTranslate[1]}px`;
        }

        this.target.style.width = `${width}px`;
        this.target.style.height = `${height}px`;
      })
      .on('resizeEnd', () => {
        this.dragStatus = StageDragStatus.END;
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

    this.moveable
      .on('dragStart', (e) => {
        if (!this.target) throw new Error('未选中组件');

        this.dragStatus = StageDragStatus.START;

        this.moveableHelper?.onDragStart(e);

        if (this.mode === Mode.SORTABLE) {
          this.ghostEl = this.generateGhostEl(this.target);
        }

        frame.top = this.target.offsetTop;
        frame.left = this.target.offsetLeft;
      })
      .on('drag', (e) => {
        if (!this.target || !this.targetShadow.el) return;

        if (timeout) {
          globalThis.clearTimeout(timeout);
          timeout = undefined;
        }
        timeout = this.delayedMarkContainer(e.inputEvent, [this.target]);

        this.dragStatus = StageDragStatus.ING;

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

        const parentEl = this.markContainerEnd();
        // 点击不拖动时会触发dragStart和dragEnd，但是不会有drag事件
        if (this.dragStatus === StageDragStatus.ING) {
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

        this.dragStatus = StageDragStatus.END;
        this.destroyGhostEl();
      });
  }

  private bindRotateEvent(): void {
    if (!this.moveable) throw new Error('moveable 未初始化');

    this.moveable
      .on('rotateStart', (e) => {
        this.dragStatus = StageDragStatus.START;
        this.moveableHelper?.onRotateStart(e);
      })
      .on('rotate', (e) => {
        if (!this.target || !this.targetShadow.el) return;
        this.dragStatus = StageDragStatus.ING;
        this.moveableHelper?.onRotate(e);
        const frame = this.moveableHelper?.getFrame(e.target);
        this.target.style.transform = frame?.toCSSObject().transform || '';
      })
      .on('rotateEnd', (e) => {
        this.dragStatus = StageDragStatus.END;
        const frame = this.moveableHelper?.getFrame(e.target);
        this.emit('update', {
          data: [
            {
              el: this.target,
              style: {
                transform: frame?.get('transform'),
              },
            },
          ],
        });
      });
  }

  private bindScaleEvent(): void {
    if (!this.moveable) throw new Error('moveable 未初始化');

    this.moveable
      .on('scaleStart', (e) => {
        this.dragStatus = StageDragStatus.START;
        this.moveableHelper?.onScaleStart(e);
      })
      .on('scale', (e) => {
        if (!this.target || !this.targetShadow.el) return;
        this.dragStatus = StageDragStatus.ING;
        this.moveableHelper?.onScale(e);
        const frame = this.moveableHelper?.getFrame(e.target);
        this.target.style.transform = frame?.toCSSObject().transform || '';
      })
      .on('scaleEnd', (e) => {
        this.dragStatus = StageDragStatus.END;
        const frame = this.moveableHelper?.getFrame(e.target);
        this.emit('update', {
          data: [
            {
              el: this.target,
              style: {
                transform: frame?.get('transform'),
              },
            },
          ],
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

    const doc = this.getRenderDocument();

    if (!doc) return;

    const offset =
      this.mode === Mode.SORTABLE ? { left: 0, top: 0 } : { left: this.target.offsetLeft, top: this.target.offsetTop };

    let left = calcValueByFontsize(doc, offset.left);
    let top = calcValueByFontsize(doc, offset.top);
    const width = calcValueByFontsize(doc, this.target.clientWidth);
    const height = calcValueByFontsize(doc, this.target.clientHeight);

    if (parentEl && this.mode === Mode.ABSOLUTE && this.targetShadow.el) {
      const targetShadowHtmlEl = this.targetShadow.el as HTMLElement;
      const targetShadowElOffsetLeft = targetShadowHtmlEl.offsetLeft || 0;
      const targetShadowElOffsetTop = targetShadowHtmlEl.offsetTop || 0;

      const frame = this.moveableHelper?.getFrame(this.targetShadow.el);

      const [translateX, translateY] = frame?.properties.transform.translate.value;
      const { left: parentLeft, top: parentTop } = getOffset(parentEl);

      left =
        calcValueByFontsize(doc, targetShadowElOffsetLeft) +
        parseFloat(translateX) -
        calcValueByFontsize(doc, parentLeft);
      top =
        calcValueByFontsize(doc, targetShadowElOffsetTop) +
        parseFloat(translateY) -
        calcValueByFontsize(doc, parentTop);
    }

    this.emit('update', {
      data: [
        {
          el: this.target,
          style: isResize ? { left, top, width, height } : { left, top },
        },
      ],
      parentEl,
    });
  }

  private generateGhostEl(el: HTMLElement): HTMLElement {
    if (this.ghostEl) {
      this.destroyGhostEl();
    }

    const ghostEl = el.cloneNode(true) as HTMLElement;
    this.setGhostElChildrenId(ghostEl);
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

  private setGhostElChildrenId(el: Element) {
    for (const child of Array.from(el.children)) {
      if (child.id) {
        child.id = `${GHOST_EL_ID_PREFIX}${child.id}`;
      }

      if (child.children.length) {
        this.setGhostElChildrenId(child);
      }
    }
  }

  private destroyGhostEl(): void {
    this.ghostEl?.remove();
    this.ghostEl = undefined;
  }
}
