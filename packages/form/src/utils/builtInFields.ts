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

import { effect as checkboxGroupEffect } from '../fields/CheckboxGroup/effect';
import { effect as dateEffect } from '../fields/Date/effect';
import { effect as dateTimeEffect } from '../fields/DateTime/effect';
import { effect as displayEffect } from '../fields/Display/effect';
import { effect as dynamicFieldEffect } from '../fields/DynamicField/effect';
import { effect as numberRangeEffect } from '../fields/NumberRange/effect';

import { expandFieldset, expandPanel, expandRow, expandStep, expandTab, expandTableGroupList } from './collectFields';
import { type HeadlessFieldOptions } from './registerField';

/**
 * 内置字段的无渲染登记表（不含 Vue 组件）。
 *
 * 本模块只导出数据，不登记。调用方自行 `registerBuiltInFields(builtInFields)`，
 * 或 `app.use(MagicForm)`（install 里会登记叠上 Vue 组件后的表）。
 */
export const builtInFields: Record<string, HeadlessFieldOptions> = {
  text: {},
  'img-upload': {},
  number: {},
  'number-range': { effect: numberRangeEffect },
  textarea: {},
  hidden: {},
  date: { effect: dateEffect },
  datetime: { effect: dateTimeEffect },
  daterange: {},
  timerange: {},
  time: {},
  checkbox: {},
  switch: {},
  'color-picker': {},
  'checkbox-group': { effect: checkboxGroupEffect },
  'radio-group': {},
  display: { effect: displayEffect },
  link: {},
  select: {},
  cascader: {},
  'dynamic-field': { effect: dynamicFieldEffect },
  // Container 对 `type: 'component'` 直接渲染 `config.component`，没有独立的 m-fields-component
  component: {},
  // `type: 'container'` 不登记为叶子：未登记且带 items 时 dispatch 会按普通容器下钻
  tab: { walk: expandTab },
  row: { walk: expandRow },
  'flex-layout': { walk: expandRow },
  fieldset: { walk: expandFieldset },
  panel: { walk: expandPanel },
  step: { walk: expandStep },
  table: { walk: expandTableGroupList },
  'group-list': { walk: expandTableGroupList },
  'table-group-list': { walk: expandTableGroupList },
};
