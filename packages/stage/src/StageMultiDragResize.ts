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

import type { MoveableOptions } from 'moveable';
import Moveable from 'moveable';
import MoveableHelper from 'moveable-helper';

import { DRAG_EL_ID_PREFIX, PAGE_CLASS } from './const';
import StageCore from './StageCore';
import StageMask from './StageMask';
import { StageDragResizeConfig, StageDragStatus } from './types';
import { calcValueByFontsize, getMode, getTargetElStyle } from './util';

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
  /** 拖动状态 */
  public dragStatus: StageDragStatus = StageDragStatus.END;
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
    this.moveableForMulti = new Moveable(
      this.container,
      this.getOptions({
        target: this.dragElList,
      }),
    );
    this.multiMoveableHelper = MoveableHelper.create({
      useBeforeRender: true,
      useRender: false,
      createAuto: true,
    });
    const frames: { left: number; top: number; id: string }[] = [];
    this.moveableForMulti
      .on('dragGroupStart', (params) => {
        const { events } = params;
        this.multiMoveableHelper?.onDragGroupStart(params);
        // 记录拖动前快照
        events.forEach((ev) => {
          // 实际目标元素
          const matchEventTarget = this.targetList.find(
            (targetItem) => targetItem.id === ev.target.id.replace(DRAG_EL_ID_PREFIX, ''),
          );
          if (!matchEventTarget) return;
          frames.push({
            left: matchEventTarget.offsetLeft,
            top: matchEventTarget.offsetTop,
            id: matchEventTarget.id,
          });
        });
        this.dragStatus = StageDragStatus.START;
      })
      .on('dragGroup', (params) => {
        const { events } = params;
        // 拖动过程更新
        events.forEach((ev) => {
          const frameSnapShot = frames.find(
            (frameItem) => frameItem.id === ev.target.id.replace(DRAG_EL_ID_PREFIX, ''),
          );
          if (!frameSnapShot) return;
          const targeEl = this.targetList.find(
            (targetItem) => targetItem.id === ev.target.id.replace(DRAG_EL_ID_PREFIX, ''),
          );
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
        this.dragStatus = StageDragStatus.ING;
      })
      .on('dragGroupEnd', () => {
        this.update();
        this.dragStatus = StageDragStatus.END;
      })
      .on('clickGroup', (params) => {
        const { inputTarget, targets } = params;
        // 如果此时mask不处于多选状态下，且有多个元素被选中，同时点击的元素在选中元素中的其中一项，代表多选态切换为该元素的单选态
        if (!this.mask.isMultiSelectStatus && targets.length > 1 && targets.includes(inputTarget)) {
          this.emit('select', inputTarget.id.replace(DRAG_EL_ID_PREFIX, ''));
        }
      });
  }

  public canSelect(el: HTMLElement, stop: () => boolean): Boolean {
    // 多选状态下不可以选中magic-ui-page，并停止继续向上层选中
    if (el.className.includes(PAGE_CLASS)) {
      this.core.highlightedDom = undefined;
      this.core.highlightLayer.clearHighlight();
      stop();
      return false;
    }
    const currentTargetMode = getMode(el);
    let selectedDomMode = '';
    if (this.core.selectedDom?.className.includes(PAGE_CLASS)) {
      // 先单击选中了页面(magic-ui-page)，再按住多选键多选时，任一元素均可选中
      return true;
    }
    if (this.targetList.length === 0 && this.core.selectedDom) {
      // 单选后添加到多选的情况
      selectedDomMode = getMode(this.core.selectedDom);
    } else if (this.targetList.length > 0) {
      // 已加入多选列表的布局模式是一样的，取第一个判断
      selectedDomMode = getMode(this.targetList[0]);
    }
    // 定位模式不同，不可混选
    if (currentTargetMode !== selectedDomMode) {
      return false;
    }
    return true;
  }

  /**
   * 清除多选状态
   */
  public clearSelectStatus(): void {
    if (!this.moveableForMulti) return;
    this.destroyDragElList();
    this.moveableForMulti.target = null;
    this.moveableForMulti.updateTarget();
    this.targetList = [];
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

  /**
   * 拖拽完成后将更新的位置信息暴露给上层业务方，业务方可以接收事件进行保存
   * @param isResize 是否进行大小缩放
   */
  private update(isResize = false): void {
    if (this.targetList.length === 0) return;

    const { contentWindow } = this.core.renderer;
    const doc = contentWindow?.document;
    if (!doc) return;

    this.emit('update', {
      data: this.targetList.map((targetItem) => {
        const offset = { left: targetItem.offsetLeft, top: targetItem.offsetTop };
        const left = calcValueByFontsize(doc, offset.left);
        const top = calcValueByFontsize(doc, offset.top);
        const width = calcValueByFontsize(doc, targetItem.clientWidth);
        const height = calcValueByFontsize(doc, targetItem.clientHeight);
        return {
          el: targetItem,
          style: isResize ? { left, top, width, height } : { left, top },
        };
      }),
      parentEl: null,
    });
  }

  /**
   * 获取moveable options参数
   * @param {MoveableOptions} options
   * @return {MoveableOptions} moveable options参数
   */
  private getOptions(options: MoveableOptions = {}): MoveableOptions {
    let { multiMoveableOptions = {} } = this.core.config;

    if (typeof multiMoveableOptions === 'function') {
      multiMoveableOptions = multiMoveableOptions(this.core);
    }

    return {
      defaultGroupRotate: 0,
      defaultGroupOrigin: '50% 50%',
      draggable: true,
      resizable: false,
      throttleDrag: 0,
      startDragRotate: 0,
      throttleDragRotate: 0,
      zoom: 1,
      origin: true,
      padding: { left: 0, top: 0, right: 0, bottom: 0 },
      snappable: true,
      bounds: {
        top: 0,
        // 设置0的话无法移动到left为0，所以只能设置为-1
        left: -1,
        right: this.container.clientWidth - 1,
        bottom: this.container.clientHeight,
        ...(multiMoveableOptions.bounds || {}),
      },
      ...options,
      ...multiMoveableOptions,
    };
  }
}
