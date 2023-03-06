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

import KeyController from 'keycon';
import { throttle } from 'lodash-es';

import { Env } from '@tmagic/core';
import { Id } from '@tmagic/schema';
import { addClassName, getDocument, removeClassNameByClassName } from '@tmagic/utils';

import { CONTAINER_HIGHLIGHT_CLASS_NAME, GHOST_EL_ID_PREFIX, GuidesType, MouseButton, PAGE_CLASS } from './const';
import DragResizeHelper from './DragResizeHelper';
import StageDragResize from './StageDragResize';
import StageHighlight from './StageHighlight';
import StageMultiDragResize from './StageMultiDragResize';
import {
  ActionManagerConfig,
  CanSelect,
  ContainerHighlightType,
  CustomizeMoveableOptions,
  CustomizeMoveableOptionsCallbackConfig,
  GetElementsFromPoint,
  GetRenderDocument,
  GetTargetElement,
  IsContainer,
  Point,
  RemoveEventData,
  SelectStatus,
  StageDragStatus,
  UpdateEventData,
} from './types';
import { isMoveableButton } from './util';

const throttleTime = 100;
const defaultContainerHighlightDuration = 800;

/**
 * 管理蒙层mask之上的操作：1、监听键盘鼠标事件，判断形成单选、多选、高亮操作；2、管理单选、多选、高亮三个类协同工作。
 * @extends EventEmitter
 */
export default class ActionManager extends EventEmitter {
  private dr: StageDragResize;
  private multiDr: StageMultiDragResize;
  private highlightLayer: StageHighlight;
  /** 单选、多选、高亮的容器（蒙层的content） */
  private container: HTMLElement;
  /** 当前选中的节点 */
  private selectedEl: HTMLElement | undefined;
  /** 多选选中的节点组 */
  private selectedElList: HTMLElement[] = [];
  /** 当前高亮的节点 */
  private highlightedEl: HTMLElement | undefined;
  /** 当前是否处于多选状态 */
  private isMultiSelectStatus = false;
  /** 当拖拽组件到容器上方进入可加入容器状态时，给容器添加的一个class名称 */
  private containerHighlightClassName: string;
  /** 当拖拽组件到容器上方时，需要悬停多久才能将组件加入容器 */
  private containerHighlightDuration: number;
  /** 将组件加入容器的操作方式 */
  private containerHighlightType?: ContainerHighlightType;
  private isAltKeydown = false;
  private getTargetElement: GetTargetElement;
  private getElementsFromPoint: GetElementsFromPoint;
  private canSelect: CanSelect;
  private isContainer: IsContainer;
  private getRenderDocument: GetRenderDocument;

  private mouseMoveHandler = throttle(async (event: MouseEvent): Promise<void> => {
    const el = await this.getElementFromPoint(event);
    if (!el) {
      this.clearHighlight();
      return;
    }
    this.highlight(el);
  }, throttleTime);

  constructor(config: ActionManagerConfig) {
    super();
    this.container = config.container;
    this.containerHighlightClassName = config.containerHighlightClassName || CONTAINER_HIGHLIGHT_CLASS_NAME;
    this.containerHighlightDuration = config.containerHighlightDuration || defaultContainerHighlightDuration;
    this.containerHighlightType = config.containerHighlightType;
    this.getTargetElement = config.getTargetElement;
    this.getElementsFromPoint = config.getElementsFromPoint;
    this.canSelect = config.canSelect || ((el: HTMLElement) => !!el.id);
    this.getRenderDocument = config.getRenderDocument;
    this.isContainer = config.isContainer;

    const createDrHelper = () =>
      new DragResizeHelper({
        container: config.container,
        updateDragEl: config.updateDragEl,
      });

    this.dr = new StageDragResize({
      container: config.container,
      disabledDragStart: config.disabledDragStart,
      moveableOptions: this.changeCallback(config.moveableOptions),
      dragResizeHelper: createDrHelper(),
      getRootContainer: config.getRootContainer,
      getRenderDocument: config.getRenderDocument,
      markContainerEnd: this.markContainerEnd.bind(this),
      delayedMarkContainer: this.delayedMarkContainer.bind(this),
    });
    this.multiDr = new StageMultiDragResize({
      container: config.container,
      multiMoveableOptions: config.multiMoveableOptions,
      dragResizeHelper: createDrHelper(),
      getRootContainer: config.getRootContainer,
      getRenderDocument: config.getRenderDocument,
      markContainerEnd: this.markContainerEnd.bind(this),
      delayedMarkContainer: this.delayedMarkContainer.bind(this),
    });
    this.highlightLayer = new StageHighlight({
      container: config.container,
      updateDragEl: config.updateDragEl,
      getRootContainer: config.getRootContainer,
    });

    this.initMouseEvent();
    this.initKeyEvent();
    this.initActionEvent();
  }

  /**
   * 设置水平/垂直参考线
   * @param type 参考线类型
   * @param guidelines 参考线坐标数组
   */
  public setGuidelines(type: GuidesType, guidelines: number[]): void {
    this.dr.setGuidelines(type, guidelines);
    this.multiDr.setGuidelines(type, guidelines);
  }

  /**
   * 清空所有参考线
   */
  public clearGuides(): void {
    this.dr.clearGuides();
    this.multiDr.clearGuides();
  }

  /**
   * 更新moveable，外部主要调用场景是元素配置变更、页面大小变更
   * @param el 变更的元素
   */
  public updateMoveable(el?: HTMLElement): void {
    this.dr.updateMoveable(el);
    // 多选时不可配置元素，因此不存在多选元素变更，不需要传el
    this.multiDr.updateMoveable();
  }

  /**
   * 判断是否单选选中的元素
   */
  public isSelectedEl(el: HTMLElement): boolean {
    // 有可能dom已经重新渲染，不再是原来的dom了，所以这里判断id，而不是判断el === this.selectedDom
    return el.id === this.selectedEl?.id;
  }

  public setSelectedEl(el: HTMLElement): void {
    this.selectedEl = el;
  }

  public getSelectedEl(): HTMLElement | undefined {
    return this.selectedEl;
  }

  public getSelectedElList(): HTMLElement[] {
    return this.selectedElList;
  }

  /**
   * 获取鼠标下方第一个可选中元素，如果元素层叠，返回到是最上层元素
   * @param event 鼠标事件
   * @returns 鼠标下方第一个可选中元素
   */
  public async getElementFromPoint(event: MouseEvent): Promise<HTMLElement | undefined> {
    const els = this.getElementsFromPoint(event as Point);

    let stopped = false;
    const stop = () => (stopped = true);
    for (const el of els) {
      if (!el.id.startsWith(GHOST_EL_ID_PREFIX) && (await this.isElCanSelect(el, event, stop))) {
        if (stopped) break;
        return el;
      }
    }
  }

  /**
   * 判断一个元素能否在当前场景被选中
   * @param el 被判断的元素
   * @param event 鼠标事件
   * @param stop 通过该元素如果得知剩下的元素都不可被选中，通知调用方终止对剩下元素的判断
   * @returns 能否选中
   */
  public async isElCanSelect(el: HTMLElement, event: MouseEvent, stop: () => boolean): Promise<boolean> {
    // 执行业务方传入的判断逻辑
    const canSelectByProp = await this.canSelect(el, event, stop);
    if (!canSelectByProp) return false;
    // 多选规则
    if (this.isMultiSelectStatus) {
      return this.canMultiSelect(el, stop);
    }
    return true;
  }

  /**
   * 判断一个元素是否可以被多选，如果当前元素是page，则调stop函数告诉调用方不必继续判断其它元素了
   */
  public canMultiSelect(el: HTMLElement, stop: () => boolean): boolean {
    // 多选状态下不可以选中magic-ui-page，并停止继续向上层选中
    if (el.className.includes(PAGE_CLASS)) {
      stop();
      return false;
    }
    const selectedEl = this.getSelectedEl();
    // 先单击选中了页面(magic-ui-page)，再按住多选键多选时，任一元素均可选中
    if (selectedEl?.className.includes(PAGE_CLASS)) {
      return true;
    }
    return this.multiDr.canSelect(el, selectedEl);
  }

  public select(el: HTMLElement, event: MouseEvent | undefined): void {
    this.selectedEl = el;
    this.clearSelectStatus(SelectStatus.MULTI_SELECT);
    this.dr.select(el, event);
  }

  public multiSelect(idOrElList: HTMLElement[] | Id[]): void {
    this.selectedElList = idOrElList.map((idOrEl) => this.getTargetElement(idOrEl));
    this.clearSelectStatus(SelectStatus.SELECT);
    this.multiDr.multiSelect(this.selectedElList);
  }

  public getHighlightEl(): HTMLElement | undefined {
    return this.highlightedEl;
  }

  public setHighlightEl(el: HTMLElement | undefined): void {
    this.highlightedEl = el;
  }

  public highlight(idOrEl: Id | HTMLElement): void {
    let el;
    try {
      el = this.getTargetElement(idOrEl);
    } catch (error) {
      this.clearHighlight();
      return;
    }

    // 选中组件不高亮、多选拖拽状态不高亮
    if (el === this.getSelectedEl() || this.multiDr.dragStatus === StageDragStatus.ING) {
      this.clearHighlight();
      return;
    }
    if (el === this.highlightedEl || !el) return;

    this.highlightLayer.highlight(el);
    this.highlightedEl = el;
    this.emit('highlight', el);
  }

  public clearHighlight(): void {
    this.setHighlightEl(undefined);
    this.highlightLayer.clearHighlight();
  }

  /**
   * 用于在切换选择模式时清除上一次的状态
   * @param selectType 需要清理的选择模式
   */
  public clearSelectStatus(selectType: SelectStatus): void {
    if (selectType === SelectStatus.MULTI_SELECT) {
      this.multiDr.clearSelectStatus();
      this.selectedElList = [];
    } else {
      this.dr.clearSelectStatus();
    }
  }

  /**
   * 找到鼠标下方的容器，通过添加className对容器进行标记
   * @param event 鼠标事件
   * @param excludeElList 计算鼠标点所在容器时要排除的元素列表
   */
  public async addContainerHighlightClassName(event: MouseEvent, excludeElList: Element[]): Promise<void> {
    const doc = this.getRenderDocument();
    if (!doc) return;

    const els = this.getElementsFromPoint(event);

    for (const el of els) {
      if (!el.id.startsWith(GHOST_EL_ID_PREFIX) && (await this.isContainer(el)) && !excludeElList.includes(el)) {
        addClassName(el, doc, this.containerHighlightClassName);
        break;
      }
    }
  }

  /**
   * 鼠标拖拽着元素，在容器上方悬停，延迟一段时间后，对容器进行标记，如果悬停时间够长将标记成功，悬停时间短，调用方通过返回的timeoutId取消标记
   * 标记的作用：1、高亮容器，给用户一个加入容器的交互感知；2、释放鼠标后，通过标记的标志找到要加入的容器
   * @param event 鼠标事件
   * @param excludeElList 计算鼠标所在容器时要排除的元素列表
   * @returns timeoutId，调用方在鼠标移走时要取消该timeout，阻止标记
   */
  public delayedMarkContainer(event: MouseEvent, excludeElList: Element[] = []): NodeJS.Timeout | undefined {
    if (this.canAddToContainer()) {
      return globalThis.setTimeout(() => {
        this.addContainerHighlightClassName(event, excludeElList);
      }, this.containerHighlightDuration);
    }
    return undefined;
  }

  public destroy(): void {
    this.container.removeEventListener('mousedown', this.mouseDownHandler);
    this.container.removeEventListener('mousemove', this.mouseMoveHandler);
    this.container.removeEventListener('mouseleave', this.mouseLeaveHandler);
    this.container.removeEventListener('wheel', this.mouseWheelHandler);
    this.dr.destroy();
    this.multiDr.destroy();
    this.highlightLayer.destroy();
  }

  private changeCallback(options: CustomizeMoveableOptions): CustomizeMoveableOptions {
    // 在actionManager才能获取到各种参数，在这里传好参数有比较好的扩展性
    if (typeof options === 'function') {
      return () => {
        // 要再判断一次，不然过不了ts检查
        if (typeof options === 'function') {
          const cfg: CustomizeMoveableOptionsCallbackConfig = {
            targetElId: this.selectedEl?.id,
          };
          return options(cfg);
        }
        return options;
      };
    }
    return options;
  }

  /**
   * 在执行多选逻辑前，先准备好多选选中元素
   * @param el 新选中的元素
   * @returns 多选选中的元素列表
   */
  private async beforeMultiSelect(event: MouseEvent): Promise<void> {
    const el = await this.getElementFromPoint(event);
    if (!el) return;

    // 如果已有单选选中元素，不是magic-ui-page就可以加入多选列表
    if (this.selectedEl && !this.selectedEl.className.includes(PAGE_CLASS)) {
      this.selectedElList.push(this.selectedEl as HTMLElement);
      this.selectedEl = undefined;
    }
    // 判断元素是否已在多选列表
    const existIndex = this.selectedElList.findIndex((selectedDom) => selectedDom.id === el.id);
    if (existIndex !== -1) {
      // 再次点击取消选中
      this.selectedElList.splice(existIndex, 1);
    } else {
      this.selectedElList.push(el);
    }
  }

  /**
   * 当前状态下能否将组件加入容器，默认是鼠标悬停一段时间加入，alt模式则是按住alt+鼠标悬停一段时间加入
   */
  private canAddToContainer(): boolean {
    return (
      this.containerHighlightType === ContainerHighlightType.DEFAULT ||
      (this.containerHighlightType === ContainerHighlightType.ALT && this.isAltKeydown)
    );
  }

  /**
   * 结束对container的标记状态
   * @returns 标记的容器元素，没有标记的容器时返回null
   */
  private markContainerEnd(): HTMLElement | null {
    const doc = this.getRenderDocument();
    if (doc && this.canAddToContainer()) {
      return removeClassNameByClassName(doc, this.containerHighlightClassName);
    }
    return null;
  }

  private initMouseEvent(): void {
    this.container.addEventListener('mousedown', this.mouseDownHandler);
    this.container.addEventListener('mousemove', this.mouseMoveHandler);
    this.container.addEventListener('mouseleave', this.mouseLeaveHandler);
    this.container.addEventListener('wheel', this.mouseWheelHandler);
  }

  /**
   * 初始化键盘事件监听
   */
  private initKeyEvent(): void {
    const { isMac } = new Env();
    const ctrl = isMac ? 'meta' : 'ctrl';

    // 多选启用状态监听
    KeyController.global.keydown(ctrl, (e) => {
      e.inputEvent.preventDefault();
      this.isMultiSelectStatus = true;
    });
    // ctrl+tab切到其他窗口，需要将多选状态置为false
    KeyController.global.on('blur', () => {
      this.isMultiSelectStatus = false;
    });
    KeyController.global.keyup(ctrl, (e) => {
      e.inputEvent.preventDefault();
      this.isMultiSelectStatus = false;
    });

    // alt健监听，用于启用拖拽组件加入容器状态
    KeyController.global.keydown('alt', (e) => {
      e.inputEvent.preventDefault();
      this.isAltKeydown = true;
    });

    KeyController.global.keyup('alt', (e) => {
      e.inputEvent.preventDefault();
      this.markContainerEnd();
      this.isAltKeydown = false;
    });
  }

  /**
   * 处理单选、多选抛出来的事件
   */
  private initActionEvent(): void {
    this.dr
      .on('update', (data: UpdateEventData) => {
        // 点击组件并立即拖动的场景，要保证select先被触发，延迟update通知
        setTimeout(() => this.emit('update', data));
      })
      .on('sort', (data: UpdateEventData) => {
        // 点击组件并立即拖动的场景，要保证select先被触发，延迟update通知
        setTimeout(() => this.emit('sort', data));
      })
      .on('select-parent', () => {
        this.emit('select-parent');
      })
      .on('remove', () => {
        const drTarget = this.dr.getTarget();
        if (!drTarget) return;
        const data: RemoveEventData = {
          data: [{ el: drTarget }],
        };
        this.emit('remove', data);
      });

    this.multiDr
      .on('update', (data: UpdateEventData) => {
        this.emit('multi-update', data);
      })
      .on('change-to-select', async (id: Id) => {
        // 如果还在多选状态，不触发切换到单选
        if (this.isMultiSelectStatus) return false;
        const el = this.getTargetElement(id);
        this.emit('change-to-select', el);
      });
  }

  /**
   * 在down事件中集中cpu处理画布中选中操作渲染，在up事件中再通知外面的编辑器更新
   */
  private mouseDownHandler = async (event: MouseEvent): Promise<void> => {
    this.clearHighlight();
    event.stopImmediatePropagation();
    event.stopPropagation();

    if (this.isStopTriggerSelect(event)) return;

    // 点击状态下不触发高亮事件
    this.container.removeEventListener('mousemove', this.mouseMoveHandler);

    // 判断触发多选还是单选
    if (this.isMultiSelectStatus) {
      await this.beforeMultiSelect(event);
      if (this.selectedElList.length > 0) {
        this.emit('before-multi-select', this.selectedElList);
      }
    } else {
      const el = await this.getElementFromPoint(event);
      if (!el) return;
      this.emit('before-select', el, event);
    }
    getDocument().addEventListener('mouseup', this.mouseUpHandler);
  };

  private isStopTriggerSelect(event: MouseEvent): boolean {
    if (event.button !== MouseButton.LEFT && event.button !== MouseButton.RIGHT) return true;
    if (!event.target) return true;

    const targetClassList = (event.target as HTMLDivElement).classList;

    // 如果单击多选选中区域，则不需要再触发选中了，要支持此处单击后进行拖动
    if (!this.isMultiSelectStatus && targetClassList.contains('moveable-area')) {
      return true;
    }
    // 点击对象如果是边框锚点，则可能是resize; 点击对象是功能按钮
    if (targetClassList.contains('moveable-control') || isMoveableButton(event.target as Element)) {
      return true;
    }
    return false;
  }

  /**
   * 在up事件中负责对外通知选中事件，通知画布之外的编辑器更新
   */
  private mouseUpHandler = (): void => {
    getDocument().removeEventListener('mouseup', this.mouseUpHandler);
    this.container.addEventListener('mousemove', this.mouseMoveHandler);
    if (this.isMultiSelectStatus) {
      this.emit('multi-select', this.selectedElList);
    } else {
      this.emit('select', this.selectedEl);
    }
  };

  private mouseLeaveHandler = () => {
    setTimeout(() => this.clearHighlight(), throttleTime);
  };

  private mouseWheelHandler = () => {
    this.clearHighlight();
  };
}
