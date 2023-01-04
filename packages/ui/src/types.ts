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

import { ComponentPublicInstance } from 'vue';

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

/* component */
export interface MComponent {
  type: string;
  id?: number | string;
  name?: string;
  style?: StyleCfg;
  disabledStyle?: StyleCfg;
  className?: string | ((p1: any, p2: any) => string);
  display?: boolean | ((p1: any, p2: any) => boolean);
  html?: string;
  created?: (p1: any, p2: any) => Promise<any>;
  mounted?: (p1: any, p2: any) => Promise<any>;
  renderType?: number;
  events?: MEvent[];
}
export interface MComponentProps {
  config: MComponent;
  model: Object;
}
export type MComponentInstance =
  | ComponentPublicInstance<
      MComponentProps,
      {},
      {
        [propName: string]: any;
        disabled: boolean;
      }
    >
  | null
  | undefined;

/* container */
export interface MContainer extends MComponent {
  items?: MComponent[] | MContainer[];
}
export interface MContainerProps {
  config: MContainer;
  model: Object;
}
export type MContainerInstance =
  | ComponentPublicInstance<
      MContainerProps,
      {},
      {
        [propName: string]: any;
      }
    >
  | null
  | undefined;

/* page */
export interface MPage extends MContainer {
  title?: string;
  cssFile?: string;
}
export interface MPageProps {
  config: MPage;
}
export type MPageInstance =
  | ComponentPublicInstance<
      MPageProps,
      {},
      {
        [propName: string]: any;
      }
    >
  | null
  | undefined;

/* pop */
export interface MPop extends MContainer {
  activate: () => void;
  maskClose: boolean;
}
export interface MPopProps {
  config: MPop;
  model: Object;
  fillWithSlot: boolean;
  beforeOpen: (p1: MPopInstance, p2: any) => boolean;
  beforeClose: (p1: MPopInstance) => boolean;
}
export interface MPopObj {
  name: string;
  options: object;
}
export type MPopInstance =
  | ComponentPublicInstance<
      MPopProps,
      {},
      {
        [propName: string]: any;
      }
    >
  | null
  | undefined;

/* app */
export interface MApp extends MComponent {
  items: MPage[];
}
export interface MAppProps {
  config: [MApp];
  pageConfig: MPage;
}
export enum MAppElementType {
  pages = 'pages',
  containers = 'containers',
  components = 'components',
  pops = 'pops',
}
export type MAppInstance =
  | ComponentPublicInstance<
      MAppProps,
      {},
      {
        [propName: string]: any;
      }
    >
  | null
  | undefined;
export type MCommonInstance = MContainerInstance | MPageInstance | MComponentInstance | MPopInstance;

/* tabs */
export type MTabs = MContainer;
export interface MTabsProps {
  config: MTabs;
  model: Object;
}
export type MTabsInstance =
  | ComponentPublicInstance<
      MTabsProps,
      {},
      {
        [propName: string]: any;
      }
    >
  | null
  | undefined;

/* text */
export interface MText extends MComponent {
  text?: string | ((p1: any, p2: any) => string);
  disabledText?: string | ((p1: any, p2: any) => string);
  multiple?: boolean;
}
export interface MTextProps {
  config: MText;
  model: Object;
  vars: Object;
}
export type MTextInstance =
  | ComponentPublicInstance<
      MTextProps,
      {},
      {
        [propName: string]: any;
      }
    >
  | null
  | undefined;

/* button */
export interface MButton extends MComponent {
  preAction?: (p1: any, p2: any) => string;
  postAction?: (p1: any, p2: any) => string;
  text?: string | ((p1: any, p2: any) => string);
  disabledText?: string | ((p1: any, p2: any) => string);
}
export interface MButtonProps {
  config: MButton;
  model: Object;
}
export type MButtonInstance =
  | ComponentPublicInstance<
      MButtonProps,
      {},
      {
        [propName: string]: any;
      }
    >
  | null
  | undefined;

export type ArrayOneOrMore = { 0: string } & string[];

export interface MImg {
  src: string;
  url: string;
}

export interface MQrcode {
  url: string;
}

export interface MPop extends MComponent {
  items?: MComponent[] | MContainer[];
  closeButtonStyle?: any;
  closeButton?: boolean;
}
