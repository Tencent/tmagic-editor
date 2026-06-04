/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.  All rights reserved.
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

import type { GuidesOptions } from '@scena/guides';
import type { MoveableOptions, OnDragStart } from 'moveable';

import type { Id, MApp, MContainer, MNode } from '@tmagic/core';
import Core from '@tmagic/core';

import { AbleActionEventType, ContainerHighlightType, GuidesType, RenderType, ZIndex } from './const';
import DragResizeHelper from './DragResizeHelper';
import StageCore from './StageCore';

export type TargetElement = HTMLElement | SVGElement;

export type CanSelect = (el: HTMLElement, event: MouseEvent, stop: () => boolean) => boolean | Promise<boolean>;
export type IsContainer = (el: HTMLElement) => boolean | Promise<boolean>;
/**
 * 判断当前正在拖动的源是否可以拖入目标容器（用于画布上拖入组件时的容器高亮命中）
 * @param sourceIds 当前正在拖动的源节点 id 列表
 *   - 在画布上拖动已有组件时：为被拖动的组件 id（多选拖动时为多个）
 *   - 从组件列表拖入新组件时：为空数组（此时尚无 id，可仅依据 targetId 判断）
 * @param targetId 已通过 isContainer 命中的候选容器节点 id
 * @returns
 *   - `false`：阻止该容器被视为合法拖入目标（不会被高亮命中）
 *   - `Id`（string | number）：将拖入目标重定向到该 id 对应的节点
 *   - 其他（`true` / `void` / `undefined`）：按命中的 targetId 正常拖入
 */
export type CanDropIn = (sourceIds: Id[], targetId: Id) => Id | boolean | void;
export type CustomizeRender = (renderer: StageCore) => Promise<HTMLElement | void> | HTMLElement | void;

export type CustomizeMoveableOptionsFunction = (config: CustomizeMoveableOptionsCallbackConfig) => MoveableOptions;

/** 业务方自定义的moveableOptions，可以是配置，也可以是回调函数 */
export type CustomizeMoveableOptions = CustomizeMoveableOptionsFunction | MoveableOptions;
/** render提供给的接口，id转成el */
export type GetTargetElement = (id: Id) => HTMLElement | null;
/** render提供的接口，通过坐标获得坐标下所有HTML元素数组 */
export type GetElementsFromPoint = (point: Point) => HTMLElement[];
export type GetRenderDocument = () => Document | undefined;
export type DelayedMarkContainer = (event: MouseEvent, exclude: Element[]) => NodeJS.Timeout | undefined;
export type MarkContainerEnd = () => HTMLElement | null;
export type GetRootContainer = () => HTMLDivElement | undefined;

export type UpdateDragEl = (el: TargetElement, target: TargetElement, container: HTMLElement) => void;

export interface StageCoreConfig {
  /** 需要对齐的dom节点的CSS选择器字符串 */
  snapElementQuerySelector?: string;
  /** 放大倍数，默认1倍 */
  zoom?: number;
  canSelect?: CanSelect;
  isContainer?: IsContainer;
  /**
   * 画布上拖动组件时，对已通过 isContainer 命中的候选容器进行二次过滤，
   * 用于实现"某些源不允许拖入某些容器内部"的场景。返回 false 时阻止该容器被高亮命中
   */
  canDropIn?: CanDropIn;
  containerHighlightClassName?: string;
  containerHighlightDuration?: number;
  containerHighlightType?: ContainerHighlightType;
  moveableOptions?: CustomizeMoveableOptions;
  /** runtime 的HTML地址，可以是一个HTTP地址，如果和编辑器不同域，需要设置跨域，也可以是一个相对或绝对路径 */
  runtimeUrl?: string;
  render?: CustomizeRender;
  autoScrollIntoView?: boolean;
  updateDragEl?: UpdateDragEl;
  disabledDragStart?: boolean;
  renderType?: RenderType;
  guidesOptions?: Partial<GuidesOptions>;
  disabledMultiSelect?: boolean;
  /**
   * 始终启用多选模式（无需按住 Ctrl/Meta），默认 false。
   * 当 `disabledMultiSelect` 为 true 时，本配置失效。
   */
  alwaysMultiSelect?: boolean;
  disabledRule?: boolean;
  /**
   * 是否禁用「非点击画布选中组件时，对选中区域做高亮闪烁提示」，默认 false（即默认开启闪烁提示）。
   * 用于从图层树、面包屑等外部选中组件时，帮助用户快速定位组件在画布中的位置。
   */
  disabledFlashTip?: boolean;
}

export interface ActionManagerConfig {
  container: HTMLElement;
  containerHighlightClassName?: string;
  containerHighlightDuration?: number;
  containerHighlightType?: ContainerHighlightType;
  moveableOptions?: CustomizeMoveableOptions;
  disabledDragStart?: boolean;
  disabledMultiSelect?: boolean;
  /**
   * 始终启用多选模式（无需按住 Ctrl/Meta），默认 false。
   * 当 `disabledMultiSelect` 为 true 时，本配置失效。
   */
  alwaysMultiSelect?: boolean;
  canSelect?: CanSelect;
  isContainer?: IsContainer;
  /** 见 StageCoreConfig.canDropIn */
  canDropIn?: CanDropIn;
  getRootContainer: GetRootContainer;
  getRenderDocument: GetRenderDocument;
  updateDragEl?: UpdateDragEl;
  getTargetElement: GetTargetElement;
  getElementsFromPoint: GetElementsFromPoint;
}

export interface MoveableOptionsManagerConfig {
  container: HTMLElement;
  moveableOptions?: MoveableOptions | (() => MoveableOptions);
  getRootContainer: GetRootContainer;
}

// #region CustomizeMoveableOptionsCallbackConfig
export interface CustomizeMoveableOptionsCallbackConfig {
  targetEl: HTMLElement | null;
  targetElId?: string;
  targetEls?: HTMLElement[];
  targetElIds?: string[];
  isMulti: boolean;
  document?: Document;
}
// #endregion CustomizeMoveableOptionsCallbackConfig

export interface StageRenderConfig {
  runtimeUrl?: string;
  zoom: number | undefined;
  renderType?: RenderType;
  customizedRender?: () => Promise<HTMLElement | null | void>;
}

export interface StageMaskConfig {
  core: StageCore;
}

export interface StageDragResizeConfig extends MoveableOptionsManagerConfig {
  dragResizeHelper: DragResizeHelper;
  disabledDragStart?: boolean;
  getRenderDocument: GetRenderDocument;
  markContainerEnd: MarkContainerEnd;
  delayedMarkContainer: DelayedMarkContainer;
}

export interface StageMultiDragResizeConfig extends MoveableOptionsManagerConfig {
  dragResizeHelper: DragResizeHelper;
  getRenderDocument: GetRenderDocument;
  markContainerEnd: MarkContainerEnd;
  delayedMarkContainer: DelayedMarkContainer;
}

export interface DragResizeHelperConfig {
  container: HTMLElement;
  updateDragEl?: UpdateDragEl;
}

export type Rect = {
  width: number;
  height: number;
} & Offset;

export interface Offset {
  left: number;
  top: number;
}

export interface Point {
  clientX: number;
  clientY: number;
}

export interface GuidesEventData {
  type: GuidesType;
  guides: number[];
}

export interface UpdateEventData {
  data: {
    el: HTMLElement;
    style: {
      width?: number;
      height?: number;
      left?: number;
      top?: number;
      transform?: {
        rotate?: string;
        scale?: string;
      };
    };
    ghostEl?: HTMLElement;
  }[];
  parentEl: HTMLElement | null;
}

export interface RemoveEventData {
  data: {
    el: HTMLElement;
  }[];
}

export interface SortEventData {
  src: Id;
  dist: Id;
  root?: MApp;
}

export interface UpdateData {
  config: MNode;
  parent?: MContainer;
  parentId?: Id;
  root: MApp;
}

export interface RemoveData {
  id: Id;
  parentId: Id;
  root: MApp;
}

export interface Runtime {
  getApp?: () => Core | undefined;
  updateRootConfig?: (config: MApp) => void;
  updatePageId?: (id: Id) => void;
  select?: (id: Id) => Promise<HTMLElement> | HTMLElement;
  add?: (data: UpdateData) => void;
  update?: (data: UpdateData) => void;
  sortNode?: (data: SortEventData) => void;
  remove?: (data: RemoveData) => void;
  [key: string]: any;
}

export interface Magic {
  id: string;
  /** 当前页面的根节点变化时调用该方法，编辑器会同步该el和stage的大小，该方法由stage注入到iframe.contentWindow中 */
  onPageElUpdate: (el: HTMLElement) => void;

  onRuntimeReady: (runtime: Runtime) => void;
}

export interface RuntimeWindow extends Window {
  magic: Magic;
}

export interface StageHighlightConfig {
  container: HTMLElement;
  updateDragEl?: UpdateDragEl;
  getRootContainer: GetRootContainer;
}

export interface TargetShadowConfig {
  container: HTMLElement;
  zIndex?: ZIndex;
  updateDragEl?: UpdateDragEl;
  idPrefix?: string;
}

export interface RuleOptions {
  guidesOptions?: Partial<GuidesOptions>;
  disabledRule?: boolean;
}

export interface CoreEvents {
  mounted: [];
  'runtime-ready': [runtime: Runtime];
  'page-el-update': [el: HTMLElement];
  'change-guides': [data: GuidesEventData];
  select: [selectedEl: HTMLElement, event: MouseEvent];
  'multi-select': [selectedElList: HTMLElement[], event: MouseEvent];
  dblclick: [event: MouseEvent];
  update: [data: UpdateEventData];
  sort: [data: SortEventData];
  'select-parent': [];
  rerender: [];
  remove: [data: RemoveEventData];
  highlight: [highlightEl: HTMLElement];
  mousemove: [event: MouseEvent];
  mouseleave: [event: MouseEvent];
  'drag-start': [event: OnDragStart];
}

export interface RenderEvents {
  onload: [];
  'page-el-update': [el: HTMLElement];
  'runtime-ready': [runtime: Runtime];
}

export interface MaskEvents {
  scroll: [event: WheelEvent];
  'change-guides': [
    data: {
      type: GuidesType.HORIZONTAL;
      guides: number[];
    },
  ];
}

export interface ActionManagerEvents {
  dblclick: [event: MouseEvent];
  mousemove: [event: MouseEvent];
  mouseleave: [event: MouseEvent];
  highlight: [el: HTMLElement];
  update: [data: UpdateEventData];
  sort: [data: SortEventData];
  remove: [data: RemoveEventData];
  select: [selectedEl: HTMLElement | null, event: MouseEvent];
  rerender: [];
  'select-parent': [];
  'drag-start': [event: OnDragStart];
  'multi-update': [data: UpdateEventData];
  'change-to-select': [id: Id, event: MouseEvent];
  'before-multi-select': [selectedElList: HTMLElement[]];
  'before-select': [el: HTMLElement, event: MouseEvent];
  'multi-select': [selectedElList: HTMLElement[], event: MouseEvent];
  'get-elements-from-point': [els: HTMLElement[]];
}

export interface DrEvents {
  'update-moveable': [];
  [AbleActionEventType.REMOVE]: [];
  [AbleActionEventType.SELECT_PARENT]: [];
  [AbleActionEventType.RERENDER]: [];
  'drag-start': [event: OnDragStart];
  update: [data: UpdateEventData];
  sort: [data: SortEventData];
}

export interface MultiDrEvents {
  'update-moveable': [];
  'change-to-select': [id: Id, event: MouseEvent];
  update: [data: UpdateEventData];
}
