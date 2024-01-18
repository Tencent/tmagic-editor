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

import type { GuidesOptions } from '@scena/guides';
import type { MoveableOptions } from 'moveable';

import Core from '@tmagic/core';
import type { Id, MApp, MContainer, MNode } from '@tmagic/schema';

import { GuidesType, ZIndex } from './const';
import DragResizeHelper from './DragResizeHelper';
import StageCore from './StageCore';

export type TargetElement = HTMLElement | SVGElement;

export type CanSelect = (el: HTMLElement, event: MouseEvent, stop: () => boolean) => boolean | Promise<boolean>;
export type IsContainer = (el: HTMLElement) => boolean | Promise<boolean>;
export type CustomizeRender = (renderer: StageCore) => Promise<HTMLElement> | HTMLElement;
/** 业务方自定义的moveableOptions，可以是配置，也可以是回调函数 */
export type CustomizeMoveableOptions =
  | ((config?: CustomizeMoveableOptionsCallbackConfig) => MoveableOptions)
  | MoveableOptions
  | undefined;
/** render提供给的接口，如果是id则转成el，如果是el则直接返回 */
export type GetTargetElement = (idOrEl: Id | HTMLElement) => HTMLElement;
/** render提供的接口，通过坐标获得坐标下所有HTML元素数组 */
export type GetElementsFromPoint = (point: Point) => HTMLElement[];
export type GetRenderDocument = () => Document | undefined;
export type DelayedMarkContainer = (event: MouseEvent, exclude: Element[]) => NodeJS.Timeout | undefined;
export type MarkContainerEnd = () => HTMLElement | null;
export type GetRootContainer = () => HTMLDivElement | undefined;

/** 将组件添加到容器的方式 */
export enum ContainerHighlightType {
  /** 默认方式：组件在容器上方悬停一段时间后加入 */
  DEFAULT = 'default',
  /** 按住alt键，并在容器上方悬停一段时间后加入 */
  ALT = 'alt',
}

export enum RenderType {
  IFRAME = 'iframe',
  NATIVE = 'native',
}

export type UpdateDragEl = (el: TargetElement, target: TargetElement, container: HTMLElement) => void;

export interface StageCoreConfig {
  /** 需要对齐的dom节点的CSS选择器字符串 */
  snapElementQuerySelector?: string;
  /** 放大倍数，默认1倍 */
  zoom?: number;
  canSelect?: CanSelect;
  isContainer?: IsContainer;
  containerHighlightClassName?: string;
  containerHighlightDuration?: number;
  containerHighlightType?: ContainerHighlightType;
  moveableOptions?: CustomizeMoveableOptions;
  /** runtime 的HTML地址，可以是一个HTTP地址，如果和编辑器不同域，需要设置跨域，也可以是一个相对或绝对路径 */
  runtimeUrl?: string;
  render?: (renderer: StageCore) => Promise<HTMLElement> | HTMLElement;
  autoScrollIntoView?: boolean;
  updateDragEl?: UpdateDragEl;
  disabledDragStart?: boolean;
  renderType?: RenderType;
  guidesOptions?: Partial<GuidesOptions>;
  disabledMultiSelect?: boolean;
}

export interface ActionManagerConfig {
  container: HTMLElement;
  containerHighlightClassName?: string;
  containerHighlightDuration?: number;
  containerHighlightType?: ContainerHighlightType;
  moveableOptions?: CustomizeMoveableOptions;
  disabledDragStart?: boolean;
  disabledMultiSelect?: boolean;
  canSelect?: CanSelect;
  isContainer?: IsContainer;
  getRootContainer: GetRootContainer;
  getRenderDocument: GetRenderDocument;
  updateDragEl?: UpdateDragEl;
  getTargetElement: GetTargetElement;
  getElementsFromPoint: GetElementsFromPoint;
}

export interface MoveableOptionsManagerConfig {
  container: HTMLElement;
  moveableOptions?: CustomizeMoveableOptions;
  getRootContainer: GetRootContainer;
}

export interface CustomizeMoveableOptionsCallbackConfig {
  targetEl?: HTMLElement;
  targetElId?: string;
  targetEls?: HTMLElement[];
  targetElIds?: string[];
  isMulti: boolean;
  document?: Document;
}

export interface StageRenderConfig {
  runtimeUrl?: string;
  zoom: number | undefined;
  renderType?: RenderType;
  customizedRender?: () => Promise<HTMLElement | null>;
}

export interface StageMaskConfig {
  core: StageCore;
}

export interface StageDragResizeConfig {
  container: HTMLElement;
  dragResizeHelper: DragResizeHelper;
  moveableOptions?: CustomizeMoveableOptions;
  disabledDragStart?: boolean;
  getRootContainer: GetRootContainer;
  getRenderDocument: GetRenderDocument;
  markContainerEnd: MarkContainerEnd;
  delayedMarkContainer: DelayedMarkContainer;
}

export interface StageMultiDragResizeConfig {
  container: HTMLElement;
  dragResizeHelper: DragResizeHelper;
  moveableOptions?: CustomizeMoveableOptions;
  getRootContainer: GetRootContainer;
  getRenderDocument: GetRenderDocument;
  markContainerEnd: MarkContainerEnd;
  delayedMarkContainer: DelayedMarkContainer;
}

export interface DragResizeHelperConfig {
  container: HTMLElement;
  updateDragEl?: UpdateDragEl;
}

/** 选择状态 */
export enum SelectStatus {
  /** 单选 */
  SELECT = 'select',
  /** 多选 */
  MULTI_SELECT = 'multiSelect',
}

/** 拖动状态 */
export enum StageDragStatus {
  /** 开始拖动 */
  START = 'start',
  /** 拖动中 */
  ING = 'ing',
  /** 拖动结束 */
  END = 'end',
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
  beforeSelect?: (el: HTMLElement) => Promise<boolean> | boolean;
  updateRootConfig?: (config: MApp) => void;
  updatePageId?: (id: Id) => void;
  select?: (id: Id) => Promise<HTMLElement> | HTMLElement;
  add?: (data: UpdateData) => void;
  update?: (data: UpdateData) => void;
  sortNode?: (data: SortEventData) => void;
  remove?: (data: RemoveData) => void;
}

export interface Magic {
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
}
