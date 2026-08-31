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

import { type MaybeRef, readonly, unref } from 'vue';
import dayjs from 'dayjs';
// dayjs 没有 exports 映射，原生 Node ESM 不会补扩展名，深路径必须写全 .js
import utc from 'dayjs/plugin/utc.js';
import { cloneDeep } from 'lodash-es';

import { getDesignConfig } from '@tmagic/design/headless';
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

import { getConfig } from './config';
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
      const callback = (error?: Error | string | (Error | string)[]) => {
        if (settled) return;
        settled = true;
        // async-validator 约定 callback 也可接收错误数组，TDesign 只能展示一条，取首条
        const first = Array.isArray(error) ? error[0] : error;
        if (first) {
          resolve({
            result: false,
            message: typeof first === 'string' ? first : first.message,
          });
        } else {
          resolve(true);
        }
      };

      try {
        // 异步 validator 会先返回 undefined，稍后再调 callback，这里不能当成 thenable 取值
        const result = validator(undefined, value, callback);
        if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
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

/**
 * formState 中与表单 props 无关的公共部分：字段注册表、消息组件、post 请求。
 *
 * 由渲染式表单（`Form.vue`）与无渲染校验（`createHeadlessFormState`）共用，
 * 保证两者提供给字段配置（`onChange` / `validator` / 异步 options 等）的能力一致。
 */
const fallbackMessage = {
  error: (msg: string) => console.error(msg),
  success: (msg: string) => console.log(msg),
  warning: (msg: string) => console.warn(msg),
  info: (msg: string) => console.info(msg),
  closeAll: () => undefined,
};

const fallbackMessageBox = {
  alert: (msg: string) => console.log(msg),
  confirm: (msg: string) => console.log(msg),
  close: (msg: string) => console.log(msg),
};

export const createFormStateBase = (ui?: { $message?: any; $messageBox?: any }) => {
  const fields = new Map<string, any>();
  const requestFuc = getConfig('request') as Function;

  return {
    fields,
    setField: (prop: string, field: any) => fields.set(prop, field),
    getField: (prop: string) => fields.get(prop),
    deleteField: (prop: string) => fields.delete(prop),
    $messageBox: ui?.$messageBox ?? fallbackMessageBox,
    $message: ui?.$message ?? fallbackMessage,
    post: (options: any) => {
      if (requestFuc) {
        return requestFuc({
          method: 'POST',
          ...options,
        });
      }
    },
  };
};

/**
 * 配置项的 `name` 是否可用于从 model 中下钻取值。
 *
 * 供 `Container.vue` 与无渲染校验（`collectValidatableFields`）共用，两者对「该不该下钻」
 * 的判断必须一致。
 */
export const isValidName = (name: unknown): boolean => {
  const valueType = typeof name;
  if (valueType !== 'string' && valueType !== 'symbol' && valueType !== 'number') return false;
  if (name === '') return false;
  if (valueType === 'number') return (name as number) >= 0;
  return true;
};

/**
 * 在 `prop` 后追加一段路径。
 *
 * 用于容器把 `prop` 透传给子级时再拼上索引 / key（如 group-list 的行、table 的行）。
 */
export const appendProp = (prop: string | undefined = '', key: string | number): string =>
  `${prop}${prop ? '.' : ''}${key}`;

/**
 * 由父级 `prop` 与配置项 `name` 拼出该配置项的完整 `prop`（即 FormItem 的 prop）。
 *
 * 调用方传入的 name 已按 `config.name || ''` 归一化，空 name 表示该配置项不占据值路径上的一层，
 * 此时沿用父级 `prop`。
 */
export const getItemProp = (prop: string | undefined = '', name: string | number | undefined = ''): string =>
  name === '' ? (prop ?? '') : appendProp(prop, name);

/**
 * 归一化配置项的 `type`：求值动态 type、剥离容器语义的 type、驼峰转中划线、补默认值。
 *
 * 供 `Container.vue` 与无渲染校验共用，保证两者分派到的 type 完全一致。
 */
export const resolveItemType = (mForm: FormState | undefined, config: any, props: any): string => {
  let type = 'type' in (config || {}) ? config.type : '';
  type = type && filterFunction<string>(mForm, type, props);
  // form / container 都表示「仅嵌套，不渲染字段」
  if (type === 'form' || type === 'container') return '';
  return type?.replace(/([A-Z])/g, '-$1').toLowerCase() || (config?.items ? '' : 'text');
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

const buildRules = function (
  mForm: FormState | undefined,
  r: Rule[] | Rule = [],
  props: any,
  typeMatchValid?: MaybeRef<boolean>,
  adapt: (_validator: AsyncValidatorFn) => AsyncValidatorFn = (validator) => validator,
) {
  let rules = cloneDeep(r);

  if (typeof rules === 'object' && !Array.isArray(rules)) {
    rules = [rules];
  }

  if (unref(typeMatchValid) && !rules.some((r) => typeof r.typeMatch !== 'undefined')) {
    rules.push({
      typeMatch: true,
    });
  }

  return rules
    .map((item) => {
      if (item.typeMatch) {
        (item as any).validator = adapt(createTypeMatchValidator(mForm, props, item));
        return item;
      }

      if (typeof item.validator === 'function') {
        const fnc = item.validator;

        (item as any).validator = adapt((rule: any, value: any, callback: Function, source: any, options: any) =>
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
    })
    .filter((item) => {
      // typeMatch: false 仅用于关闭自动注入，本身没有校验能力。
      // 若原样交给 async-validator，会因默认 type=string 误杀 number 等合法值。
      if (item.typeMatch === false && typeof item.validator !== 'function') {
        return false;
      }
      return true;
    });
};

export const getRules = function (
  mForm: FormState | undefined,
  r: Rule[] | Rule = [],
  props: any,
  typeMatchValid?: MaybeRef<boolean>,
) {
  return buildRules(mForm, r, props, typeMatchValid, adaptFormValidator);
};

/**
 * 与 `getRules` 相同，但 validator 保持 async-validator（Element Plus）原生签名，不做 UI 库适配。
 *
 * 供无渲染校验（`validateValues`）使用：它直接把规则交给 async-validator 执行，
 * 不经过 TDesign 的 `validator(val)` 调用约定，因此不能套 `adaptFormValidator`。
 */
export const getNativeRules = function (
  mForm: FormState | undefined,
  r: Rule[] | Rule = [],
  props: any,
  typeMatchValid?: MaybeRef<boolean>,
) {
  return buildRules(mForm, r, props, typeMatchValid);
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
 * 注意：extendState 只能向 formState「新增」字段，不允许覆盖其已有 key。
 * 调用方可通过 `reservedKeys` 传入合并前已存在的内置 key 快照（keyProp / popperClass /
 * config / initValues / isCompare / lastValues / parentValues / values / $emit / fields /
 * post 等），命中这些 key 时统一跳过并告警。
 *
 * 兜底：未传 `reservedKeys` 时，仍会拦截 props 派生的只读 getter 字段（无 setter），
 * 否则以普通字段形式赋值会让 proxy 的 set trap 抛出
 * `TypeError: 'set' on proxy: trap returned falsish`。
 */
export const applyExtendState = (
  formState: FormState,
  state: Record<string, any> | null | undefined,
  reservedKeys?: Set<string | symbol>,
): void => {
  if (!state) return;

  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(state))) {
    if (reservedKeys?.has(key)) {
      continue;
    }

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
