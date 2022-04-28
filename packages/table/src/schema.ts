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

import { FormConfig, FormValue } from '@tmagic/form';

export interface ColumnActionConfig {
  type?: 'delete' | 'copy' | 'edit';
  display?: (vm: any, row: any) => boolean;
  text: string;
  name: string;
  handler?: (row: any) => Promise<any> | any;
  before?: (row: any) => void;
  after?: (row: any) => void;
  action?: (data: { data: any }) => void;
}

export type ColumnConfig = {
  form?: FormConfig;
  rules?: any;
  values?: FormValue;
  selection?: boolean | 'single';
  selectable?: (row: any, index: number) => boolean;
  label: string;
  fixed?: 'left' | 'right' | boolean;
  width?: number | string;
  actions?: ColumnActionConfig[];
  type: 'popover' | 'expand' | string | ((value: any, row: any) => string);
  text: string;
  prop: string;
  showHeader: boolean;
  table?: ColumnConfig[];
  formatter?: 'datetime' | ((item: any, row: Record<string, any>) => any);
  popover: {
    placement: '';
    width: '';
    trigger: '';
    tableEmbed: '';
  };
  sortable?: boolean | 'custom';
  action?: 'tip' | 'actionLink' | 'img' | 'link' | 'tag';
  handler: (row: any) => void;
};
