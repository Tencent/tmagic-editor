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

// 流式布局下拖动时需要clone一个镜像节点，镜像节点的id前缀
export const GHOST_EL_ID_PREFIX = 'ghost_el_';

export const DRAG_EL_ID_PREFIX = 'drag_el_';

// 默认放到缩小倍数
export const DEFAULT_ZOOM = 1;

export enum GuidesType {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
}

export enum ZIndex {
  MASK = '99999',
  SELECTED_EL = '666',
}

export enum MouseButton {
  LEFT = 0,
  MIDDLE = 1,
  RIGHT = 2,
}

export enum Mode {
  ABSOLUTE = 'absolute',
  FIXED = 'fixed',
  SORTABLE = 'sortable',
}

export const SELECTED_CLASS = 'tmagic-stage-selected-area';
