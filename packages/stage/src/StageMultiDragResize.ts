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

import Moveable from 'moveable';

import { DRAG_EL_ID_PREFIX, Mode } from './const';
import DragResizeHelper from './DragResizeHelper';
import MoveableOptionsManager from './MoveableOptionsManager';
import { GetRenderDocument, MoveableOptionsManagerConfig, StageDragStatus, StageMultiDragResizeConfig } from './types';
import { calcValueByFontsize, getMode } from './util';

export default class StageMultiDragResize extends MoveableOptionsManager {
  /** 画布容器 */
  public container: HTMLElement;
  /** 多选:目标节点组 */
  public targetList: HTMLElement[] = [];
  /** Moveable多选拖拽类实例 */
  public moveableForMulti?: Moveable;
  public dragStatus: StageDragStatus = StageDragStatus.END;
  private dragResizeHelper: DragResizeHelper;
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

    this.dragResizeHelper = new DragResizeHelper({
      container: config.container,
      updateDragEl: config.updateDragEl,
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

    this.dragResizeHelper.updateGroup(els);

    // 设置周围元素，用于选中元素跟周围元素的对齐辅助
    const elementGuidelines: HTMLElement[] =
      Array.prototype.slice.call(this.targetList[0].parentElement?.children) || [];
    this.setElementGuidelines(this.targetList, elementGuidelines);

    this.moveableForMulti?.destroy();
    this.dragResizeHelper.clear();
    this.moveableForMulti = new Moveable(
      this.container,
      this.getOptions(true, {
        target: this.dragResizeHelper.getShadowEls(),
      }),
    );

    this.moveableForMulti
      .on('resizeGroupStart', (e) => {
        this.dragResizeHelper.onResizeGroupStart(e);
        this.dragStatus = StageDragStatus.START;
      })
      .on('resizeGroup', (e) => {
        this.dragResizeHelper.onResizeGroup(e);
        this.dragStatus = StageDragStatus.ING;
      })
      .on('resizeGroupEnd', () => {
        this.update(true);
        this.dragStatus = StageDragStatus.END;
      })
      .on('dragGroupStart', (e) => {
        this.dragResizeHelper.onDragGroupStart(e);
        this.dragStatus = StageDragStatus.START;
      })
      .on('dragGroup', (e) => {
        this.dragResizeHelper.onDragGroup(e);
        this.dragStatus = StageDragStatus.ING;
      })
      .on('dragGroupEnd', () => {
        this.update();
        this.dragStatus = StageDragStatus.END;
      })
      .on('clickGroup', (e) => {
        const { inputTarget, targets } = e;
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
    this.dragResizeHelper.setTargetList(eleList);

    const options = this.getOptions(true, {
      target: this.dragResizeHelper.getShadowEls(),
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
    this.dragResizeHelper.clearMultiSelectStatus();
    this.moveableForMulti.target = null;
    this.moveableForMulti.updateTarget();
    this.targetList = [];
  }

  /**
   * 销毁实例
   */
  public destroy(): void {
    this.moveableForMulti?.destroy();
    this.dragResizeHelper.destroy();
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
