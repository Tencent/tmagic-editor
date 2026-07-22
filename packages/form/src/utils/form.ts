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

import { ComputedRef, readonly } from 'vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { cloneDeep } from 'lodash-es';

import { getDesignConfig } from '@tmagic/design';
import { getValueByKeyPath } from '@tmagic/utils';

import type {
  ChildConfig,
  ContainerCommonConfig,
  DaterangeConfig,
  FilterFunction,
  FormConfig,
  FormState,
  FormValue,
  HtmlField,
  Rule,
  SortProp,
  TableConfig,
  TabPaneConfig,
  TypeFunction,
} from '../schema';

import { createTypeMatchValidator } from './typeMatch';

type AsyncValidatorFn = (rule: any, value: any, callback: Function, source?: any, options?: any) => any;

const isTDesignAdapter = () => getDesignConfig('adapterType') === 'tdesign-vue-next';

/**
 * 将 async-validator（Element Plus）风格的 validator 适配到当前 UI 库。
 * TDesign 调用签名为 `(val) => boolean | CustomValidateObj | Promise`，无 callback。
 */
export const adaptFormValidator = (validator: AsyncValidatorFn): AsyncValidatorFn => {
  return (arg1: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any) => {
    if (!isTDesignAdapter()) {
      return validator(arg1, arg2, arg3, arg4, arg5);
    }

    // TDesign: validator(val)
    const value = arg1;
    return new Promise((resolve) => {
      let settled = false;
      const callback = (error?: Error | string) => {
        if (settled) return;
        settled = true;
        if (error) {
          resolve({
            result: false,
            message: typeof error === 'string' ? error : error.message,
          });
        } else {
          resolve(true);
        }
      };

      try {
        const result = validator(undefined, value, callback);
        if (result !== null && typeof (result as PromiseLike<unknown>).then === 'function') {
          Promise.resolve(result).then(
            () => {
              if (!settled) callback();
            },
            (err) => {
              callback(err instanceof Error ? err : new Error(String(err)));
            },
          );
        }
      } catch (e) {
        callback(e instanceof Error ? e : new Error(String(e)));
      }
    });
  };
};

interface DefaultItem {
  defaultValue: any;
  type: string;
  filter: string;
  multiple: boolean;
  names?: string[];
}

const TABLE_SELECT_TYPES = new Set(['table-select', 'tableSelect']);
const isTableSelect = (type?: string | TypeFunction) => typeof type === 'string' && TABLE_SELECT_TYPES.has(type);

const asyncLoadConfig = (value: FormValue, initValue: FormValue, { asyncLoad, name, type }: HtmlField) => {
  // 富文本配置了异步加载
  if (type === 'html' && typeof asyncLoad === 'object' && typeof name !== 'undefined') {
    asyncLoad.name = name;
    value.asyncLoad = typeof initValue.asyncLoad === 'object' ? initValue.asyncLoad : asyncLoad;
  }
};

const MULTIPLE_VALUE_TYPES = new Set([
  'checkbox-group',
  'checkboxGroup',
  'table',
  'cascader',
  'group-list',
  'groupList',
]);
const isMultipleValue = (type?: string | TypeFunction) => typeof type === 'string' && MULTIPLE_VALUE_TYPES.has(type);

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
    const checkboxName = typeof checkbox === 'object' && typeof checkbox.name === 'string' ? checkbox.name : 'value';
    const checkboxFalseValue =
      typeof checkbox === 'object' && typeof checkbox.falseValue !== 'undefined' ? checkbox.falseValue : 0;

    if (name && typeof value[name] === 'object') {
      value[name][checkboxName] =
        typeof initValue[name] === 'object' ? initValue[name][checkboxName] || checkboxFalseValue : checkboxFalseValue;
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
  const type = 'type' in item ? item.type : '';
  const { name } = item;

  if (isTableSelect(type) && name) {
    value[name] = initValue[name] ?? '';
    return value;
  }

  asyncLoadConfig(value, initValue, item as HtmlField);

  // 这种情况比较多，提前结束
  if (name && !items && typeof initValue?.[name] !== 'undefined') {
    if (typeof value[name] === 'undefined') {
      value[name] = type === 'number' ? Number(initValue[name]) : initValue[name];
    }

    return value;
  }

  if (names) {
    return names.forEach((n: string) => (value[n] = initValue[n] ?? ''));
  }

  if (!name) {
    // 没有配置name，直接跳过
    return createValues(mForm, items, initValue, value);
  }

  setValue(mForm, value, initValue, item);

  if (type === 'table') {
    const tableConfig = item as TableConfig;
    if (tableConfig.defautSort) {
      sortChange(value[name], tableConfig.defautSort);
    } else if (tableConfig.defaultSort) {
      sortChange(value[name], tableConfig.defaultSort);
    }

    if (tableConfig.sort && tableConfig.sortKey) {
      value[name].sort((a: any, b: any) => b[tableConfig.sortKey!] - a[tableConfig.sortKey!]);
    }
  }

  return value;
};

export const createValues = function (
  mForm: FormState | undefined,
  config: FormConfig | TabPaneConfig[] = [],
  initValue: FormValue = {},
  value: FormValue = {},
) {
  if (Array.isArray(config)) {
    config.forEach((item) => {
      initValueItem(mForm, item as ChildConfig | TabPaneConfig, initValue, value);
    });
  }

  return value;
};

const getDefaultValue = function (
  mForm: FormState | undefined,
  { defaultValue, type, filter, multiple, names }: DefaultItem,
) {
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

  if (type === 'daterange' && !names) {
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
      values: readonly(mForm?.initValues || {}),
      model: readonly(props.model),
      parent: readonly(mForm?.parentValues || {}),
      formValue: readonly(mForm?.values || props.model),
      prop: props.prop,
      config: props.config,
      index: props.index,
      getFormValue: (prop: string) => getValueByKeyPath(prop, mForm?.values || props.model),
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

export const getRules = function (
  mForm: FormState | undefined,
  r: Rule[] | Rule = [],
  props: any,
  typeMatchValid?: ComputedRef<boolean>,
) {
  let rules = cloneDeep(r);

  if (typeof rules === 'object' && !Array.isArray(rules)) {
    rules = [rules];
  }

  if (typeMatchValid?.value && !rules.some((r) => typeof r.typeMatch !== 'undefined')) {
    rules.push({
      typeMatch: true,
    });
  }

  return rules.map((item) => {
    if (item.typeMatch) {
      (item as any).validator = adaptFormValidator(createTypeMatchValidator(mForm, props, item));
      return item;
    }

    if (typeof item.validator === 'function') {
      const fnc = item.validator;

      (item as any).validator = adaptFormValidator(
        (rule: any, value: any, callback: Function, source: any, options: any) =>
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
          ),
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

  const initValuesCopy = cloneDeep(initValues);

  let valuesTmp = createValues(mForm, config, initValuesCopy, {});

  const [firstForm] = config as [ContainerCommonConfig];
  if (firstForm && typeof firstForm.onInitValue === 'function') {
    valuesTmp = await firstForm.onInitValue(mForm, {
      formValue: valuesTmp,
      initValue: initValuesCopy,
    });
  }

  return valuesTmp || {};
};

export const datetimeFormatter = (
  v: string | Date,
  defaultValue = '-',
  format = 'YYYY-MM-DD HH:mm:ss',
): string | number => {
  if (v) {
    let time: string | number;
    if (['x', 'timestamp'].includes(format)) {
      time = dayjs(Number.isNaN(Number(v)) ? v : Number(v)).valueOf();
    } else if ((typeof v === 'string' && v.includes('Z')) || v instanceof Date) {
      // dayjs.extend 内部有防重复机制 (plugin.$i)，无需额外判断
      dayjs.extend(utc);
      // UTC字符串时间或Date对象格式化为北京时间
      time = dayjs(v).utcOffset(8).format(format);
    } else {
      time = dayjs(v).format(format);
    }

    if (time !== 'Invalid Date') {
      return time;
    }
    return defaultValue;
  }
  return defaultValue;
};

export const getDataByPage = (data: any[] = [], pagecontext: number, pagesize: number) => {
  const start = pagecontext * pagesize;
  return data.slice(start, start + pagesize);
};

export const sortArray = (data: any[], newIndex: number, oldIndex: number, sortKey?: string) => {
  if (newIndex === oldIndex) {
    return data;
  }

  if (newIndex < 0 || newIndex >= data.length || oldIndex < 0 || oldIndex >= data.length) {
    return data;
  }

  // 先取出要移动的元素，再使用 toSpliced 避免修改原数组
  const item = data[oldIndex];
  const newData = data.toSpliced(oldIndex, 1).toSpliced(newIndex, 0, item);

  if (sortKey) {
    for (let i = newData.length - 1, v = 0; i >= 0; i--, v++) {
      newData[v][sortKey] = i;
    }
  }

  return cloneDeep(newData);
};

export const sortChange = (data: any[], { prop, order }: SortProp) => {
  if (order === 'ascending') {
    data.sort((a: any, b: any) => a[prop] - b[prop]);
  } else if (order === 'descending') {
    data.sort((a: any, b: any) => b[prop] - a[prop]);
  }
};

/**
 * 将 extendState 返回的扩展字段合并进 formState。
 *
 * - data 描述符（普通字段）通过 `formState[key] = value` 写入，走 reactive proxy 的 set，
 *   触发依赖通知；
 * - accessor 描述符（`{ get stage() { return ... } }`）按原样 defineProperty，调用方
 *   可控制读时求值；强制 `configurable: true` 以便下一次合并可再 define。
 *
 * 注意：formState 上由 props 派生的字段（keyProp / popperClass / config / initValues /
 * isCompare / lastValues / parentValues）是只读 getter（无 setter），extendState 若以
 * 普通字段形式返回同名 key，直接赋值会让 proxy 的 set trap 失败并抛出
 * `TypeError: 'set' on proxy: trap returned falsish`，这里统一跳过并告警；
 * 如确需覆盖，可在 extendState 中以 get 访问器形式返回。
 */
export const applyExtendState = (formState: FormState, state: Record<string, any> | null | undefined): void => {
  if (!state) return;

  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(state))) {
    if (!('value' in descriptor)) {
      descriptor.configurable = true;
      Object.defineProperty(formState, key, descriptor);
      continue;
    }

    const targetDescriptor = Object.getOwnPropertyDescriptor(formState, key);
    if (targetDescriptor && !('value' in targetDescriptor) && typeof targetDescriptor.set !== 'function') {
      console.warn(
        `[MForm] extendState: "${key}" is a read-only field derived from props and cannot be assigned a plain value. ` +
          'Return it as a getter accessor if you really need to override it.',
      );
      continue;
    }

    (formState as any)[key] = (state as any)[key];
  }
};

export const createObjectProp = (prop: string, key: string, name?: string | number) => {
  if (prop === '') {
    return key;
  }

  const itemPath = `${prop}`.split('.');

  if (name) {
    if (`${itemPath[itemPath.length - 1]}` === `${name}`) {
      return `${[...itemPath.slice(0, -1), key].join('.')}`;
    }
  }
  return `${[...itemPath, key].join('.')}`;
};
