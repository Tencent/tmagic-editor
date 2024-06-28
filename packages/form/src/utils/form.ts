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

/* eslint-disable no-param-reassign */
import { toRaw } from 'vue';
import { cloneDeep } from 'lodash-es';

import {
  ChildConfig,
  ContainerCommonConfig,
  DaterangeConfig,
  FilterFunction,
  FormConfig,
  FormState,
  FormValue,
  HtmlField,
  Rule,
  TabPaneConfig,
  TypeFunction,
} from '../schema';

interface DefaultItem {
  defaultValue: any;
  type: string;
  filter: string;
  multiple: boolean;
}

const isTableSelect = (type?: string | TypeFunction) =>
  typeof type === 'string' && ['table-select', 'tableSelect'].includes(type);

const asyncLoadConfig = (value: FormValue, initValue: FormValue, { asyncLoad, name, type }: HtmlField) => {
  // 富文本配置了异步加载
  if (type === 'html' && typeof asyncLoad === 'object' && typeof name !== 'undefined') {
    asyncLoad.name = name;
    value.asyncLoad = typeof initValue.asyncLoad === 'object' ? initValue.asyncLoad : asyncLoad;
  }
};

const isMultipleValue = (type?: string | TypeFunction) =>
  typeof type === 'string' &&
  ['checkbox-group', 'checkboxGroup', 'table', 'cascader', 'group-list', 'groupList'].includes(type);

const initItemsValue = (
  mForm: FormState | undefined,
  value: FormValue,
  initValue: FormValue,
  { items, name, extensible }: any,
) => {
  if (Array.isArray(initValue[name])) {
    value[name] = initValue[name].map((v: any, index: number) => createValues(mForm, items, v, value[name]?.[index]));
  } else {
    value[name] = createValues(mForm, items, initValue[name], value[name]);
    if (extensible) {
      value[name] = Object.assign({}, initValue[name], value[name]);
    }
  }
};

const setValue = (mForm: FormState | undefined, value: FormValue, initValue: FormValue, item: any) => {
  const { items, name, type, checkbox } = item;
  // 值是数组， 有可能也有items配置，所以不能放到getDefaultValue里赋值
  if (isMultipleValue(type) || (type === 'tab' && item.dynamic)) {
    value[name] = initValue[name] || [];
  }

  // 有子项继续递归，没有的话有初始值用初始值，没有初始值用默认值
  if (items) {
    initItemsValue(mForm, value, initValue, item);
  } else {
    value[name] = getDefaultValue(mForm, item as DefaultItem);
  }

  // 如果fieldset配置checkbox，checkbox的值保存在value中
  if (type === 'fieldset' && checkbox) {
    if (typeof value[name] === 'object') {
      value[name].value = typeof initValue[name] === 'object' ? initValue[name].value || 0 : 0;
    }
  }
};

const initValueItem = function (
  mForm: FormState | undefined,
  item: ChildConfig | TabPaneConfig,
  initValue: FormValue,
  value: FormValue,
) {
  const { items } = item as ContainerCommonConfig;
  const { names } = item as DaterangeConfig;
  const { type, name } = item as ChildConfig;

  if (isTableSelect(type) && name) {
    value[name] = initValue[name] || '';
    return value;
  }

  asyncLoadConfig(value, initValue, item as HtmlField);

  // 这种情况比较多，提前结束
  if (name && !items && typeof initValue[name] !== 'undefined') {
    if (typeof value[name] === 'undefined') {
      if (type === 'number') {
        value[name] = Number(initValue[name]);
      } else {
        value[name] = typeof initValue[name] === 'object' ? cloneDeep(initValue[name]) : initValue[name];
      }
    }

    return value;
  }

  if (names) {
    return names.forEach((n: string) => (value[n] = initValue[n] || ''));
  }

  if (!name) {
    // 没有配置name，直接跳过
    return createValues(mForm, items, initValue, value);
  }

  setValue(mForm, value, initValue, item);

  return value;
};

export const createValues = function (
  mForm: FormState | undefined,
  config: FormConfig | TabPaneConfig[] = [],
  initValue: FormValue = {},
  value: FormValue = {},
) {
  if (Array.isArray(config)) {
    config.forEach((item: ChildConfig | TabPaneConfig) => {
      initValueItem(mForm, item, initValue, value);
    });
  }

  return value;
};

const getDefaultValue = function (mForm: FormState | undefined, { defaultValue, type, filter, multiple }: DefaultItem) {
  if (typeof defaultValue === 'function') {
    return defaultValue(mForm);
  }

  // 如果直接设置为undefined，在解析成js对象时会丢失这个配置，所以用'undefined'代替
  if (defaultValue === 'undefined') {
    return undefined;
  }

  if (typeof defaultValue !== 'undefined') {
    return defaultValue;
  }

  if (type === 'number' || filter === 'number') {
    return 0;
  }

  if (['switch', 'checkbox'].includes(type)) {
    return false;
  }

  if (multiple || type === 'number-range') {
    return [];
  }

  return '';
};

export const filterFunction = <T = any>(
  mForm: FormState | undefined,
  config: T | FilterFunction<T> | undefined,
  props: any,
) => {
  if (typeof config === 'function') {
    return (config as FilterFunction<T>)(mForm, {
      values: mForm?.initValues || {},
      model: props.model,
      parent: mForm?.parentValues || {},
      formValue: mForm?.values || props.model,
      prop: props.prop,
      config: props.config,
      index: props.index,
    });
  }

  return config;
};

export const display = function (mForm: FormState | undefined, config: any, props: any) {
  if (config === 'expand') {
    return config;
  }

  if (typeof config === 'function') {
    return filterFunction(mForm, config, props);
  }

  if (config === false) {
    return false;
  }

  return true;
};

export const getRules = function (mForm: FormState | undefined, rules: Rule[] | Rule = [], props: any) {
  rules = cloneDeep(rules);

  if (typeof rules === 'object' && !Array.isArray(rules)) {
    rules = [rules];
  }

  return rules.map((item) => {
    if (typeof item.validator === 'function') {
      const fnc = item.validator;

      (item as any).validator = (rule: any, value: any, callback: Function, source: any, options: any) =>
        fnc(
          {
            rule,
            value: props.config.names ? props.model : value,
            callback,
            source,
            options,
          },
          {
            values: mForm?.initValues || {},
            model: props.model,
            parent: mForm?.parentValues || {},
            formValue: mForm?.values || props.model,
            prop: props.prop,
            config: props.config,
          },
          mForm,
        );
    }
    return item;
  });
};

export const initValue = async (
  mForm: FormState | undefined,
  { initValues, config }: { initValues: FormValue; config: FormConfig },
) => {
  if (!Array.isArray(config)) throw new Error('config应该为数组');

  let valuesTmp = createValues(mForm, config, toRaw(initValues), {});

  const [firstForm] = config as [ContainerCommonConfig];
  if (firstForm && typeof firstForm.onInitValue === 'function') {
    valuesTmp = await firstForm.onInitValue(mForm, {
      formValue: valuesTmp,
      initValue: initValues,
    });
  }

  return valuesTmp || {};
};
