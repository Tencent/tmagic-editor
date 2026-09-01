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

import { cloneDeep } from 'lodash-es';

import type { GroupListConfig, TableColumnConfig, TableConfig } from '../schema';

/**
 * table / group-list 是同一份配置的两种展示形态，可以互相切换（`TableGroupList.vue`）。
 *
 * 本模块收口两种形态之间的配置派生，以及各形态下「子项配置怎么算出来」的规则，
 * 供渲染（`TableGroupList.vue` / `GroupListItem.vue` / `useTableColumns.ts`）与无渲染校验
 * （`collectValidatableFields`）共用，避免两条链路各写一份而产生偏差。
 */

/** group-list 形态的 type（兼容驼峰与中划线两种写法） */
export const isGroupListType = (type: unknown): boolean => type === 'groupList' || type === 'group-list';

/** 按 label 文案长度估算 label 宽度（中文按 20px、其他按 8px，最小 80px） */
export const calcLabelWidth = (label: string): string => {
  if (!label) return '0px';
  const zhLength = label.match(/[^\x00-\xff]/g)?.length || 0;
  const chLength = label.length - zhLength;
  return `${Math.max(chLength * 8 + zhLength * 20, 80)}px`;
};

/** 由 group-list 形态的配置派生出 table 形态所需的配置；本身已是 table 形态则原样返回 */
export const toTableConfig = (config: TableConfig | GroupListConfig): TableConfig => {
  if (!isGroupListType(config.type)) return config as TableConfig;

  const source = config as GroupListConfig;
  return {
    ...config,
    type: 'table',
    groupItems: source.items,
    items:
      source.tableItems ||
      (source.items as any[]).map((item: any) => ({
        ...item,
        label: item.label || item.text,
        text: null,
      })),
  } as any as TableConfig;
};

/** 由 table 形态的配置派生出 group-list 形态所需的配置；本身已是 group-list 形态则原样返回 */
export const toGroupListConfig = (config: TableConfig | GroupListConfig): GroupListConfig => {
  if (isGroupListType(config.type)) return config as GroupListConfig;

  const source = config as TableConfig;
  return {
    ...config,
    type: 'groupList',
    tableItems: source.items,
    items:
      source.groupItems ||
      (source.items as any[]).map((item: any) => {
        const text = item.text || item.label;
        return {
          ...item,
          text,
          labelWidth: calcLabelWidth(text),
          span: item.span || 12,
        };
      }),
  } as any as GroupListConfig;
};

/**
 * group-list 每一行渲染的 row 容器配置（`GroupListItem.vue` 渲染的 `Container` 的 config）。
 *
 * `keyProp` 由调用方从 `mForm.keyProp` 取，默认 `__key`。
 */
export const getGroupListRowConfig = (config: GroupListConfig, index: number, keyProp?: string) => {
  const key = keyProp || '__key';

  return {
    type: 'row',
    span: config.span || 24,
    items: config.items,
    labelWidth: config.labelWidth,
    labelPosition: config.labelPosition,
    [key]: `${(config as Record<string, any>)[key]}${String(index)}`,
  };
};

/**
 * 列是否会被渲染成一列（`hidden` 列不渲染，`display` 为假的列也不渲染）。
 *
 * `display` 的求值上下文是表格自身的 props，由调用方通过 `evalDisplay` 注入。
 */
export const isTableColumnRendered = (column: TableColumnConfig, evalDisplay: (_display: any) => any): boolean =>
  column.type !== 'hidden' && Boolean(evalDisplay(column.display));

/**
 * 单元格内 `Container` 实际收到的列配置：按行求值 `itemsFunction`，并去掉已在列层面消费过的 `display`。
 */
export const makeTableColumnConfig = (column: TableColumnConfig, row: any): TableColumnConfig => {
  const newConfig = cloneDeep(column);
  if (typeof column.itemsFunction === 'function') {
    newConfig.items = column.itemsFunction(row);
  }
  delete newConfig.display;
  return newConfig;
};
