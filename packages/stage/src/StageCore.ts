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

import { EventEmitter } from 'events';

import type { MoveableOptions, OnDragStart } from 'moveable';

import type { Id } from '@tmagic/schema';

import ActionManager from './ActionManager';
import { DEFAULT_ZOOM } from './const';
import StageMask from './StageMask';
import StageRender from './StageRender';
import type {
  ActionManagerConfig,
  CustomizeRender,
  GuidesEventData,
  Point,
  RemoveData,
  RemoveEventData,
  Runtime,
  StageCoreConfig,
  UpdateData,
  UpdateEventData,
} from './types';

/**
 * 负责管理画布，管理renderer、mask、actionManager三个核心类，并负责统一对外通信，包括提供接口和抛事件
 */
export default class StageCore extends EventEmitter {
  public container?: HTMLDivElement;
  public renderer: StageRender;
  public mask: StageMask;
  public actionManager: ActionManager;

  private pageResizeObserver: ResizeObserver | null = null;
  private autoScrollIntoView: boolean | undefined;
  private customizedRender?: CustomizeRender;

  constructor(config: StageCoreConfig) {
    super();

    this.autoScrollIntoView = config.autoScrollIntoView;
    this.customizedRender = config.render;

    this.renderer = new StageRender({
      runtimeUrl: config.runtimeUrl,
      zoom: config.zoom,
      renderType: config.renderType,
      customizedRender: async (): Promise<HTMLElement | null> => {
        if (this?.customizedRender) {
          return await this.customizedRender(this);
        }
        return null;
      },
    });
    this.mask = new StageMask({
      guidesOptions: config.guidesOptions,
    });
    this.actionManager = new ActionManager(this.getActionManagerConfig(config));

    this.initRenderEvent();
    this.initActionEvent();
    this.initMaskEvent();
  }

  /**
   * 单选选中元素
   * @param idOrEl 选中的id或者元素
   */
  public async select(idOrEl: Id | HTMLElement, event?: MouseEvent): Promise<void> {
    const el = this.renderer.getTargetElement(idOrEl);
    if (el === this.actionManager.getSelectedEl()) return;

    await this.renderer.select([el]);

    this.mask.setLayout(el);

    this.actionManager.select(el, event);

    if (this.autoScrollIntoView || el.dataset.autoScrollIntoView) {
      this.mask.observerIntersection(el);
    }
  }

  /**
   * 多选选中多个元素
   * @param idOrElList 选中元素的id或元素列表
   */
  public async multiSelect(idOrElList: HTMLElement[] | Id[]): Promise<void> {
    const els = idOrElList.map((idOrEl) => this.renderer.getTargetElement(idOrEl));
    if (els.length === 0) return;

    const lastEl = els[els.length - 1];
    // 是否减少了组件选择
    const isReduceSelect = els.length < this.actionManager.getSelectedElList().length;
    await this.renderer.select(els);

    this.mask.setLayout(lastEl);

    this.actionManager.multiSelect(idOrElList);

    if ((this.autoScrollIntoView || lastEl.dataset.autoScrollIntoView) && !isReduceSelect) {
      this.mask.observerIntersection(lastEl);
    }
  }

  /**
   * 高亮选中元素
   * @param el 要高亮的元素
   */
  public highlight(idOrEl: Id | HTMLElement): void {
    this.actionManager.highlight(idOrEl);
  }

  public clearHighlight(): void {
    this.actionManager.clearHighlight();
  }

  /**
   * 更新组件
   * @param data 更新组件的数据
   */
  public async update(data: UpdateData): Promise<void> {
    const { config } = data;

    await this.renderer.update(data);
    // 通过setTimeout等画布中组件完成渲染更新
    setTimeout(() => {
      const el = this.renderer.getTargetElement(`${config.id}`);
      if (el && this.actionManager.isSelectedEl(el)) {
        // 更新了组件的布局，需要重新设置mask是否可以滚动
        this.mask.setLayout(el);
        // 组件有更新，需要set
        this.actionManager.setSelectedEl(el);
        this.actionManager.updateMoveable(el);
      }
    });
  }

  /**
   * 往画布增加一个组件
   * @param data 组件信息数据
   */
  public async add(data: UpdateData): Promise<void> {
    return await this.renderer.add(data);
  }

  /**
   * 从画布删除一个组件
   * @param data 组件信息数据
   */
  public async remove(data: RemoveData): Promise<void> {
    return await this.renderer.remove(data);
  }

  public setZoom(zoom: number = DEFAULT_ZOOM): void {
    this.renderer.setZoom(zoom);
  }

  /**
   * 挂载Dom节点
   * @param el 将stage挂载到该Dom节点上
   */
  public async mount(el: HTMLDivElement) {
    this.container = el;
    const { mask, renderer } = this;

    await renderer.mount(el);
    mask.mount(el);

    this.emit('mounted');
  }

  /**
   * 清空所有参考线
   */
  public clearGuides() {
    this.mask.clearGuides();
    this.actionManager.clearGuides();
  }

  /**
   * @deprecated 废弃接口，建议用delayedMarkContainer代替
   */
  public getAddContainerHighlightClassNameTimeout(
    event: MouseEvent,
    excludeElList: Element[] = [],
  ): NodeJS.Timeout | undefined {
    return this.delayedMarkContainer(event, excludeElList);
  }

  /**
   * 鼠标拖拽着元素，在容器上方悬停，延迟一段时间后，对容器进行标记，如果悬停时间够长将标记成功，悬停时间短，调用方通过返回的timeoutId取消标记
   * 标记的作用：1、高亮容器，给用户一个加入容器的交互感知；2、释放鼠标后，通过标记的标志找到要加入的容器
   * @param event 鼠标事件
   * @param excludeElList 计算鼠标所在容器时要排除的元素列表
   * @returns timeoutId，调用方在鼠标移走时要取消该timeout，阻止标记
   */
  public delayedMarkContainer(event: MouseEvent, excludeElList: Element[] = []): NodeJS.Timeout | undefined {
    return this.actionManager.delayedMarkContainer(event, excludeElList);
  }

  public getMoveableOption<K extends keyof MoveableOptions>(key: K): MoveableOptions[K] | undefined {
    return this.actionManager.getMoveableOption(key);
  }

  public getDragStatus() {
    return this.actionManager.getDragStatus();
  }

  public disableMultiSelect() {
    this.actionManager.disableMultiSelect();
  }

  public enableMultiSelect() {
    this.actionManager.enableMultiSelect();
  }

  /**
   * 销毁实例
   */
  public destroy(): void {
    const { mask, renderer, actionManager, pageResizeObserver } = this;

    renderer.destroy();
    mask.destroy();
    actionManager.destroy();
    pageResizeObserver?.disconnect();

    this.removeAllListeners();

    this.container = undefined;
  }

  /**
   * 监听页面大小变化
   */
  private observePageResize(page: HTMLElement): void {
    if (this.pageResizeObserver) {
      this.pageResizeObserver.disconnect();
    }

    if (typeof ResizeObserver !== 'undefined') {
      this.pageResizeObserver = new ResizeObserver((entries) => {
        this.mask.pageResize(entries);
        this.actionManager.updateMoveable();
      });

      this.pageResizeObserver.observe(page);
    }
  }

  private getActionManagerConfig(config: StageCoreConfig): ActionManagerConfig {
    const actionManagerConfig: ActionManagerConfig = {
      containerHighlightClassName: config.containerHighlightClassName,
      containerHighlightDuration: config.containerHighlightDuration,
      containerHighlightType: config.containerHighlightType,
      moveableOptions: config.moveableOptions,
      container: this.mask.content,
      disabledDragStart: config.disabledDragStart,
      disabledMultiSelect: config.disabledMultiSelect,
      canSelect: config.canSelect,
      isContainer: config.isContainer,
      updateDragEl: config.updateDragEl,
      getRootContainer: () => this.container,
      getRenderDocument: () => this.renderer.getDocument(),
      getTargetElement: (idOrEl: Id | HTMLElement) => this.renderer.getTargetElement(idOrEl),
      getElementsFromPoint: (point: Point) => this.renderer.getElementsFromPoint(point),
    };

    return actionManagerConfig;
  }

  private initRenderEvent(): void {
    this.renderer.on('runtime-ready', (runtime: Runtime) => {
      this.emit('runtime-ready', runtime);
    });
    this.renderer.on('page-el-update', (el: HTMLElement) => {
      this.mask?.observe(el);
      this.observePageResize(el);

      this.emit('page-el-update', el);
    });
  }

  private initMaskEvent(): void {
    this.mask.on('change-guides', (data: GuidesEventData) => {
      this.actionManager.setGuidelines(data.type, data.guides);
      this.emit('change-guides', data);
    });
  }

  /**
   * 初始化操作相关事件监听
   */
  private initActionEvent(): void {
    this.initActionManagerEvent();
    this.initDrEvent();
    this.initMulDrEvent();
    this.initHighlightEvent();
    this.initMouseEvent();
  }

  /**
   * 初始化ActionManager类本身抛出来的事件监听
   */
  private initActionManagerEvent(): void {
    this.actionManager
      .on('before-select', (idOrEl: Id | HTMLElement, event?: MouseEvent) => {
        this.select(idOrEl, event);
      })
      .on('select', (selectedEl: HTMLElement, event: MouseEvent) => {
        this.emit('select', selectedEl, event);
      })
      .on('before-multi-select', (idOrElList: HTMLElement[] | Id[]) => {
        this.multiSelect(idOrElList);
      })
      .on('multi-select', (selectedElList: HTMLElement[], event: MouseEvent) => {
        this.emit('multi-select', selectedElList, event);
      })
      .on('dblclick', (event: MouseEvent) => {
        this.emit('dblclick', event);
      });
  }

  /**
   * 初始化DragResize类通过ActionManager抛出来的事件监听
   */
  private initDrEvent(): void {
    this.actionManager
      .on('update', (data: UpdateEventData) => {
        this.emit('update', data);
      })
      .on('sort', (data: UpdateEventData) => {
        this.emit('sort', data);
      })
      .on('select-parent', () => {
        this.emit('select-parent');
      })
      .on('remove', (data: RemoveEventData) => {
        this.emit('remove', data);
      });
  }

  /**
   * 初始化MultiDragResize类通过ActionManager抛出来的事件监听
   */
  private initMulDrEvent(): void {
    this.actionManager
      // 多选切换到单选
      .on('change-to-select', (el: HTMLElement, e: MouseEvent) => {
        this.select(el);
        // 先保证画布内完成渲染，再通知外部更新
        setTimeout(() => this.emit('select', el, e));
      })
      .on('multi-update', (data: UpdateEventData) => {
        this.emit('update', data);
      });
  }

  /**
   * 初始化Highlight类通过ActionManager抛出来的事件监听
   */
  private initHighlightEvent(): void {
    this.actionManager.on('highlight', async (highlightEl: HTMLElement) => {
      this.emit('highlight', highlightEl);
    });
  }

  /**
   * 初始化Highlight类通过ActionManager抛出来的事件监听
   */
  private initMouseEvent(): void {
    this.actionManager
      .on('mousemove', (event: MouseEvent) => {
        this.emit('mousemove', event);
      })
      .on('mouseleave', (event: MouseEvent) => {
        this.emit('mouseleave', event);
      })
      .on('drag-start', (e: OnDragStart) => {
        this.emit('drag-start', e);
      });
  }
}
