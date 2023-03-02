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

import EventEmitter from 'events';

import { merge } from 'lodash-es';
import { MoveableOptions } from 'moveable';

import { GuidesType, Mode } from './const';
import MoveableActionsAble from './MoveableActionsAble';
import { AbleActionEventType, GetRootContainer, MoveableOptionsManagerConfig } from './types';
import { getOffset } from './util';

/**
 * 单选和多选的父类，用于管理moveableOptions
 * @extends EventEmitter
 */
export default class MoveableOptionsManager extends EventEmitter {
  /** 布局方式：流式布局、绝对定位、固定定位 */
  public mode: Mode = Mode.ABSOLUTE;

  /** 画布容器 */
  protected container: HTMLElement;

  /** 水平参考线 */
  private horizontalGuidelines: number[] = [];
  /** 垂直参考线 */
  private verticalGuidelines: number[] = [];
  /** 对齐元素集合 */
  private elementGuidelines: HTMLElement[] = [];
  /** 由外部调用方（编辑器）传入进来的moveable默认参数，可以为空，也可以是一个回调函数 */
  private customizedOptions?: (() => MoveableOptions) | MoveableOptions;
  /** 获取整个画布的根元素（在StageCore的mount函数中挂载的container） */
  private getRootContainer: GetRootContainer;

  constructor(config: MoveableOptionsManagerConfig) {
    super();
    this.customizedOptions = config.moveableOptions;
    this.container = config.container;
    this.getRootContainer = config.getRootContainer;
  }

  /**
   * 设置水平/垂直参考线
   * @param type 参考线类型
   * @param guidelines 参考线坐标数组
   */
  public setGuidelines(type: GuidesType, guidelines: number[]): void {
    if (type === GuidesType.HORIZONTAL) {
      this.horizontalGuidelines = guidelines;
    } else if (type === GuidesType.VERTICAL) {
      this.verticalGuidelines = guidelines;
    }

    this.emit('update-moveable');
  }

  /**
   * 清除横向和纵向的参考线
   */
  public clearGuides(): void {
    this.horizontalGuidelines = [];
    this.verticalGuidelines = [];

    this.emit('update-moveable');
  }

  /**
   * 设置有哪些元素要辅助对齐
   * @param selectedElList 选中的元素列表，需要排除在对齐元素之外
   * @param allElList 全部元素列表
   */
  protected setElementGuidelines(selectedElList: HTMLElement[], allElList: HTMLElement[]): void {
    this.elementGuidelines.forEach((node) => {
      node.remove();
    });
    this.elementGuidelines = [];

    if (this.mode === Mode.ABSOLUTE) {
      this.container.append(this.createGuidelineElements(selectedElList, allElList));
    }
  }

  /**
   * 获取moveable参数
   * @param isMultiSelect 是否多选模式
   * @param runtimeOptions 调用时实时传进来的的moveable参数
   * @returns moveable所需参数
   */
  protected getOptions(isMultiSelect: boolean, runtimeOptions: MoveableOptions = {}): MoveableOptions {
    const defaultOptions = this.getDefaultOptions(isMultiSelect);
    const customizedOptions = this.getCustomizeOptions();

    return merge(defaultOptions, customizedOptions, runtimeOptions);
  }

  /**
   * 获取单选和多选的moveable公共参数
   * @returns moveable公共参数
   */
  private getDefaultOptions(isMultiSelect: boolean): MoveableOptions {
    const isSortable = this.mode === Mode.SORTABLE;

    const commonOptions = {
      draggable: true,
      resizable: true,
      rootContainer: this.getRootContainer(),
      zoom: 1,
      throttleDrag: 0,
      snappable: true,
      horizontalGuidelines: this.horizontalGuidelines,
      verticalGuidelines: this.verticalGuidelines,
      elementGuidelines: this.elementGuidelines,
      bounds: {
        top: 0,
        // 设置0的话无法移动到left为0，所以只能设置为-1
        left: -1,
        right: this.container.clientWidth - 1,
        bottom: isSortable ? undefined : this.container.clientHeight,
      },
    };
    const differenceOptions = isMultiSelect ? this.getMultiOptions() : this.getSingleOptions();

    return merge(commonOptions, differenceOptions);
  }

  /**
   * 获取单选下的差异化参数
   * @returns {MoveableOptions} moveable options参数
   */
  private getSingleOptions(): MoveableOptions {
    const isAbsolute = this.mode === Mode.ABSOLUTE;
    const isFixed = this.mode === Mode.FIXED;

    return {
      origin: false,
      dragArea: false,
      scalable: false,
      rotatable: false,
      snapGap: isAbsolute || isFixed,
      snapThreshold: 5,
      snapDigit: 0,
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

      props: {
        actions: true,
      },

      ables: [MoveableActionsAble(this.actionHandler.bind(this))],
    };
  }

  /**
   * 获取多选下的差异化参数
   * @returns {MoveableOptions} moveable options参数
   */
  private getMultiOptions(): MoveableOptions {
    return {
      defaultGroupRotate: 0,
      defaultGroupOrigin: '50% 50%',
      startDragRotate: 0,
      throttleDragRotate: 0,
      origin: true,
      padding: { left: 0, top: 0, right: 0, bottom: 0 },
    };
  }

  /**
   * 获取业务方自定义的moveable参数
   */
  private getCustomizeOptions(): MoveableOptions | undefined {
    if (typeof this.customizedOptions === 'function') {
      return this.customizedOptions();
    }
    return this.customizedOptions;
  }

  /**
   * 这是给selectParentAbles的回调函数，用于触发选中父元素事件
   */
  private actionHandler(type: AbleActionEventType): void {
    this.emit(type);
  }

  /**
   * 为需要辅助对齐的元素创建div
   * @param selectedElList 选中的元素列表，需要排除在对齐元素之外
   * @param allElList 全部元素列表
   * @returns frame 辅助对齐元素集合的页面片
   */
  private createGuidelineElements(selectedElList: HTMLElement[], allElList: HTMLElement[]): DocumentFragment {
    const frame = globalThis.document.createDocumentFragment();

    for (const node of allElList) {
      const { width, height } = node.getBoundingClientRect();
      if (this.isInElementList(node, selectedElList)) continue;
      const { left, top } = getOffset(node);
      const elementGuideline = globalThis.document.createElement('div');
      elementGuideline.style.cssText = `position: absolute;width: ${width}px;height: ${height}px;top: ${top}px;left: ${left}px`;
      this.elementGuidelines.push(elementGuideline);
      frame.append(elementGuideline);
    }

    return frame;
  }

  /**
   * 判断一个元素是否在元素列表里面
   * @param ele 元素
   * @param eleList 元素列表
   * @returns 是否在元素列表里面
   */
  private isInElementList(ele: HTMLElement, eleList: HTMLElement[]): boolean {
    for (const eleItem of eleList) {
      if (ele === eleItem) return true;
    }
    return false;
  }
}
