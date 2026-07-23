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

import { appendValidateSuggestion } from '@tmagic/design';
import { getValueByKeyPath, toLine } from '@tmagic/utils';

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

const isPromise = (value: any): value is Promise<unknown> =>
  typeof value === 'object' && value !== null && typeof value.then === 'function';

/** 注册或覆盖某个字段 type 的 typeMatch 校验规则 */
export const registerTypeMatchRule = (type: string, validator: TypeMatchValidator): void => {
  typeMatchRuleRegistry.set(toLine(type), validator);
};

/** 批量注册 typeMatch 校验规则 */
export const registerTypeMatchRules = (rules: Record<string, TypeMatchValidator>): void => {
  Object.entries(rules).forEach(([type, validator]) => {
    registerTypeMatchRule(type, validator);
  });
};

/** 获取某个字段 type 的自定义 typeMatch 校验规则 */
export const getTypeMatchRule = (type: string): TypeMatchValidator | undefined =>
  typeMatchRuleRegistry.get(toLine(type));

/** 删除某个字段 type 的自定义 typeMatch 校验规则 */
export const deleteTypeMatchRule = (type: string): boolean => typeMatchRuleRegistry.delete(toLine(type));

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
const MAX_SUGGESTION_OPTIONS = 5;

/**
 * 生成「请使用以下某一个值：xxx；xxx」形式的参考建议；无可选值时返回空字符串（不追加建议）。
 * 可选值超过 MAX_SUGGESTION_OPTIONS 个时仅展示前若干个并以「等」省略。
 */
const optionSuggestion = (optionValues: any[]): string => {
  const values = optionValues.filter((item) => typeof item !== 'undefined');
  if (!values.length) return '';
  const shown = values.slice(0, MAX_SUGGESTION_OPTIONS).map(stringifyExampleValue);
  const suffix = values.length > MAX_SUGGESTION_OPTIONS ? ' 等' : '';
  return `请使用以下某一个值：${shown.join('；')}${suffix}`;
};

/**
 * 基于真实 options 生成类型不匹配场景的「参考示例值」。
 *
 * - expectArray 为 true 时，取前若干个真实可选值组成数组示例；
 * - 否则取第一个真实可选值作为标量示例。
 * 无可用 options 时回退到通用示例。
 */
const optionExampleSuggestion = (optionValues: any[], fallbackExample: string, expectArray: boolean): string => {
  const values = optionValues.filter((item) => typeof item !== 'undefined');
  if (!values.length) return `请参考以下示例值：${fallbackExample}`;
  const example = expectArray ? stringifyExampleValue(values.slice(0, 2)) : stringifyExampleValue(values[0]);
  return `请参考以下示例值：${example}`;
};

/**
 * 生成开关类字段的参考建议，列出合法的开关值。
 */
const toggleSuggestion = (activeValue: any, inactiveValue: any): string =>
  `请使用以下某一个值：${stringifyExampleValue(activeValue)}；${stringifyExampleValue(inactiveValue)}`;

/**
 * 解析字段配置中的真实默认值（defaultValue），用于生成「真实」的参考示例值。
 * defaultValue 可能是函数，交由 resolveConfig 处理；未配置时返回 undefined。
 */
const resolveFieldDefaultValue = (mForm: FormState | undefined, props: any): any => {
  const { defaultValue } = props.config || {};
  if (typeof defaultValue === 'undefined' || defaultValue === 'undefined') return undefined;
  const resolvedDefaultValue = resolveConfig(mForm, defaultValue, props);
  // resolveConfig 返回 Promise（如 defaultValue 为异步函数）时无法同步获取默认值，回退到通用示例
  if (isPromise(resolvedDefaultValue)) {
    return undefined;
  }
  return resolvedDefaultValue;
};

const isNumberValue = (value: any) => typeof value === 'number' && !Number.isNaN(value);
const isStringValue = (value: any) => typeof value === 'string';
const isObjectValue = (value: any) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isObjectArrayValue = (value: any) => Array.isArray(value) && value.every((item) => isObjectValue(item));
const isNumberRangeValue = (value: any) =>
  Array.isArray(value) && value.length === 2 && value.every((item) => isNumberValue(item));

/**
 * 生成类型不匹配场景的「参考示例值」。
 *
 * 优先使用字段配置的真实默认值（defaultValue，需符合期望类型）；无可用默认值时回退到通用示例。
 */
const typeExampleSuggestion = (
  mForm: FormState | undefined,
  props: any,
  fallbackExample: string,
  isValid: (value: any) => boolean,
): string => {
  const defaultValue = resolveFieldDefaultValue(mForm, props);
  const example =
    typeof defaultValue !== 'undefined' && isValid(defaultValue)
      ? stringifyExampleValue(defaultValue)
      : fallbackExample;
  return `请参考以下示例值：${example}`;
};

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

/**
 * 生成单个日期类字段的参考示例值：时间戳格式给出当前时间戳，其余按 valueFormat 格式化当前时间。
 */
const dateSuggestion = (valueFormat: string): string =>
  isTimestampValueFormat(valueFormat)
    ? `请参考以下示例值：${Date.now()}`
    : `请参考以下示例值："${dayjs().format(valueFormat)}"`;

/**
 * 生成日期范围类字段的参考示例值（长度为 2 的数组）。
 */
const dateRangeSuggestion = (valueFormat: string): string => {
  if (isTimestampValueFormat(valueFormat)) {
    return `请参考以下示例值：[${Date.now()}, ${Date.now()}]`;
  }
  const example = dayjs().format(valueFormat);
  return `请参考以下示例值：["${example}", "${example}"]`;
};

const dateValueFormatErrorMessage = (message: string | undefined, valueFormat: string) =>
  defaultMessage(
    message,
    isTimestampValueFormat(valueFormat) ? '值类型应为时间戳数字' : `值格式应为 ${valueFormat}`,
    dateSuggestion(valueFormat),
  );

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

const resolveOptions = (props: any): any[] => {
  const { options } = props.config || {};
  return Array.isArray(options) ? options : [];
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

/**
 * 取 cascader options 的第一条完整路径（从顶层到叶子的 value 数组）。
 */
const firstCascaderPath = (options: CascaderOption[]): any[] => {
  const path: any[] = [];
  let current: CascaderOption[] | undefined = options;
  while (current?.length) {
    const node: CascaderOption = current[0];
    if (typeof node.value === 'undefined') break;
    path.push(node.value);
    current = node.children;
  }
  return path;
};

/**
 * 基于真实 cascader options 生成类型不匹配场景的「参考示例值」。
 *
 * 依据 valueSeparator / multiple / emitPath 组织真实选中值的形态；无可用 options 时回退到通用示例。
 */
const cascaderExampleSuggestion = (
  options: CascaderOption[],
  config: any,
  valueSeparator: string | undefined,
  fallbackExample: string,
): string => {
  const path = firstCascaderPath(options);
  if (!path.length) return `请参考以下示例值：${fallbackExample}`;

  const emitPath = config.emitPath !== false;
  const multiple = Boolean(config.multiple);
  // 单个选中值：emitPath 时为完整路径数组，否则为叶子值
  const single = emitPath ? path : path[path.length - 1];

  let example: any;
  if (valueSeparator) {
    example = path.join(valueSeparator);
  } else if (multiple) {
    example = [single];
  } else {
    example = single;
  }
  return `请参考以下示例值：${stringifyExampleValue(example)}`;
};

const validateSelectValue = (
  value: any,
  config: any,
  optionValues: any[],
  message: string | undefined,
): string | undefined => {
  if (optionValues.length === 0) {
    return undefined;
  }

  if (config.allowCreate || config.remote) {
    if (config.multiple) {
      if (!Array.isArray(value)) {
        return defaultMessage(
          message,
          `${value} 类型应为数组`,
          optionExampleSuggestion(optionValues, '["选项1", "选项2"]', true),
        );
      }
      return undefined;
    }

    if (typeof value === 'object') {
      return defaultMessage(
        message,
        `${value} 类型不合法`,
        optionExampleSuggestion(optionValues, '"文本内容" 或 123', false),
      );
    }
    return undefined;
  }

  // 仅当 options 为静态数组时才校验值是否在可选项中，动态 options（函数形式）跳过
  const isStaticOptions = Array.isArray(config.options);

  if (config.multiple) {
    if (!Array.isArray(value)) {
      return defaultMessage(
        message,
        `${value} 类型应为数组`,
        optionExampleSuggestion(optionValues, '["选项1", "选项2"]', true),
      );
    }
    if (isStaticOptions && value.some((item) => !includesOptionValue(optionValues, item))) {
      return defaultMessage(message, `${value} 不在可选项中`, optionSuggestion(optionValues));
    }
    return undefined;
  }

  if (isStaticOptions && !includesOptionValue(optionValues, value)) {
    return defaultMessage(message, `${value} 不在可选项中`, optionSuggestion(optionValues));
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
  const options = resolveOptions(props) as CascaderOption[];

  if (!options.length) {
    return;
  }

  const valueSeparator = resolveConfig<string | undefined>(mForm, config.valueSeparator, props);
  // resolveConfig 返回 Promise（如 valueSeparator 为异步函数）时无法同步确定分隔符，跳过校验
  if (isPromise(valueSeparator)) {
    return undefined;
  }
  const emitPath = config.emitPath !== false;
  const multiple = Boolean(config.multiple);
  const cascaderExample = (fallbackExample: string) =>
    cascaderExampleSuggestion(options, config, valueSeparator, fallbackExample);

  if (valueSeparator) {
    if (typeof value !== 'string' && !Array.isArray(value)) {
      return defaultMessage(
        message,
        `${value} 类型应为字符串或数组`,
        cascaderExample('"选项1,选项2" 或 ["选项1", "选项2"]'),
      );
    }
  } else if (multiple) {
    if (!Array.isArray(value)) {
      return defaultMessage(message, `${value} 类型应为数组`, cascaderExample('["选项1", "选项2"]'));
    }
  } else if (emitPath && !Array.isArray(value)) {
    return defaultMessage(message, `${value} 类型应为数组`, cascaderExample('["选项1", "选项2"]'));
  }

  if (config.remote) {
    return undefined;
  }

  if (!options.length) {
    return undefined;
  }

  const normalizedValue = typeof value === 'string' && valueSeparator ? value.split(valueSeparator) : value;

  if (multiple) {
    if (!Array.isArray(normalizedValue)) {
      return defaultMessage(message, `${value} 类型应为数组`, cascaderExample('["选项1", "选项2"]'));
    }

    const invalid = normalizedValue.some((item) => {
      if (emitPath) {
        return !Array.isArray(item) || !isValidCascaderPath(options, item);
      }
      return !includesOptionValue(collectCascaderLeafValues(options), item);
    });

    if (invalid) {
      return defaultMessage(message, `${value} 不在可选项中`, optionSuggestion(collectCascaderLeafValues(options)));
    }
    return undefined;
  }

  if (emitPath) {
    if (!Array.isArray(normalizedValue) || !isValidCascaderPath(options, normalizedValue)) {
      return defaultMessage(message, `${value} 不在可选项中`, optionSuggestion(collectCascaderLeafValues(options)));
    }
    return undefined;
  }

  if (!includesOptionValue(collectCascaderLeafValues(options), normalizedValue)) {
    return defaultMessage(message, `${value} 不在可选项中`, optionSuggestion(collectCascaderLeafValues(options)));
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
        return defaultMessage(
          message,
          `${value} 类型应为数字`,
          typeExampleSuggestion(mForm, props, '123', isNumberValue),
        );
      }
      return undefined;
    }

    // 自定义 filter 函数会改写值类型，内置规则无法推断，跳过
    if (typeof config.filter === 'function') {
      return undefined;
    }

    // text 常与数字（如 id、数量）绑定，值允许为数字；错误建议仍按字符串给出
    if (fieldType === 'text' && isNumberValue(value)) {
      return undefined;
    }

    if (typeof value !== 'string') {
      return defaultMessage(
        message,
        `${value} 类型应为字符串`,
        typeExampleSuggestion(mForm, props, '"文本内容"', isStringValue),
      );
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
      return defaultMessage(
        message,
        `${value} 类型应为数字`,
        typeExampleSuggestion(mForm, props, '123', isNumberValue),
      );
    }
    return undefined;
  }

  if (fieldType === 'number-range') {
    if (
      !Array.isArray(value) ||
      value.length !== 2 ||
      value.some((item) => typeof item !== 'number' || Number.isNaN(item))
    ) {
      return defaultMessage(
        message,
        `${value} 类型应为长度为 2 的数字数组`,
        typeExampleSuggestion(mForm, props, '[0, 100]', isNumberRangeValue),
      );
    }
    return undefined;
  }

  if (fieldType === 'switch' || fieldType === 'checkbox') {
    const { activeValue, inactiveValue } = resolveToggleValues(config);
    if (!Object.is(value, activeValue) && !Object.is(value, inactiveValue)) {
      return defaultMessage(message, `${value} 不在合法开关值中`, toggleSuggestion(activeValue, inactiveValue));
    }
    return undefined;
  }

  if (fieldType === 'select') {
    const optionValues = flattenSelectOptions(resolveOptions(props));
    return validateSelectValue(value, config, optionValues, message);
  }

  if (fieldType === 'radio-group') {
    const optionValues = flattenSelectOptions(resolveOptions(props));

    if (optionValues.length === 0) {
      return undefined;
    }

    if (!includesOptionValue(optionValues, value)) {
      return defaultMessage(message, `${value} 不在可选项中`, optionSuggestion(optionValues));
    }
    return undefined;
  }

  if (fieldType === 'checkbox-group') {
    const optionValues = flattenSelectOptions(resolveOptions(props));

    if (optionValues.length === 0) {
      return undefined;
    }

    if (!Array.isArray(value)) {
      return defaultMessage(
        message,
        `${value} 类型应为数组`,
        optionExampleSuggestion(optionValues, '["选项1", "选项2"]', true),
      );
    }
    if (value.some((item) => !includesOptionValue(optionValues, item))) {
      return defaultMessage(message, `${value} 不在可选项中`, optionSuggestion(optionValues));
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
        dateRangeSuggestion(valueFormat),
      );
    }
    return undefined;
  }

  if (fieldType === 'table' || fieldType === 'group-list' || fieldType === 'grouplist') {
    if (!Array.isArray(value) || value.some((item) => !isObjectValue(item))) {
      return defaultMessage(
        message,
        `${value} 类型应为对象数组`,
        typeExampleSuggestion(mForm, props, '[{}]', isObjectArrayValue),
      );
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

  if (!props.config?.name) {
    return undefined;
  }

  const rawFieldType = 'type' in (props.config || {}) ? props.config.type : '';
  if (typeof rawFieldType !== 'string' || !rawFieldType) {
    return undefined;
  }

  // 统一将驼峰形式（如 radioGroup）归一化为连字符形式（radio-group），与内置规则的 key 保持一致
  const fieldType = toLine(rawFieldType);

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
    try {
      const error = validateTypeMatch(actualValue, mForm, props, rule.message);

      if (error) {
        callback(new Error(error));
        return;
      }
    } catch (error) {
      console.error(error);
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
