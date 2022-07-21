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

import Moveable from 'moveable';
import MoveableHelper from 'moveable-helper';

import { DRAG_EL_ID_PREFIX } from './const';
import StageCore from './StageCore';
import StageMask from './StageMask';
import { StageDragResizeConfig } from './types';
import { getTargetElStyle } from './util';
export default class StageMultiDragResize extends EventEmitter {
  public core: StageCore;
  public mask: StageMask;
  /** 画布容器 */
  public container: HTMLElement;
  /** 多选:目标节点组 */
  public targetList: HTMLElement[] = [];
  /** 多选:目标节点在蒙层中的占位节点组 */
  public dragElList: HTMLDivElement[] = [];
  /** Moveable多选拖拽类实例 */
  public moveableForMulti?: Moveable;
  private multiMoveableHelper?: MoveableHelper;

  constructor(config: StageDragResizeConfig) {
    super();

    this.core = config.core;
    this.container = config.container;
    this.mask = config.mask;
  }

  /**
   * 多选
   * @param els
   */
  public multiSelect(els: HTMLElement[]): void {
    this.targetList = els;
    this.core.dr.destroyDragEl();
    this.destroyDragElList();
    // 生成虚拟多选节点
    this.dragElList = els.map((elItem) => {
      const dragElDiv = globalThis.document.createElement('div');
      this.container.append(dragElDiv);
      dragElDiv.style.cssText = getTargetElStyle(elItem);
      dragElDiv.id = `${DRAG_EL_ID_PREFIX}${elItem.id}`;
      // 业务方校准
      if (typeof this.core.config.updateDragEl === 'function') {
        this.core.config.updateDragEl(dragElDiv, elItem);
      }
      return dragElDiv;
    });
    this.moveableForMulti?.destroy();
    this.multiMoveableHelper?.clear();

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
    this.multiMoveableHelper = MoveableHelper.create({
      useBeforeRender: true,
      useRender: false,
      createAuto: true,
    });
    const frames: { left: number; top: number; dragLeft: number; dragTop: number; id: string }[] = [];
    this.moveableForMulti
      .on('dragGroupStart', (params) => {
        const { events } = params;
        this.multiMoveableHelper?.onDragGroupStart(params);
        // 记录拖动前快照
        events.forEach((ev) => {
          // 实际目标元素
          const matchEventTarget = this.targetList.find((targetItem) => targetItem.id === ev.target.id.split('_')[2]);
          // 蒙层虚拟元素（对于在组内的元素拖动时的相对位置不同，因此需要分别记录）
          const dragEventTarget = ev.target as HTMLDivElement;
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
      .on('dragGroup', (params) => {
        const { events } = params;
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
        });
        this.multiMoveableHelper?.onDragGroup(params);
      });
  }

  /**
   * 清除多选状态
   */
  public clearSelectStatus(): void {
    if (!this.moveableForMulti) return;
    this.destroyDragElList();
    this.moveableForMulti.target = null;
    this.moveableForMulti.updateTarget();
  }

  /**
   * 销毁实例
   */
  public destroy(): void {
    this.moveableForMulti?.destroy();
    this.destroyDragElList();
  }

  /**
   * 清除蒙层占位节点
   */
  public destroyDragElList(): void {
    this.dragElList.forEach((dragElItem) => dragElItem?.remove());
  }
}
