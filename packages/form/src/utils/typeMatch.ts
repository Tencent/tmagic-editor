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

import { readonly } from 'vue';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { getValueByKeyPath } from '@tmagic/utils';

import type { CascaderOption, FormState, Rule } from '../schema';

// dayjs.extend 内部有防重复机制，可安全多次调用
dayjs.extend(customParseFormat);

// #region TypeMatchValidateContext
export interface TypeMatchValidateContext {
  fieldType: string;
  mForm: FormState | undefined;
  props: any;
  message?: string;
}
// #endregion TypeMatchValidateContext

// #region TypeMatchValidator
/** 自定义 type 校验器：返回错误文案；通过则返回 undefined */
export type TypeMatchValidator = (value: any, context: TypeMatchValidateContext) => string | undefined;
// #endregion TypeMatchValidator

const typeMatchRuleRegistry = new Map<string, TypeMatchValidator>();

const normalizeType = (type: string) => type.replace(/([A-Z])/g, '-$1').toLowerCase();

/** 注册或覆盖某个字段 type 的 typeMatch 校验规则 */
export const registerTypeMatchRule = (type: string, validator: TypeMatchValidator): void => {
  typeMatchRuleRegistry.set(normalizeType(type), validator);
};

/** 批量注册 typeMatch 校验规则 */
export const registerTypeMatchRules = (rules: Record<string, TypeMatchValidator>): void => {
  Object.entries(rules).forEach(([type, validator]) => {
    registerTypeMatchRule(type, validator);
  });
};

/** 获取某个字段 type 的自定义 typeMatch 校验规则 */
export const getTypeMatchRule = (type: string): TypeMatchValidator | undefined =>
  typeMatchRuleRegistry.get(normalizeType(type));

/** 删除某个字段 type 的自定义 typeMatch 校验规则 */
export const deleteTypeMatchRule = (type: string): boolean => typeMatchRuleRegistry.delete(normalizeType(type));

/** 清空所有自定义 typeMatch 校验规则 */
export const clearTypeMatchRules = (): void => {
  typeMatchRuleRegistry.clear();
};

/** 本地解析配置函数，避免与 form.ts 循环依赖 */
const resolveConfig = <T = any>(
  mForm: FormState | undefined,
  config: T | ((...args: any[]) => T) | undefined,
  props: any,
): T | undefined => {
  if (typeof config === 'function') {
    return (config as Function)(mForm, {
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

const SKIP_TYPES = new Set([
  'display',
  'hidden',
  'row',
  'tab',
  'dynamic-tab',
  'fieldset',
  'panel',
  'step',
  'flex-layout',
  'link',
  'component',
  'dynamic-field',
  'dynamicfield',
  'form',
  'container',
]);

const STRING_TYPES = new Set(['text', 'textarea', 'color-picker', 'html', '']);

const DATE_LIKE_TYPES = new Set(['date', 'datetime', 'time']);

const DATE_LIKE_DEFAULT_VALUE_FORMAT: Record<string, string> = {
  date: 'YYYY/MM/DD',
  datetime: 'YYYY/MM/DD HH:mm:ss',
  time: 'HH:mm:ss',
  daterange: 'YYYY/MM/DD HH:mm:ss',
  timerange: 'HH:mm:ss',
};

const TIMESTAMP_VALUE_FORMATS = new Set(['x', 'timestamp']);

const defaultMessage = (message: string | undefined, fallback: string) => message || fallback;

const isEmptyValue = (value: any) => value === undefined || value === null || value === '';

const isEmptyArray = (value: any) => Array.isArray(value) && value.length === 0;

const resolveDateValueFormat = (fieldType: string, config: any): string =>
  config.valueFormat || DATE_LIKE_DEFAULT_VALUE_FORMAT[fieldType] || 'YYYY/MM/DD HH:mm:ss';

const isTimestampValueFormat = (valueFormat: string) => TIMESTAMP_VALUE_FORMATS.has(valueFormat);

const isValidDateValueByFormat = (value: any, valueFormat: string): boolean => {
  if (isTimestampValueFormat(valueFormat)) {
    return typeof value === 'number' && !Number.isNaN(value);
  }
  if (typeof value !== 'string') {
    return false;
  }
  // 按 Day.js format tokens 严格解析，参见 https://day.js.org/docs/en/display/format
  return dayjs(value, valueFormat, true).isValid();
};

const dateValueFormatErrorMessage = (message: string | undefined, valueFormat: string) =>
  defaultMessage(message, isTimestampValueFormat(valueFormat) ? '值类型应为时间戳数字' : `值格式应为 ${valueFormat}`);

const resolveFieldType = (mForm: FormState | undefined, props: any): string => {
  let type = 'type' in (props.config || {}) ? props.config.type : '';
  type = type ? resolveConfig<string>(mForm, type, props) || '' : '';
  if (type === 'form' || type === 'container') return '';
  return normalizeType(type || '') || (props.config?.items ? '' : 'text');
};

const resolveToggleValues = (config: any) => {
  const filterIsNumber = config.filter === 'number';
  const { activeValue: configActiveValue, inactiveValue: configInactiveValue } = config;

  let activeValue = configActiveValue;
  let inactiveValue = configInactiveValue;

  if (typeof activeValue === 'undefined') {
    activeValue = filterIsNumber ? 1 : true;
  }

  if (typeof inactiveValue === 'undefined') {
    inactiveValue = filterIsNumber ? 0 : false;
  }

  return { activeValue, inactiveValue };
};

const flattenSelectOptions = (options: any[]): any[] => {
  const values: any[] = [];

  options.forEach((option) => {
    if (Array.isArray(option?.options)) {
      option.options.forEach((child: any) => {
        if (typeof child?.value !== 'undefined') {
          values.push(child.value);
        }
      });
      return;
    }

    if (typeof option?.value !== 'undefined') {
      values.push(option.value);
    }
  });

  return values;
};

const resolveOptions = (mForm: FormState | undefined, props: any): any[] => {
  const { options } = props.config || {};
  if (Array.isArray(options)) return options;
  if (typeof options === 'function') {
    return resolveConfig(mForm, options, props) || [];
  }
  return [];
};

const includesOptionValue = (optionValues: any[], value: any) => optionValues.some((item) => Object.is(item, value));

const collectCascaderLeafValues = (options: CascaderOption[], result: any[] = []) => {
  options.forEach((option) => {
    if (option.children?.length) {
      collectCascaderLeafValues(option.children, result);
    } else if (typeof option.value !== 'undefined') {
      result.push(option.value);
    }
  });
  return result;
};

const isValidCascaderPath = (options: CascaderOption[], path: any[]): boolean => {
  if (!path.length) return false;

  let currentOptions = options;
  for (let i = 0; i < path.length; i++) {
    const node = currentOptions.find((option) => Object.is(option.value, path[i]));
    if (!node) return false;
    if (i === path.length - 1) return true;
    currentOptions = node.children || [];
  }

  return false;
};

const validateSelectValue = (
  value: any,
  config: any,
  optionValues: any[],
  message: string | undefined,
): string | undefined => {
  if (config.allowCreate || config.remote) {
    if (config.multiple) {
      if (!Array.isArray(value)) {
        return defaultMessage(message, `${value} 类型应为数组`);
      }
      return undefined;
    }

    if (typeof value === 'object') {
      return defaultMessage(message, `${value} 类型不合法`);
    }
    return undefined;
  }

  if (config.multiple) {
    if (!Array.isArray(value)) {
      return defaultMessage(message, `${value} 类型应为数组`);
    }
    if (value.some((item) => !includesOptionValue(optionValues, item))) {
      return defaultMessage(message, `${value} 不在可选项中`);
    }
    return undefined;
  }

  if (!includesOptionValue(optionValues, value)) {
    return defaultMessage(message, `${value} 不在可选项中`);
  }
  return undefined;
};

const validateCascaderValue = (
  value: any,
  config: any,
  props: any,
  mForm: FormState | undefined,
  message: string | undefined,
): string | undefined => {
  const valueSeparator = resolveConfig<string | undefined>(mForm, config.valueSeparator, props);
  const emitPath = config.emitPath !== false;
  const multiple = Boolean(config.multiple);

  if (valueSeparator) {
    if (typeof value !== 'string' && !Array.isArray(value)) {
      return defaultMessage(message, `${value} 类型应为字符串或数组`);
    }
  } else if (multiple) {
    if (!Array.isArray(value)) {
      return defaultMessage(message, `${value} 类型应为数组`);
    }
  } else if (emitPath && !Array.isArray(value)) {
    return defaultMessage(message, `${value} 类型应为数组`);
  }

  if (config.remote) {
    return undefined;
  }

  const options = resolveOptions(mForm, props) as CascaderOption[];
  if (!options.length) {
    return undefined;
  }

  const normalizedValue = typeof value === 'string' && valueSeparator ? value.split(valueSeparator) : value;

  if (multiple) {
    if (!Array.isArray(normalizedValue)) {
      return defaultMessage(message, `${value} 类型应为数组`);
    }

    const invalid = normalizedValue.some((item) => {
      if (emitPath) {
        return !Array.isArray(item) || !isValidCascaderPath(options, item);
      }
      return !includesOptionValue(collectCascaderLeafValues(options), item);
    });

    if (invalid) {
      return defaultMessage(message, `${value} 不在可选项中`);
    }
    return undefined;
  }

  if (emitPath) {
    if (!Array.isArray(normalizedValue) || !isValidCascaderPath(options, normalizedValue)) {
      return defaultMessage(message, `${value} 不在可选项中`);
    }
    return undefined;
  }

  if (!includesOptionValue(collectCascaderLeafValues(options), normalizedValue)) {
    return defaultMessage(message, `${value} 不在可选项中`);
  }
  return undefined;
};

const validateBuiltinTypeMatch = (
  value: any,
  fieldType: string,
  mForm: FormState | undefined,
  props: any,
  message?: string,
): string | undefined => {
  if (SKIP_TYPES.has(fieldType)) {
    return undefined;
  }

  const config = props.config || {};

  if (STRING_TYPES.has(fieldType)) {
    if (config.filter === 'number') {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return defaultMessage(message, `${value} 类型应为数字`);
      }
      return undefined;
    }

    // 自定义 filter 函数会改写值类型，内置规则无法推断，跳过
    if (typeof config.filter === 'function') {
      return undefined;
    }

    if (typeof value !== 'string') {
      return defaultMessage(message, `${value} 类型应为字符串`);
    }
    return undefined;
  }

  if (DATE_LIKE_TYPES.has(fieldType)) {
    const valueFormat = resolveDateValueFormat(fieldType, config);
    if (!isValidDateValueByFormat(value, valueFormat)) {
      return dateValueFormatErrorMessage(message, valueFormat);
    }
    return undefined;
  }

  if (fieldType === 'number') {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return defaultMessage(message, `${value} 类型应为数字`);
    }
    return undefined;
  }

  if (fieldType === 'number-range') {
    if (
      !Array.isArray(value) ||
      value.length !== 2 ||
      value.some((item) => typeof item !== 'number' || Number.isNaN(item))
    ) {
      return defaultMessage(message, `${value} 类型应为长度为 2 的数字数组`);
    }
    return undefined;
  }

  if (fieldType === 'switch' || fieldType === 'checkbox') {
    const { activeValue, inactiveValue } = resolveToggleValues(config);
    if (!Object.is(value, activeValue) && !Object.is(value, inactiveValue)) {
      return defaultMessage(message, `${value} 不在合法开关值中`);
    }
    return undefined;
  }

  if (fieldType === 'select') {
    const optionValues = flattenSelectOptions(resolveOptions(mForm, props));
    return validateSelectValue(value, config, optionValues, message);
  }

  if (fieldType === 'radio-group') {
    const optionValues = flattenSelectOptions(resolveOptions(mForm, props));
    if (!includesOptionValue(optionValues, value)) {
      return defaultMessage(message, `${value} 不在可选项中`);
    }
    return undefined;
  }

  if (fieldType === 'checkbox-group') {
    if (!Array.isArray(value)) {
      return defaultMessage(message, `${value} 类型应为数组`);
    }
    const optionValues = flattenSelectOptions(resolveOptions(mForm, props));
    if (value.some((item) => !includesOptionValue(optionValues, item))) {
      return defaultMessage(message, `${value} 不在可选项中`);
    }
    return undefined;
  }

  if (fieldType === 'cascader') {
    return validateCascaderValue(value, config, props, mForm, message);
  }

  if (fieldType === 'daterange' || fieldType === 'timerange') {
    if (config.names) {
      return undefined;
    }
    const valueFormat = resolveDateValueFormat(fieldType, config);
    if (
      !Array.isArray(value) ||
      value.length !== 2 ||
      value.some((item) => !isValidDateValueByFormat(item, valueFormat))
    ) {
      return defaultMessage(
        message,
        isTimestampValueFormat(valueFormat)
          ? `${value} 类型应为长度为 2 的时间戳数字数组`
          : `${value} 格式应为长度为 2 的 ${valueFormat} 数组`,
      );
    }
    return undefined;
  }

  if (fieldType === 'table' || fieldType === 'group-list' || fieldType === 'grouplist') {
    if (!Array.isArray(value)) {
      return defaultMessage(message, `${value} 类型应为数组`);
    }
    return undefined;
  }

  return undefined;
};

export const validateTypeMatch = (
  value: any,
  mForm: FormState | undefined,
  props: any,
  message?: string,
): string | undefined => {
  if (isEmptyValue(value) || isEmptyArray(value)) {
    return undefined;
  }

  const fieldType = resolveFieldType(mForm, props);
  const customValidator = getTypeMatchRule(fieldType);

  // 自定义规则优先：可覆盖内置规则，也可为业务自定义字段 type 扩展校验
  if (customValidator) {
    return customValidator(value, { fieldType, mForm, props, message });
  }

  return validateBuiltinTypeMatch(value, fieldType, mForm, props, message);
};

export const createTypeMatchValidator = (mForm: FormState | undefined, props: any, rule: Rule) => {
  const originalValidator = typeof rule.validator === 'function' ? rule.validator : undefined;

  return (asyncValidatorRule: any, value: any, callback: Function, source: any, options: any) => {
    const actualValue = props.config?.names ? props.model : value;
    const error = validateTypeMatch(actualValue, mForm, props, rule.message);

    if (error) {
      callback(new Error(error));
      return;
    }

    if (originalValidator) {
      return originalValidator(
        {
          rule: asyncValidatorRule,
          value: actualValue,
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

    callback();
  };
};
