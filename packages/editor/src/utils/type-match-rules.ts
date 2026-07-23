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
import { NodeType } from '@tmagic/core';
import { appendValidateSuggestion } from '@tmagic/design';
import type { TypeMatchValidateContext, TypeMatchValidator } from '@tmagic/form';
import { validateTypeMatch } from '@tmagic/form';
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

/**
 * 将值格式化为可读的参考示例字符串。
 */
const stringifyExampleValue = (value: any): string => {
  if (typeof value === 'string') return `"${value}"`;
  if (value === null || value === undefined) return String(value);
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

// 参考建议中最多展示的可选值个数，超出以「等」省略。
const MAX_SUGGESTION_OPTIONS = 20;

/**
 * 生成「请使用以下某一个值：xxx；xxx」形式的参考建议；无可选值时返回空字符串（不追加建议）。
 */
const listSuggestion = (values: any[]): string => {
  const list = values.filter((item) => typeof item !== 'undefined' && item !== null && item !== '');
  if (!list.length) return '';
  const shown = list.slice(0, MAX_SUGGESTION_OPTIONS).map(stringifyExampleValue);
  const suffix = list.length > MAX_SUGGESTION_OPTIONS ? ' 等' : '';
  return `请使用以下某一个值：${shown.join('；')}${suffix}`;
};

/**
 * 列出当前可用数据源 id 的参考建议。
 */
const dataSourceIdSuggestion = (): string => listSuggestion(getDataSources().map((ds) => `${ds.id}`));

// 各类型 / 结构的参考示例值
const SUGGESTION_STRING = '请参考以下示例值："文本内容"';
const SUGGESTION_STRING_OR_NUMBER = '请参考以下示例值："文本内容" 或 123';
const SUGGESTION_OBJECT = '请参考以下示例值：{ "key": "value" }';
const SUGGESTION_ARRAY = '请参考以下示例值：[]';
const SUGGESTION_STRING_ARRAY = '请参考以下示例值：["字段1", "字段2"]';
const SUGGESTION_METHOD_TUPLE = '请参考以下示例值：["数据源ID", "方法名"]';
const SUGGESTION_DS_BINDING = '请参考以下示例值："${数据源ID.字段名}"';
const SUGGESTION_DS_BIND_OBJECT = '请参考以下示例值：{ "isBindDataSource": true, "dataSourceId": "数据源ID" }';
const SUGGESTION_UI_ID = '请参考以下示例值：画布中已存在组件的 id';
const SUGGESTION_FIELD_ITEM = '请参考以下示例值：{ "name": "字段名", "type": "string" }';
const SUGGESTION_CODE_SELECT = '请参考以下示例值：{ "hookData": [{ "codeId": "代码块ID", "params": {} }] }';
const SUGGESTION_HOOK_ITEM = '请参考以下示例值：{ "codeId": "代码块ID", "params": {} }';
const SUGGESTION_MOCK_ITEM =
  '请参考以下示例值：{ "title": "mock 名称", "enable": true, "useInEditor": false, "data": {} }';
const SUGGESTION_METHOD_ITEM = '请参考以下示例值：{ "name": "方法名", "content": "() => {}" }';
const SUGGESTION_EVENT_ITEM = '请参考以下示例值：{ "name": "事件名", "actions": [] }';
const SUGGESTION_DISPLAY_COND = '请参考以下示例值：[{ "cond": [{ "field": ["数据源ID", "字段名"], "op": "==" }] }]';

/**
 * 返回最终错误文案。
 *
 * - 传入了自定义 `message` 时，直接使用自定义文案（不追加建议）；
 * - 否则使用默认文案 `fallback`，并在其后拼接「参考建议」。
 *   参考建议给出一个可参考的示例值（如可选项列表、示例数据），仅用于错误汇总展示；
 *   form-item 行内错误不展示建议（由 @tmagic/design FormItem 在渲染时截断建议）。
 *   主文案与建议的拼接/截断统一复用 @tmagic/design 的 `appendValidateSuggestion`。
 */
const defaultMessage = (message: string | undefined, fallback: string, suggestion?: string) => {
  if (message) return message;
  return appendValidateSuggestion(fallback, suggestion);
};

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

/**
 * 递归收集画布中真实存在的组件 id。
 */
const collectNodeIds = (limit = MAX_SUGGESTION_OPTIONS): Id[] => {
  const ids: Id[] = [];
  const walk = (nodes?: any[]): boolean => {
    for (const node of nodes || []) {
      if (typeof node?.id !== 'undefined') {
        ids.push(node.id);
        if (ids.length >= limit) return true;
      }
      if (Array.isArray(node?.items) && walk(node.items)) return true;
    }
    return false;
  };
  walk(editorService.get('root')?.items);
  return ids;
};

/**
 * 取数据源的第一个字段名，用于拼接真实的字段路径示例。
 */
const firstDataSourceFieldName = (ds?: DataSourceSchema): string | undefined =>
  (ds?.fields || []).find((item) => typeof item?.name === 'string')?.name;

/**
 * 列出画布中真实存在的组件 id 作为参考建议；无组件时回退到通用示例。
 */
const uiIdSuggestion = (): string => listSuggestion(collectNodeIds().map((id) => `${id}`)) || SUGGESTION_UI_ID;

/**
 * 用真实数据源 id、字段名拼接数据源绑定表达式示例；无数据源时回退到通用示例。
 */
const dataSourceBindingSuggestion = (): string => {
  const ds = getDataSources()[0];
  if (!ds) return SUGGESTION_DS_BINDING;
  const field = firstDataSourceFieldName(ds);
  const path = field ? `${ds.id}.${field}` : `${ds.id}`;
  return `请参考以下示例值："\${${path}}"`;
};

/**
 * 用真实数据源 id 拼接数据源绑定对象示例；无数据源时回退到通用示例。
 */
const dataSourceBindObjectSuggestion = (dataSources: DataSourceSchema[] = getDataSources()): string => {
  const ds = dataSources[0];
  if (!ds) return SUGGESTION_DS_BIND_OBJECT;
  return `请参考以下示例值：${stringifyExampleValue({ isBindDataSource: true, dataSourceId: `${ds.id}` })}`;
};

/**
 * 用真实数据源 id、字段名拼接字段路径数组示例；无数据源时回退到通用示例。
 */
const dataSourceFieldPathSuggestion = (): string => {
  const ds = getDataSources()[0];
  if (!ds) return SUGGESTION_STRING_ARRAY;
  const field = firstDataSourceFieldName(ds);
  return `请参考以下示例值：${stringifyExampleValue(field ? [`${ds.id}`, field] : [`${ds.id}`])}`;
};

/**
 * 用真实数据源 id、方法名拼接方法元组示例；无数据源时回退到通用示例。
 */
const methodTupleSuggestion = (): string => {
  const ds = getDataSources()[0];
  if (!ds) return SUGGESTION_METHOD_TUPLE;
  const [methodName] = [...getMethodNamesForDataSource(ds)];
  return `请参考以下示例值：${stringifyExampleValue([`${ds.id}`, methodName])}`;
};

/**
 * 用真实数据源 id、字段名拼接显示条件结构示例；无数据源时回退到通用示例。
 */
const displayCondSuggestion = (): string => {
  const ds = getDataSources()[0];
  if (!ds) return SUGGESTION_DISPLAY_COND;
  const field = firstDataSourceFieldName(ds);
  const fieldPath = field ? [`${ds.id}`, field] : [`${ds.id}`];
  return `请参考以下示例值：${stringifyExampleValue([{ cond: [{ field: fieldPath, op: '==' }] }])}`;
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
      return defaultMessage(options.message, '值不在可选项中', dataSourceIdSuggestion());
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
    return defaultMessage(options.message, `数据源(${dsId})不存在`, dataSourceIdSuggestion());
  }

  if (!fieldNames.length) {
    return undefined;
  }

  const { field, ok, fields, failedName } = resolveFieldByPath(ds.fields, fieldNames);
  if (!ok) {
    return defaultMessage(
      options.message,
      `数据源字段(${failedName})不存在`,
      listSuggestion(fields.map((item) => item.name)),
    );
  }

  const allowedTypes = options.dataSourceFieldType || ['any'];
  if (!allowedTypes.length || allowedTypes.includes('any')) {
    return undefined;
  }

  const leafType = field?.type || 'any';
  if (leafType === 'any' || allowedTypes.includes(leafType)) {
    return undefined;
  }

  return defaultMessage(options.message, '值不在可选项中', dataSourceIdSuggestion());
};

const validateDataSourceMethodTuple = (value: any, message?: string): string | undefined => {
  if (!Array.isArray(value) || value.length !== 2 || value.some((item) => typeof item !== 'string')) {
    return defaultMessage(message, `${value}类型应为长度为 2 的字符串数组`, methodTupleSuggestion());
  }

  const dataSources = getDataSources();
  if (!dataSources.length) {
    return undefined;
  }

  const [dsId, methodName] = value;
  const ds = findDataSource(dsId);
  if (!ds) {
    return defaultMessage(message, `数据源(${dsId})不存在`, dataSourceIdSuggestion());
  }

  if (!getMethodNamesForDataSource(ds).has(methodName)) {
    return defaultMessage(
      message,
      `数据源方法(${methodName})不存在`,
      listSuggestion([...getMethodNamesForDataSource(ds)]),
    );
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
      return defaultMessage(message, `数据源绑定(${value})不合法`, dataSourceBindingSuggestion());
    }

    const [dsId, ...fieldNames] = keys;
    const ds = findDataSource(`${dsId}`);
    if (!ds) {
      return defaultMessage(message, `数据源绑定(${value})不合法`, dataSourceBindingSuggestion());
    }

    const { ok } = resolveFieldByPath(ds.fields, fieldNames, { skipNumberIndices: true });
    if (!ok) {
      return defaultMessage(message, `数据源绑定(${value})不合法`, dataSourceBindingSuggestion());
    }
  }

  return undefined;
};

const validateDataSourceFieldsItem = (item: any, message?: string): string | undefined => {
  if (!isPlainObject(item) || typeof item.name !== 'string') {
    return defaultMessage(message, '字段项结构不合法', SUGGESTION_FIELD_ITEM);
  }

  if (typeof item.type !== 'undefined' && !DATA_SOURCE_FIELD_TYPES.has(item.type)) {
    return defaultMessage(message, '字段类型不合法', listSuggestion([...DATA_SOURCE_FIELD_TYPES]));
  }

  if (typeof item.fields !== 'undefined') {
    if (!Array.isArray(item.fields)) {
      return defaultMessage(message, '字段项结构不合法', SUGGESTION_FIELD_ITEM);
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
    return defaultMessage(message, '值类型应为对象', SUGGESTION_OBJECT);
  }
  return undefined;
};

const validateStyleSetter: TypeMatchValidator = (value, { message }) => {
  if (!isPlainObject(value)) {
    return defaultMessage(message, '值类型应为对象', SUGGESTION_OBJECT);
  }
  return undefined;
};

const validateCondOpSelect: TypeMatchValidator = (value, { message, props }) => {
  if (typeof value !== 'string') {
    return defaultMessage(message, '值类型应为字符串', SUGGESTION_STRING);
  }

  const parentFields = props.config?.parentFields || [];
  const fieldPath = Array.isArray(props.model?.field) ? props.model.field : [];
  const [id, ...fieldNames] = [...parentFields, ...fieldPath];
  const ds = id ? findDataSource(`${id}`) : undefined;
  const fieldType = getFieldType(ds, fieldNames);
  const allowed = getCondOpsByFieldType(fieldType);

  if (!allowed.has(value)) {
    return defaultMessage(message, `${value} 不在可选项中`, listSuggestion([...allowed]));
  }
  return undefined;
};

const validateCodeSelectCol: TypeMatchValidator = (value, { message }) => {
  if (typeof value !== 'string') {
    return defaultMessage(message, `${value}类型应为字符串`, SUGGESTION_STRING);
  }

  const codeDsl = codeBlockService.getCodeDsl();
  if (!codeDsl || !Object.keys(codeDsl).length) {
    return undefined;
  }

  if (!(value in codeDsl)) {
    return defaultMessage(message, `代码块(${value})不存在`, listSuggestion(Object.keys(codeDsl)));
  }
  return undefined;
};

const validatePageFragmentSelect: TypeMatchValidator = (value, { message }) => {
  if (!isId(value)) {
    return defaultMessage(message, `${value}类型应为字符串或数字`, SUGGESTION_STRING_OR_NUMBER);
  }

  const items = editorService.get('root')?.items;
  if (!items?.length) {
    return undefined;
  }

  const fragments = items.filter((item) => item.type === NodeType.PAGE_FRAGMENT);
  const exists = fragments.some((item) => `${item.id}` === `${value}`);
  if (!exists) {
    return defaultMessage(message, `页面片段(${value})不存在`, listSuggestion(fragments.map((item) => `${item.id}`)));
  }
  return undefined;
};

const validateUiSelect: TypeMatchValidator = (value, { message }) => {
  if (!isId(value)) {
    return defaultMessage(message, `${value}类型应为字符串或数字`, SUGGESTION_STRING_OR_NUMBER);
  }

  const root = editorService.get('root');
  if (!root) {
    return undefined;
  }

  if (!editorService.getNodeById(value)) {
    return defaultMessage(message, `组件(${value})不存在`, uiIdSuggestion());
  }
  return undefined;
};

const validateDataSourceInput: TypeMatchValidator = (value, { message }) => {
  if (typeof value !== 'string') {
    return defaultMessage(message, `${value}类型应为字符串`, SUGGESTION_STRING);
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

const validateDataSourceFieldSelect: TypeMatchValidator = (value, { mForm, message, props }) => {
  const config = props.config || {};

  if (config.fieldConfig && !isDataSourceFieldPathValue(value, config)) {
    // 值不是数据源字段路径时，按 fieldConfig 的类型校验（与表单项自身 typeMatch 行为一致）
    return validateTypeMatch(value, mForm, { ...props, config: { name: config.name, ...config.fieldConfig } }, message);
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    return defaultMessage(message, `${value}类型应为字符串数组`, dataSourceFieldPathSuggestion());
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
      return defaultMessage(message, `${value}类型应为字符串`, SUGGESTION_STRING);
    }
    if (!filtered.length) {
      return undefined;
    }
    if (!filtered.some((ds) => `${ds.id}` === `${value}`)) {
      return defaultMessage(message, `${value}不在可选项中`, listSuggestion(filtered.map((ds) => `${ds.id}`)));
    }
    return undefined;
  }

  if (!isPlainObject(value) || value.isBindDataSource !== true || typeof value.dataSourceId === 'undefined') {
    return defaultMessage(message, `${value}类型不合法`, dataSourceBindObjectSuggestion(filtered));
  }

  if (!filtered.length) {
    return undefined;
  }

  const ds = filtered.find((item) => `${item.id}` === `${value.dataSourceId}`);
  if (!ds) {
    return defaultMessage(message, `${value}不在可选项中`, listSuggestion(filtered.map((item) => `${item.id}`)));
  }

  if (typeof value.dataSourceType !== 'undefined' && value.dataSourceType !== ds.type) {
    return defaultMessage(message, `${value}不在可选项中`, listSuggestion(filtered.map((item) => `${item.id}`)));
  }

  return undefined;
};

const validateCodeSelect: TypeMatchValidator = (value, { message }) => {
  if (!isPlainObject(value) || !Array.isArray(value.hookData)) {
    return defaultMessage(message, `${value}类型不合法`, SUGGESTION_CODE_SELECT);
  }

  // 「codeId 是否存在 / 数据源方法是否存在」由 CodeSelect 内部 code-select-col、
  // data-source-method-select 单元格各自的 typeMatch 校验，只标红出错单元格。此处仅做结构校验。
  for (const item of value.hookData) {
    if (!isPlainObject(item)) {
      return defaultMessage(message, '钩子项结构不合法', SUGGESTION_HOOK_ITEM);
    }

    if (typeof item.params !== 'undefined' && !isPlainObject(item.params)) {
      return defaultMessage(message, '钩子项结构不合法', SUGGESTION_HOOK_ITEM);
    }
  }

  return undefined;
};

const validateDataSourceFields: TypeMatchValidator = (value, { message }) => {
  if (!Array.isArray(value)) {
    return defaultMessage(message, `${value}类型应为数组`, SUGGESTION_ARRAY);
  }
  for (const item of value) {
    const error = validateDataSourceFieldsItem(item, message);
    if (error) return error;
  }
  return undefined;
};

const validateDataSourceMocks: TypeMatchValidator = (value, { message }) => {
  if (!Array.isArray(value)) {
    return defaultMessage(message, `${value}类型应为数组`, SUGGESTION_ARRAY);
  }

  for (const item of value) {
    if (
      !isPlainObject(item) ||
      typeof item.title !== 'string' ||
      typeof item.enable !== 'boolean' ||
      typeof item.useInEditor !== 'boolean' ||
      !isPlainObject(item.data)
    ) {
      return defaultMessage(message, 'mock 项结构不合法', SUGGESTION_MOCK_ITEM);
    }
  }

  return undefined;
};

const validateDataSourceMethods: TypeMatchValidator = (value, { message }) => {
  if (!Array.isArray(value)) {
    return defaultMessage(message, `${value}类型应为数组`, SUGGESTION_ARRAY);
  }

  for (const item of value) {
    if (!isPlainObject(item) || typeof item.name !== 'string') {
      return defaultMessage(message, '方法项结构不合法', SUGGESTION_METHOD_ITEM);
    }
    if (typeof item.content !== 'undefined' && typeof item.content !== 'string' && typeof item.content !== 'function') {
      return defaultMessage(message, '方法项结构不合法', SUGGESTION_METHOD_ITEM);
    }
    if (typeof item.params !== 'undefined' && !Array.isArray(item.params)) {
      return defaultMessage(message, '方法项结构不合法', SUGGESTION_METHOD_ITEM);
    }
  }

  return undefined;
};

const validateEventSelect: TypeMatchValidator = (value, { message }) => {
  if (!Array.isArray(value)) {
    return defaultMessage(message, `${value}类型应为数组`, SUGGESTION_ARRAY);
  }

  // 「事件名 / 动作名是否在可选项中」由 EventSelect 的 eventNameConfig.rules、compActionConfig.rules 单独校验，
  // 以便只标红对应 select，而不是整张联动卡片。此处仅做结构校验。
  for (const item of value) {
    if (!isPlainObject(item) || typeof item.name !== 'string') {
      return defaultMessage(message, '事件项结构不合法', SUGGESTION_EVENT_ITEM);
    }

    if (Array.isArray(item.actions)) {
      for (const action of item.actions) {
        if (!isPlainObject(action) || typeof action.actionType === 'undefined') {
          return defaultMessage(message, '事件项结构不合法', SUGGESTION_EVENT_ITEM);
        }
      }
      continue;
    }

    if (typeof item.to === 'undefined' || typeof item.method !== 'string') {
      return defaultMessage(message, '事件项结构不合法', SUGGESTION_EVENT_ITEM);
    }
  }

  return undefined;
};

const validateDisplayConds: TypeMatchValidator = (value, { message }) => {
  if (!Array.isArray(value)) {
    return defaultMessage(message, `${value}类型应为数组`, SUGGESTION_ARRAY);
  }

  // 「op 是否为合法算子 / 字段路径是否存在」由 DisplayConds 内部 cond-op-select、
  // field 单元格（data-source-field-select / cascader）各自的 typeMatch 校验，只标红出错单元格。
  // 此处仅做结构校验。
  for (const item of value) {
    if (!isPlainObject(item) || !Array.isArray(item.cond)) {
      return defaultMessage(message, '显示条件结构不合法', displayCondSuggestion());
    }

    for (const cond of item.cond) {
      if (
        !isPlainObject(cond) ||
        !Array.isArray(cond.field) ||
        cond.field.some((part: any) => typeof part !== 'string') ||
        typeof cond.op !== 'string'
      ) {
        return defaultMessage(message, '显示条件结构不合法', displayCondSuggestion());
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
