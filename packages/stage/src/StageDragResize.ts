/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2023 THL A29 Limited, a Tencent company.  All rights reserved.
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

import { Mode } from './const';
import DragResizeHelper from './DragResizeHelper';
import MoveableOptionsManager from './MoveableOptionsManager';
import type { DelayedMarkContainer, GetRenderDocument, MarkContainerEnd, StageDragResizeConfig } from './types';
import { StageDragStatus } from './types';
import { down, getMode, up } from './util';

/**
 * 管理单选操作，响应选中操作，初始化moveableOption参数并初始化moveable，处理moveable回调事件对组件进行更新
 * @extends MoveableOptionsManager
 */
export default class StageDragResize extends MoveableOptionsManager {
  /** 目标节点 */
  private target?: HTMLElement;
  /** Moveable拖拽类实例 */
  private moveable?: Moveable;
  /** 拖动状态 */
  private dragStatus: StageDragStatus = StageDragStatus.END;
  private dragResizeHelper: DragResizeHelper;
  private disabledDragStart?: boolean;
  private getRenderDocument: GetRenderDocument;
  private markContainerEnd: MarkContainerEnd;
  private delayedMarkContainer: DelayedMarkContainer;

  constructor(config: StageDragResizeConfig) {
    super(config);

    this.getRenderDocument = config.getRenderDocument;
    this.markContainerEnd = config.markContainerEnd;
    this.delayedMarkContainer = config.delayedMarkContainer;
    this.disabledDragStart = config.disabledDragStart;

    this.dragResizeHelper = config.dragResizeHelper;

    this.on('update-moveable', () => {
      if (this.moveable) {
        this.updateMoveable();
      }
    });
  }

  public getTarget() {
    return this.target;
  }

  /**
   * 将选中框渲染并覆盖到选中的组件Dom节点上方
   * 当选中的节点不是absolute时，会创建一个新的节点出来作为拖拽目标
   * @param el 选中组件的Dom节点元素
   * @param event 鼠标事件
   */
  public select(el: HTMLElement, event?: MouseEvent): void {
    // 从不能拖动到能拖动的节点之间切换，要重新创建moveable，不然dragStart不生效
    if (!this.moveable || el !== this.target) {
      this.initMoveable(el);
    } else {
      this.updateMoveable(el);
    }

    if (event && !this.disabledDragStart) {
      this.moveable?.dragStart(event);
    }
  }

  /**
   * 初始化选中框并渲染出来
   */
  public updateMoveable(el = this.target): void {
    if (!this.moveable) return;
    if (!el) throw new Error('未选中任何节点');

    const options: MoveableOptions = this.init(el);

    Object.entries(options).forEach(([key, value]) => {
      (this.moveable as any)[key] = value;
    });
    this.moveable.updateRect();
  }

  public clearSelectStatus(): void {
    if (!this.moveable) return;
    this.dragResizeHelper.destroyShadowEl();
    this.moveable.target = null;
    this.moveable.updateRect();
  }

  public getDragStatus(): StageDragStatus {
    return this.dragStatus;
  }

  /**
   * 销毁实例
   */
  public destroy(): void {
    this.moveable?.destroy();
    this.dragResizeHelper.destroy();
    this.dragStatus = StageDragStatus.END;
    this.removeAllListeners();
  }

  private init(el: HTMLElement): MoveableOptions {
    // 如果有滚动条会导致resize时获取到width，height不准确
    if (/(auto|scroll)/.test(el.style.overflow)) {
      el.style.overflow = 'hidden';
    }

    this.target = el;
    this.mode = getMode(el);

    this.dragResizeHelper.updateShadowEl(el);
    this.dragResizeHelper.setMode(this.mode);

    this.setElementGuidelines([this.target as HTMLElement]);

    return this.getOptions(false, {
      target: this.dragResizeHelper.getShadowEl(),
    });
  }

  private initMoveable(el: HTMLElement) {
    const options: MoveableOptions = this.init(el);
    this.dragResizeHelper.clear();

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

    this.moveable
      .on('resizeStart', (e) => {
        if (!this.target) return;

        this.dragStatus = StageDragStatus.START;
        this.dragResizeHelper.onResizeStart(e);
      })
      .on('resize', (e) => {
        if (!this.moveable || !this.target || !this.dragResizeHelper.getShadowEl()) return;

        this.dragStatus = StageDragStatus.ING;

        this.dragResizeHelper.onResize(e);
      })
      .on('resizeEnd', () => {
        this.dragStatus = StageDragStatus.END;
        this.update(true);
      });
  }

  private bindDragEvent(): void {
    if (!this.moveable) throw new Error('moveable 未初始化');

    let timeout: NodeJS.Timeout | undefined;

    this.moveable
      .on('dragStart', (e) => {
        if (!this.target) throw new Error('未选中组件');

        this.dragStatus = StageDragStatus.START;

        this.dragResizeHelper.onDragStart(e);
        this.emit('drag-start', e);
      })
      .on('drag', (e) => {
        if (!this.target || !this.dragResizeHelper.getShadowEl()) return;

        if (timeout) {
          globalThis.clearTimeout(timeout);
          timeout = undefined;
        }
        timeout = this.delayedMarkContainer(e.inputEvent, [this.target]);

        this.dragStatus = StageDragStatus.ING;

        this.dragResizeHelper.onDrag(e);
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
        this.dragResizeHelper.destroyGhostEl();
      });
  }

  private bindRotateEvent(): void {
    if (!this.moveable) throw new Error('moveable 未初始化');

    this.moveable
      .on('rotateStart', (e) => {
        this.dragStatus = StageDragStatus.START;
        this.dragResizeHelper.onRotateStart(e);
      })
      .on('rotate', (e) => {
        if (!this.target || !this.dragResizeHelper.getShadowEl()) return;
        this.dragStatus = StageDragStatus.ING;
        this.dragResizeHelper.onRotate(e);
      })
      .on('rotateEnd', (e) => {
        this.dragStatus = StageDragStatus.END;
        const frame = this.dragResizeHelper?.getFrame(e.target);
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
        this.dragResizeHelper.onScaleStart(e);
      })
      .on('scale', (e) => {
        if (!this.target || !this.dragResizeHelper.getShadowEl()) return;
        this.dragStatus = StageDragStatus.ING;
        this.dragResizeHelper.onScale(e);
      })
      .on('scaleEnd', (e) => {
        this.dragStatus = StageDragStatus.END;
        const frame = this.dragResizeHelper.getFrame(e.target);
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
    if (!this.target || !this.dragResizeHelper.getGhostEl()) throw new Error('未知错误');
    const { top } = this.dragResizeHelper.getGhostEl()!.getBoundingClientRect();
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

    const rect = this.dragResizeHelper.getUpdatedElRect(this.target, parentEl, doc);

    this.emit('update', {
      data: [
        {
          el: this.target,
          style: isResize ? rect : { left: rect.left, top: rect.top },
        },
      ],
      parentEl,
    });
  }
}
