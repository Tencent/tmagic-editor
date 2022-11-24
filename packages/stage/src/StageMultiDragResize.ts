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

import type { OnDragStart, OnResizeStart } from 'moveable';
import Moveable from 'moveable';
import MoveableHelper from 'moveable-helper';

import { DRAG_EL_ID_PREFIX, Mode, ZIndex } from './const';
import MoveableOptionsManager from './MoveableOptionsManager';
import TargetShadow from './TargetShadow';
import { GetRenderDocument, MoveableOptionsManagerConfig, StageDragStatus, StageMultiDragResizeConfig } from './types';
import { calcValueByFontsize, getMode } from './util';

export default class StageMultiDragResize extends MoveableOptionsManager {
  /** 画布容器 */
  public container: HTMLElement;
  /** 多选:目标节点组 */
  public targetList: HTMLElement[] = [];
  /** 多选:目标节点在蒙层中的占位节点组 */
  public targetShadow: TargetShadow;
  /** Moveable多选拖拽类实例 */
  public moveableForMulti?: Moveable;
  /** 拖动状态 */
  public dragStatus: StageDragStatus = StageDragStatus.END;
  private multiMoveableHelper?: MoveableHelper;
  private getRenderDocument: GetRenderDocument;

  constructor(config: StageMultiDragResizeConfig) {
    const moveableOptionsManagerConfig: MoveableOptionsManagerConfig = {
      container: config.container,
      moveableOptions: config.multiMoveableOptions,
      getRootContainer: config.getRootContainer,
    };
    super(moveableOptionsManagerConfig);

    this.container = config.container;
    this.getRenderDocument = config.getRenderDocument;

    this.targetShadow = new TargetShadow({
      container: config.container,
      updateDragEl: config.updateDragEl,
      zIndex: ZIndex.DRAG_EL,
      idPrefix: DRAG_EL_ID_PREFIX,
    });

    this.on('update-moveable', () => {
      if (this.moveableForMulti) {
        this.updateMoveable();
      }
    });
  }

  /**
   * 多选
   * @param els
   */
  public multiSelect(els: HTMLElement[]): void {
    if (els.length === 0) {
      return;
    }
    this.mode = getMode(els[0]);
    this.targetList = els;

    this.targetShadow.updateGroup(els);

    // 设置周围元素，用于选中元素跟周围元素的对齐辅助
    const elementGuidelines: any = this.targetList[0].parentElement?.children || [];
    this.setElementGuidelines(this.targetList, elementGuidelines);

    this.moveableForMulti?.destroy();
    this.multiMoveableHelper?.clear();
    this.moveableForMulti = new Moveable(
      this.container,
      this.getOptions(true, {
        target: this.targetShadow.els,
      }),
    );
    this.multiMoveableHelper = MoveableHelper.create({
      useBeforeRender: true,
      useRender: false,
      createAuto: true,
    });
    const frames: { left: number; top: number; id: string }[] = [];

    const setFrames = (events: OnDragStart[] | OnResizeStart[]) => {
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
    };

    this.moveableForMulti
      .on('resizeGroupStart', (params) => {
        const { events } = params;
        this.multiMoveableHelper?.onResizeGroupStart(params);
        setFrames(events);
        this.dragStatus = StageDragStatus.START;
      })
      .on('resizeGroup', (params) => {
        const { events } = params;
        // 拖动过程更新
        events.forEach((ev) => {
          const { width, height, beforeTranslate } = ev.drag;
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
            targeEl.style.left = `${frameSnapShot.left + beforeTranslate[0]}px`;
            targeEl.style.top = `${frameSnapShot.top + beforeTranslate[1]}px`;
          }

          // 更新页面元素位置
          targeEl.style.width = `${width}px`;
          targeEl.style.height = `${height}px`;
        });
        this.multiMoveableHelper?.onResizeGroup(params);
        this.dragStatus = StageDragStatus.ING;
      })
      .on('resizeGroupEnd', () => {
        this.update(true);
        this.dragStatus = StageDragStatus.END;
      })
      .on('dragGroupStart', (params) => {
        const { events } = params;
        this.multiMoveableHelper?.onDragGroupStart(params);
        // 记录拖动前快照
        setFrames(events);
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
        // 如果有多个元素被选中，同时点击的元素在选中元素中的其中一项，可能是多选态切换为该元素的单选态，抛事件给上一层继续判断是否切换
        if (targets.length > 1 && targets.includes(inputTarget)) {
          this.emit('change-to-select', inputTarget.id.replace(DRAG_EL_ID_PREFIX, ''));
        }
      });
  }

  public canSelect(el: HTMLElement, selectedEl: HTMLElement | undefined): boolean {
    const currentTargetMode = getMode(el);
    let selectedElMode = '';

    // 流式布局不支持多选
    if (currentTargetMode === Mode.SORTABLE) {
      return false;
    }

    if (this.targetList.length === 0 && selectedEl) {
      // 单选后添加到多选的情况
      selectedElMode = getMode(selectedEl);
    } else if (this.targetList.length > 0) {
      // 已加入多选列表的布局模式是一样的，取第一个判断
      selectedElMode = getMode(this.targetList[0]);
    }
    // 定位模式不同，不可混选
    if (currentTargetMode !== selectedElMode) {
      return false;
    }
    return true;
  }

  public updateMoveable(eleList = this.targetList) {
    if (!this.moveableForMulti) return;
    if (!eleList) throw new Error('未选中任何节点');

    this.targetList = eleList;

    const options = this.getOptions(true, {
      target: this.targetShadow.els,
    });

    Object.entries(options).forEach(([key, value]) => {
      (this.moveableForMulti as any)[key] = value;
    });
    this.moveableForMulti.updateTarget();
  }

  /**
   * 清除多选状态
   */
  public clearSelectStatus(): void {
    if (!this.moveableForMulti) return;
    this.targetShadow.destroyEls();
    this.moveableForMulti.target = null;
    this.moveableForMulti.updateTarget();
    this.targetList = [];
  }

  /**
   * 销毁实例
   */
  public destroy(): void {
    this.moveableForMulti?.destroy();
    this.targetShadow.destroy();
  }

  /**
   * 拖拽完成后将更新的位置信息暴露给上层业务方，业务方可以接收事件进行保存
   * @param isResize 是否进行大小缩放
   */
  private update(isResize = false): void {
    if (this.targetList.length === 0) return;

    const doc = this.getRenderDocument();
    if (!doc) return;

    const data = this.targetList.map((targetItem) => {
      const left = calcValueByFontsize(doc, targetItem.offsetLeft);
      const top = calcValueByFontsize(doc, targetItem.offsetTop);
      const width = calcValueByFontsize(doc, targetItem.clientWidth);
      const height = calcValueByFontsize(doc, targetItem.clientHeight);
      return {
        el: targetItem,
        style: isResize ? { left, top, width, height } : { left, top },
      };
    });
    this.emit('update', data, null);
  }
}
