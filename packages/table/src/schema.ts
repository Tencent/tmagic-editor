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

import { FormConfig, FormValue } from '@tmagic/form';

export type ColumnActionPlacement =
  | 'auto'
  | 'auto-start'
  | 'auto-end'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-start'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-end'
  | 'left-start'
  | 'left-end'
  | 'right-start'
  | 'right-end';

/** 当 type 为 sub-actions 时，更多菜单（Popover）的配置 */
export interface ColumnSubActionConfig {
  /** Popover 的弹出位置，默认 bottom */
  placement?: ColumnActionPlacement;
  /** Popover 浮层宽度，数字按 px 处理 */
  popoverWidth?: string | number;
  /** 附加到 Popover 浮层上的自定义 class */
  popoverClass?: string;
  /** Popover 关闭后是否销毁内容，默认 false */
  popoverDestroyOnClose?: boolean;
  /** 更多菜单中的子动作配置 */
  items?: ColumnActionConfig[];
}

export interface ColumnActionConfig {
  /**
   * 动作类型：
   * - `delete` / `copy` / `edit`：内置语义，`edit` 会进入行内编辑态。
   * - `sub-actions`：点击后以 Popover 形式展开更多菜单，菜单配置通过 `subActionConfig` 提供。
   */
  type?: 'delete' | 'copy' | 'edit' | 'sub-actions' | string;
  buttonType?: string;
  display?: boolean | ((row: any) => boolean);
  disabled?: boolean | ((row: any) => boolean);
  text?: string | ((row: any) => string);
  name?: string;
  tooltip?: string;
  tooltipPlacement?: string;
  icon?: any;
  /** 为 true 时用 Popconfirm 包裹按钮，点击后需二次确认才会触发 handler */
  popconfirm?: boolean;
  /** Popconfirm 的确认提示文案，支持函数动态生成 */
  confirmText?: string | ((row: any) => string);
  /** Popconfirm 浮层宽度，数字按 px 处理 */
  popconfirmWidth?: string | number;
  /** 当 type 为 sub-actions 时，更多菜单（Popover）的配置 */
  subActionConfig?: ColumnSubActionConfig;
  handler?: (row: any, index: number) => Promise<any> | any;
  before?: (row: any, index: number) => Promise<void> | void;
  after?: (row: any, index: number) => Promise<void> | void;
  action?: (data: {
    data: any;
    index: number;
  }) => Promise<{ ret: number; msg?: string } | void> | { ret: number; msg?: string } | void;
  cancel?: (data: { index: number }) => Promise<void> | void;
}

export interface ColumnConfig<T = any> {
  pageIndex?: number;
  pageSize?: number;
  form?: FormConfig;
  rules?: any;
  values?: FormValue;
  selection?: boolean | 'single';
  selectable?: (row: any, index: number) => boolean;
  label?: string;
  fixed?: 'left' | 'right' | boolean;
  width?: number | string;
  actions?: ColumnActionConfig[];
  type?: 'popover' | 'expand' | 'component' | 'index' | string | ((value: any, row: T) => string);
  text?: string;
  prop?: string;
  name?: string;
  showHeader?: boolean;
  table?: ColumnConfig[];
  editInlineFormConfig?: FormConfig;
  formatter?: 'datetime' | ((item: any, row: T, data: { index: number }) => any);
  popover?: {
    placement?:
      | 'auto'
      | 'auto-start'
      | 'auto-end'
      | 'left'
      | 'right'
      | 'top'
      | 'bottom'
      | 'top-start'
      | 'top-end'
      | 'bottom-start'
      | 'bottom-end'
      | 'right-start'
      | 'right-end'
      | 'left-start'
      | 'left-end';
    width?: string | number;
    trigger?: 'hover' | 'click';
    tableEmbed?: boolean;
    destroyOnClose?: boolean;
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
