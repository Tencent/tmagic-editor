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

import { FormConfig, FormValue } from '@tmagic/form';

export interface ColumnActionConfig {
  type?: 'delete' | 'copy' | 'edit';
  buttonType?: string;
  display?: (row: any) => boolean;
  text?: string | ((row: any) => string);
  name?: string;
  tooltip?: string;
  tooltipPlacement?: string;
  icon?: any;
  handler?: (row: any, index: number) => Promise<any> | any;
  before?: (row: any, index: number) => Promise<void> | void;
  after?: (row: any, index: number) => Promise<void> | void;
  action?: (data: { data: any }) => Promise<void> | void;
}

export interface ColumnConfig<T = any> {
  form?: FormConfig;
  rules?: any;
  values?: FormValue;
  selection?: boolean | 'single';
  selectable?: (row: any, index: number) => boolean;
  label?: string;
  fixed?: 'left' | 'right' | boolean;
  width?: number | string;
  actions?: ColumnActionConfig[];
  type?: 'popover' | 'expand' | 'component' | string | ((value: any, row: T) => string);
  text?: string;
  prop?: string;
  showHeader?: boolean;
  table?: ColumnConfig[];
  formatter?: 'datetime' | ((item: any, row: T) => any);
  popover?: {
    placement: string;
    width: string;
    trigger: string;
    tableEmbed: boolean;
  };
  sortable?: boolean | 'custom';
  action?: 'tip' | 'actionLink' | 'img' | 'link' | 'tag';
  handler?: (row: T) => void;
  /** 当type为expand时有效，展开为html */
  expandContent?: (row: T, prop?: string) => string;
  /** 当type为expand时，展开为vue组件；当type为component时显示的组件 */
  component?: any;
  /** 当type为expand时，展开的vue组件props；当type为component时显示的组件的props */
  props?: any;
  /** 当type为component时显示的组件的事件监听 */
  listeners?: any;
  /** 当type为tip时有效，显示文案 */
  buttonText?: string;
}
