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

/* style */
export type PartCSSStyle = {
  [key in keyof CSSStyleDeclaration]?: string | number;
};
export type CSSStyleKey = keyof CSSStyleDeclaration;
export type CanModifyCSSStyleKey = Exclude<CSSStyleKey, 'length' | 'parentRule'>;
export type StyleCfg = ((p1: any, p2: any) => PartCSSStyle) | PartCSSStyle;

/* event */
export interface MEvent {
  name: string;
  to: number | string;
  method: string;
}
export interface MEventInMap {
  from: number | string;
  to: number | string;
  method: string;
}
export type MEventMapType = Record<string, MEventInMap[]>;
export type MEventQueueMapType = Record<string | number, MEventInMap[]>;
export interface MEventBus {
  $on: (...args: any) => void;
  $off: (...args: any) => void;
  $once: (...args: any) => void;
  $emit: (...args: any) => void;
}
