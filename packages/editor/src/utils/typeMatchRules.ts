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

import type { DataSourceFieldType, DataSourceSchema, Id } from '@tmagic/core';
import { HookCodeType, HookType, NodeType } from '@tmagic/core';
import type { TypeMatchValidateContext, TypeMatchValidator } from '@tmagic/form';
import {
  DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX,
  DATA_SOURCE_SET_DATA_METHOD_NAME,
  dataSourceTemplateRegExp,
  getKeysArray,
  removeDataSourceFieldPrefix,
} from '@tmagic/utils';

import codeBlockService from '@editor/services/codeBlock';
import dataSourceService from '@editor/services/dataSource';
import editorService from '@editor/services/editor';
import { getFieldType, resolveFieldByPath } from '@editor/utils/data-source';
import {
  arrayOptions,
  booleanOptions,
  eqOptions,
  getCondOpOptionsByFieldType,
  numberOptions,
} from '@editor/utils/props';

const defaultMessage = (message: string | undefined, fallback: string) => message || fallback;

const isPlainObject = (value: any): value is Record<string, any> =>
  Object.prototype.toString.call(value) === '[object Object]';

const isId = (value: any): value is Id => typeof value === 'string' || typeof value === 'number';

const DATA_SOURCE_FIELD_TYPES = new Set<DataSourceFieldType>([
  'null',
  'boolean',
  'object',
  'array',
  'number',
  'string',
  'any',
]);

export const ALL_COND_OPS = new Set<string>([
  ...arrayOptions.map((item) => item.value),
  ...eqOptions.map((item) => item.value),
  ...numberOptions.map((item) => item.value),
  ...booleanOptions.map((item) => item.value),
]);

const getCondOpsByFieldType = (type: string): Set<string> =>
  new Set(getCondOpOptionsByFieldType(type).map((item) => item.value));

const getDataSources = (): DataSourceSchema[] => dataSourceService.get('dataSources') || [];

const findDataSource = (id: string): DataSourceSchema | undefined =>
  getDataSources().find((ds) => `${ds.id}` === `${id}`);

const getMethodNamesForDataSource = (ds: DataSourceSchema): Set<string> => {
  const names = new Set<string>([DATA_SOURCE_SET_DATA_METHOD_NAME]);
  (dataSourceService.getFormMethod(ds.type) || []).forEach((item) => {
    if (item?.value) names.add(item.value);
  });
  (ds.methods || []).forEach((method) => {
    if (method?.name) names.add(method.name);
  });
  return names;
};

const validateDataSourceFieldPath = (
  path: string[],
  options: {
    dataSourceId?: string;
    valueMode?: 'key' | 'value';
    dataSourceFieldType?: DataSourceFieldType[];
    message?: string;
  } = {},
): string | undefined => {
  const dataSources = getDataSources();
  if (!dataSources.length) {
    return undefined;
  }

  let dsId = options.dataSourceId;
  let fieldNames = path;

  if (!dsId) {
    if (!path.length) {
      return defaultMessage(options.message, '值不在可选项中');
    }
    const rawDsId = path[0];
    dsId =
      options.valueMode === 'key' || !`${rawDsId}`.startsWith(DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX)
        ? `${rawDsId}`
        : removeDataSourceFieldPrefix(`${rawDsId}`);
    fieldNames = path.slice(1);
  }

  const ds = findDataSource(`${dsId}`);
  if (!ds) {
    return defaultMessage(options.message, '值不在可选项中');
  }

  if (!fieldNames.length) {
    return undefined;
  }

  const { field, ok } = resolveFieldByPath(ds.fields, fieldNames);
  if (!ok) {
    return defaultMessage(options.message, '值不在可选项中');
  }

  const allowedTypes = options.dataSourceFieldType || ['any'];
  if (!allowedTypes.length || allowedTypes.includes('any')) {
    return undefined;
  }

  const leafType = field?.type || 'any';
  if (leafType === 'any' || allowedTypes.includes(leafType)) {
    return undefined;
  }

  return defaultMessage(options.message, '值不在可选项中');
};

const validateDataSourceMethodTuple = (value: any, message?: string): string | undefined => {
  if (!Array.isArray(value) || value.length !== 2 || value.some((item) => typeof item !== 'string')) {
    return defaultMessage(message, `${value}类型应为长度为 2 的字符串数组`);
  }

  const dataSources = getDataSources();
  if (!dataSources.length) {
    return undefined;
  }

  const [dsId, methodName] = value;
  const ds = findDataSource(dsId);
  if (!ds) {
    return defaultMessage(message, `数据源(${dsId})不存在`);
  }

  if (!getMethodNamesForDataSource(ds).has(methodName)) {
    return defaultMessage(message, `数据源方法(${methodName})不存在`);
  }

  return undefined;
};

const validateDataSourceTemplateBindings = (value: string, message?: string): string | undefined => {
  const dataSources = getDataSources();
  if (!dataSources.length) {
    return undefined;
  }

  const matches = value.matchAll(dataSourceTemplateRegExp);
  for (const match of matches) {
    const keys = getKeysArray(match[1]);
    if (!keys.length) {
      return defaultMessage(message, `数据源绑定(${value})不合法`);
    }

    const [dsId, ...fieldNames] = keys;
    const ds = findDataSource(`${dsId}`);
    if (!ds) {
      return defaultMessage(message, `数据源绑定(${value})不合法`);
    }

    const { ok } = resolveFieldByPath(ds.fields, fieldNames, { skipNumberIndices: true });
    if (!ok) {
      return defaultMessage(message, `数据源绑定(${value})不合法`);
    }
  }

  return undefined;
};

const validateDataSourceFieldsItem = (item: any, message?: string): string | undefined => {
  if (!isPlainObject(item) || typeof item.name !== 'string') {
    return defaultMessage(message, '字段项结构不合法');
  }

  if (typeof item.type !== 'undefined' && !DATA_SOURCE_FIELD_TYPES.has(item.type)) {
    return defaultMessage(message, '字段类型不合法');
  }

  if (typeof item.fields !== 'undefined') {
    if (!Array.isArray(item.fields)) {
      return defaultMessage(message, '字段项结构不合法');
    }
    for (const child of item.fields) {
      const error = validateDataSourceFieldsItem(child, message);
      if (error) return error;
    }
  }

  return undefined;
};

const validateKeyValue: TypeMatchValidator = (value, { message, props }) => {
  if (props.config?.advanced && typeof value === 'function') {
    return undefined;
  }
  if (!isPlainObject(value)) {
    return defaultMessage(message, '值类型应为对象');
  }
  return undefined;
};

const validateStyleSetter: TypeMatchValidator = (value, { message }) => {
  if (!isPlainObject(value)) {
    return defaultMessage(message, '值类型应为对象');
  }
  return undefined;
};

const validateCondOpSelect: TypeMatchValidator = (value, { message, props }) => {
  if (typeof value !== 'string') {
    return defaultMessage(message, '值类型应为字符串');
  }

  const parentFields = props.config?.parentFields || [];
  const fieldPath = Array.isArray(props.model?.field) ? props.model.field : [];
  const [id, ...fieldNames] = [...parentFields, ...fieldPath];
  const ds = id ? findDataSource(`${id}`) : undefined;
  const fieldType = getFieldType(ds, fieldNames);
  const allowed = getCondOpsByFieldType(fieldType);

  if (!allowed.has(value)) {
    return defaultMessage(message, `${value} 不在可选项中`);
  }
  return undefined;
};

const validateCodeSelectCol: TypeMatchValidator = (value, { message }) => {
  if (typeof value !== 'string') {
    return defaultMessage(message, `${value}类型应为字符串`);
  }

  const codeDsl = codeBlockService.getCodeDsl();
  if (!codeDsl || !Object.keys(codeDsl).length) {
    return undefined;
  }

  if (!(value in codeDsl)) {
    return defaultMessage(message, `代码块(${value})不存在`);
  }
  return undefined;
};

const validatePageFragmentSelect: TypeMatchValidator = (value, { message }) => {
  if (!isId(value)) {
    return defaultMessage(message, `${value}类型应为字符串或数字`);
  }

  const items = editorService.get('root')?.items;
  if (!items?.length) {
    return undefined;
  }

  const exists = items.some((item) => item.type === NodeType.PAGE_FRAGMENT && `${item.id}` === `${value}`);
  if (!exists) {
    return defaultMessage(message, `页面片段(${value})不存在`);
  }
  return undefined;
};

const validateUiSelect: TypeMatchValidator = (value, { message }) => {
  if (!isId(value)) {
    return defaultMessage(message, `${value}类型应为字符串或数字`);
  }

  const root = editorService.get('root');
  if (!root) {
    return undefined;
  }

  if (!editorService.getNodeById(value)) {
    return defaultMessage(message, `组件(${value})不存在`);
  }
  return undefined;
};

const validateDataSourceInput: TypeMatchValidator = (value, { message }) => {
  if (typeof value !== 'string') {
    return defaultMessage(message, `${value}类型应为字符串`);
  }
  return validateDataSourceTemplateBindings(value, message);
};

const validateDataSourceMethodSelect: TypeMatchValidator = (value, { message }) =>
  validateDataSourceMethodTuple(value, message);

const isDataSourceFieldPathValue = (value: any, config: any): value is string[] => {
  if (!Array.isArray(value) || !value.length || value.some((item) => typeof item !== 'string')) {
    return false;
  }
  if (config.dataSourceId) {
    return true;
  }
  if (config.value === 'key') {
    return true;
  }
  return `${value[0]}`.startsWith(DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX);
};

const validateDataSourceFieldSelect: TypeMatchValidator = (value, { message, props }) => {
  const config = props.config || {};

  if (config.fieldConfig && !isDataSourceFieldPathValue(value, config)) {
    return undefined;
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    return defaultMessage(message, `${value}类型应为字符串数组`);
  }

  return validateDataSourceFieldPath(value, {
    dataSourceId: config.dataSourceId,
    valueMode: config.value,
    dataSourceFieldType: config.dataSourceFieldType,
    message,
  });
};

const validateDataSourceSelect: TypeMatchValidator = (value, { message, props }) => {
  const config = props.config || {};
  const dataSources = getDataSources();
  const filtered = config.dataSourceType ? dataSources.filter((ds) => ds.type === config.dataSourceType) : dataSources;

  if (config.value === 'id') {
    if (typeof value !== 'string') {
      return defaultMessage(message, `${value}类型应为字符串`);
    }
    if (!filtered.length) {
      return undefined;
    }
    if (!filtered.some((ds) => `${ds.id}` === `${value}`)) {
      return defaultMessage(message, `${value}不在可选项中`);
    }
    return undefined;
  }

  if (!isPlainObject(value) || value.isBindDataSource !== true || typeof value.dataSourceId === 'undefined') {
    return defaultMessage(message, `${value}类型不合法`);
  }

  if (!filtered.length) {
    return undefined;
  }

  const ds = filtered.find((item) => `${item.id}` === `${value.dataSourceId}`);
  if (!ds) {
    return defaultMessage(message, `${value}不在可选项中`);
  }

  if (typeof value.dataSourceType !== 'undefined' && value.dataSourceType !== ds.type) {
    return defaultMessage(message, `${value}不在可选项中`);
  }

  return undefined;
};

const validateCodeSelect: TypeMatchValidator = (value, { message }) => {
  if (!isPlainObject(value) || value.hookType !== HookType.CODE || !Array.isArray(value.hookData)) {
    return defaultMessage(message, `${value}类型不合法`);
  }

  // 「codeId 是否存在 / 数据源方法是否存在」由 CodeSelect 内部 code-select-col、
  // data-source-method-select 单元格各自的 typeMatch 校验，只标红出错单元格。此处仅做结构校验。
  for (const item of value.hookData) {
    if (!isPlainObject(item)) {
      return defaultMessage(message, '钩子项结构不合法');
    }

    if (item.codeType !== HookCodeType.CODE && item.codeType !== HookCodeType.DATA_SOURCE_METHOD) {
      return defaultMessage(message, '钩子项结构不合法');
    }

    if (typeof item.params !== 'undefined' && !isPlainObject(item.params)) {
      return defaultMessage(message, '钩子项结构不合法');
    }

    if (item.codeType === HookCodeType.CODE) {
      if (typeof item.codeId !== 'string') {
        return defaultMessage(message, '钩子项结构不合法');
      }
      continue;
    }

    // DATA_SOURCE_METHOD：仅校验元组形态，存在性交给单元格
    if (
      !Array.isArray(item.codeId) ||
      item.codeId.length !== 2 ||
      item.codeId.some((part: any) => typeof part !== 'string')
    ) {
      return defaultMessage(message, '钩子项结构不合法');
    }
  }

  return undefined;
};

const validateDataSourceFields: TypeMatchValidator = (value, { message }) => {
  if (!Array.isArray(value)) {
    return defaultMessage(message, `${value}类型应为数组`);
  }
  for (const item of value) {
    const error = validateDataSourceFieldsItem(item, message);
    if (error) return error;
  }
  return undefined;
};

const validateDataSourceMocks: TypeMatchValidator = (value, { message }) => {
  if (!Array.isArray(value)) {
    return defaultMessage(message, `${value}类型应为数组`);
  }

  for (const item of value) {
    if (
      !isPlainObject(item) ||
      typeof item.title !== 'string' ||
      typeof item.enable !== 'boolean' ||
      typeof item.useInEditor !== 'boolean' ||
      !isPlainObject(item.data)
    ) {
      return defaultMessage(message, 'mock 项结构不合法');
    }
  }

  return undefined;
};

const validateDataSourceMethods: TypeMatchValidator = (value, { message }) => {
  if (!Array.isArray(value)) {
    return defaultMessage(message, `${value}类型应为数组`);
  }

  for (const item of value) {
    if (!isPlainObject(item) || typeof item.name !== 'string') {
      return defaultMessage(message, '方法项结构不合法');
    }
    if (typeof item.content !== 'undefined' && typeof item.content !== 'string' && typeof item.content !== 'function') {
      return defaultMessage(message, '方法项结构不合法');
    }
    if (typeof item.params !== 'undefined' && !Array.isArray(item.params)) {
      return defaultMessage(message, '方法项结构不合法');
    }
  }

  return undefined;
};

const validateEventSelect: TypeMatchValidator = (value, { message }) => {
  if (!Array.isArray(value)) {
    return defaultMessage(message, `${value}类型应为数组`);
  }

  // 「事件名 / 动作名是否在可选项中」由 EventSelect 的 eventNameConfig.rules、compActionConfig.rules 单独校验，
  // 以便只标红对应 select，而不是整张联动卡片。此处仅做结构校验。
  for (const item of value) {
    if (!isPlainObject(item) || typeof item.name !== 'string') {
      return defaultMessage(message, '事件项结构不合法');
    }

    if (Array.isArray(item.actions)) {
      for (const action of item.actions) {
        if (!isPlainObject(action) || typeof action.actionType === 'undefined') {
          return defaultMessage(message, '事件项结构不合法');
        }
      }
      continue;
    }

    if (typeof item.to === 'undefined' || typeof item.method !== 'string') {
      return defaultMessage(message, '事件项结构不合法');
    }
  }

  return undefined;
};

const validateDisplayConds: TypeMatchValidator = (value, { message }) => {
  if (!Array.isArray(value)) {
    return defaultMessage(message, `${value}类型应为数组`);
  }

  // 「op 是否为合法算子 / 字段路径是否存在」由 DisplayConds 内部 cond-op-select、
  // field 单元格（data-source-field-select / cascader）各自的 typeMatch 校验，只标红出错单元格。
  // 此处仅做结构校验。
  for (const item of value) {
    if (!isPlainObject(item) || !Array.isArray(item.cond)) {
      return defaultMessage(message, '显示条件结构不合法');
    }

    for (const cond of item.cond) {
      if (
        !isPlainObject(cond) ||
        !Array.isArray(cond.field) ||
        cond.field.some((part: any) => typeof part !== 'string') ||
        typeof cond.op !== 'string'
      ) {
        return defaultMessage(message, '显示条件结构不合法');
      }
    }
  }

  return undefined;
};

export const editorTypeMatchRules: Record<string, TypeMatchValidator> = {
  'key-value': validateKeyValue,
  'style-setter': validateStyleSetter,
  'cond-op-select': validateCondOpSelect,
  'code-select-col': validateCodeSelectCol,
  'page-fragment-select': validatePageFragmentSelect,
  'ui-select': validateUiSelect,
  'data-source-input': validateDataSourceInput,
  'data-source-method-select': validateDataSourceMethodSelect,
  'data-source-field-select': validateDataSourceFieldSelect,
  'data-source-select': validateDataSourceSelect,
  'code-select': validateCodeSelect,
  'data-source-fields': validateDataSourceFields,
  'data-source-mocks': validateDataSourceMocks,
  'data-source-methods': validateDataSourceMethods,
  'event-select': validateEventSelect,
  'display-conds': validateDisplayConds,
};

export type { TypeMatchValidateContext };
