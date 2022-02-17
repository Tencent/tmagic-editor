import { MoveableOptions } from 'react-moveable/declaration/types';

import { Id, MApp, MNode } from '@tmagic/schema';

import StageCore from './StageCore';

export type CanSelect = (el: HTMLElement, stop: () => boolean) => boolean | Promise<boolean>;

export type StageCoreConfig = {
  /** 需要对齐的dom节点的CSS选择器字符串 */
  snapElementQuerySelector?: string;
  /** 放大倍数，默认1倍 */
  zoom?: number;
  canSelect?: CanSelect;
  moveableOptions?: ((core?: StageCore) => MoveableOptions) | MoveableOptions;
  /** runtime 的HTML地址，可以是一个HTTP地址，如果和编辑器不同域，需要设置跨域，也可以是一个相对或绝对路径 */
  runtimeUrl?: string;
  render?: (renderer: StageCore) => Promise<HTMLElement> | HTMLElement;
};

export interface StageRenderConfig {
  core: StageCore;
}

export interface StageMaskConfig {
  core: StageCore;
}

export interface StageDragResizeConfig {
  core: StageCore;
  container: HTMLElement;
}

export type Rect = {
  width: number;
  height: number;
} & Offset;

export interface Offset {
  left: number;
  top: number;
}

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

export interface UpdateEventData {
  el: HTMLElement;
  ghostEl: HTMLElement;
  style: {
    width: number;
    height: number;
    left?: number;
    top?: number;
  };
}

export interface SortEventData {
  src: Id;
  dist: Id;
  root?: MApp;
}

export interface UpdateData {
  config: MNode;
  root: MApp;
}

export interface RemoveData {
  id: Id;
  root: MApp;
}

export interface Runtime {
  beforeSelect?: (el: HTMLElement) => Promise<boolean> | boolean;
  getSnapElements?: (el: HTMLElement) => HTMLElement[];
  updateRootConfig: (config: MApp) => void;
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

export enum ZIndex {
  MASK = '99999',
  GHOST_EL = '99998',
}

export enum MouseButton {
  LEFT = 0,
  MIDDLE = 1,
  RIGHT = 2,
}
