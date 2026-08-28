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

/**
 * @fileoverview 叶子字段登记表：哪些 type 是叶子，以及挂载阶段对 model 的写入。
 *
 * 无渲染校验据此判定该 type 没有属于父表单的嵌套字段，并复刻组件 setup 阶段的写入。
 * 业务自定义字段通过 `registerField` / `registerFields` 登记。
 * 内置叶子字段由 `MagicForm.install` 的 `registerBuiltInFields` 写入。
 * 未登记且没有嵌套配置的 type：有 `items` 会下钻子项，自身有 `rules` 会校验自身。
 *
 * @module fieldValueEffects
 */

import { setValueByKeyPath, toLine } from '@tmagic/utils';

import type {
  DateConfig,
  DateTimeConfig,
  DisplayConfig,
  DynamicFieldConfig,
  FormItemConfig,
  FormState,
  FormValue,
} from '../schema';

import { getConfig } from './config';
import { datetimeFormatter } from './form';

/** `dynamic-field` 的 `returnFields` 返回的单个字段描述 */
type DynamicFieldItem = ReturnType<DynamicFieldConfig['returnFields']>[number];

// #region FieldMountValueEffect
/** mount effect 的入参：字段自身的配置、所在层级的 model、完整字段路径与表单状态 */
export interface FieldMountValueEffectContext {
  /** 字段自身的配置 */
  config: FormItemConfig;
  /** 字段所在层级的 model 切片 */
  model: FormValue;
  /** 字段的完整 prop 路径（含父级前缀），对应 Container 的 `itemProp` */
  prop: string;
  /** 表单状态 */
  mForm: FormState | undefined;
}

/**
 * 字段挂载时改写 model 的副作用。
 *
 * 无渲染校验遇到登记了 effect 的 type 时会调用它，以复刻组件 setup 阶段的写入。
 */
export type FieldMountValueEffect = (_ctx: FieldMountValueEffectContext) => void;
// #endregion FieldMountValueEffect

/**
 * `fields/Display.vue`：把 `initValue` 写入 model。
 *
 * @param config - 含 `initValue` 的字段配置
 * @param model - 所在层级的 model 切片
 * @param name - 字段 name
 */
export const applyDisplayInitValue = (
  config: Pick<DisplayConfig, 'initValue'>,
  model: FormValue | undefined,
  name: string,
): void => {
  if (config.initValue && model) {
    model[name] = config.initValue;
  }
};

/**
 * `fields/NumberRange.vue`：值不是数组时修正为空数组。
 *
 * @param model - 所在层级的 model 切片
 * @param name - 字段 name
 */
export const normalizeNumberRangeValue = (model: FormValue | undefined, name: string): void => {
  if (model && !Array.isArray(model[name])) {
    model[name] = [];
  }
};

/**
 * `fields/CheckboxGroup.vue`：空值初始化为空数组。
 *
 * @param model - 所在层级的 model 切片
 * @param name - 字段 name
 */
export const initCheckboxGroupValue = (model: FormValue | undefined, name: string): void => {
  if (model && !model[name]) {
    model[name] = [];
  }
};

/**
 * `fields/Date.vue`：按 `valueFormat` 归一化日期值。
 *
 * @param config - 含 `valueFormat` 的字段配置
 * @param model - 所在层级的 model 切片
 * @param name - 字段 name
 */
export const normalizeDateValue = (
  config: Pick<DateConfig, 'valueFormat'>,
  model: FormValue | undefined,
  name: string,
): void => {
  if (!model) return;

  model[name] = datetimeFormatter(model[name], '', config.valueFormat || 'YYYY/MM/DD');
};

/**
 * `fields/DateTime.vue`：按 `valueFormat` 归一化日期时间值，空值与非法值统一为空字符串。
 *
 * @param config - 含 `valueFormat` 的字段配置
 * @param model - 所在层级的 model 切片
 * @param name - 字段 name
 */
export const normalizeDateTimeValue = (
  config: Pick<DateTimeConfig, 'valueFormat'>,
  model: FormValue | undefined,
  name: string,
): void => {
  if (!model) return;

  const value = model[name]?.toString();

  if (!value || value === 'Invalid Date') {
    model[name] = '';
    return;
  }

  model[name] = datetimeFormatter(model[name], '', config.valueFormat || 'YYYY/MM/DD HH:mm:ss');
};

/**
 * `fields/DynamicField.vue`：遍历动态字段列表，按「原值为空且声明了 defaultValue 则取默认值」
 * 求出每个字段当前的值。
 *
 * `isDefaultApplied` 为真表示该值来自 `defaultValue`，需要写回表单值
 * （组件通过 emit change 写回，无渲染校验直接写 model）。
 *
 * @param fields - `returnFields` 返回的字段描述列表
 * @param model - 所在层级的 model 切片
 * @param onField - 每个字段的回调
 */
export const eachDynamicField = (
  fields: DynamicFieldItem[],
  model: FormValue | undefined,
  onField: (_field: DynamicFieldItem, _value: any, _isDefaultApplied: boolean) => void,
): void => {
  for (const field of fields) {
    if (typeof field !== 'object' || field?.name === undefined) continue;

    let value = model?.[field.name] || '';
    let isDefaultApplied = false;

    if (!value && field.defaultValue !== undefined) {
      value = field.defaultValue;
      isDefaultApplied = true;
    }

    onField(field, value, isDefaultApplied);
  }
};

export const displayEffect: FieldMountValueEffect = ({ config, model }) =>
  applyDisplayInitValue(config as DisplayConfig, model, (config as any).name);

export const numberRangeEffect: FieldMountValueEffect = ({ config, model }) =>
  normalizeNumberRangeValue(model, (config as any).name);

export const checkboxGroupEffect: FieldMountValueEffect = ({ config, model }) =>
  initCheckboxGroupValue(model, (config as any).name);

export const dateEffect: FieldMountValueEffect = ({ config, model }) =>
  normalizeDateValue(config as DateConfig, model, (config as any).name);

export const dateTimeEffect: FieldMountValueEffect = ({ config, model }) =>
  normalizeDateTimeValue(config as DateTimeConfig, model, (config as any).name);

export const dynamicFieldEffect: FieldMountValueEffect = ({ config, model, prop, mForm }) => {
  // 该组件读取的是同级 model，但写入走 Container 的 modifyKey 分支，落在 `${prop}.${key}`，
  // 这里保持与渲染一致（含这层不对称），避免两条链路产出不同的值。
  const { returnFields, dynamicKey } = config as DynamicFieldConfig;
  if (typeof returnFields !== 'function' || !model) return;
  if (model[dynamicKey] === '') return;

  const result = returnFields(config as DynamicFieldConfig, model, getConfig<Function>('request'));
  // 同步返回才能在校验前生效；异步 returnFields 与渲染式校验一样存在时序不确定性，此处不等待
  if (!result || typeof (result as any).then === 'function' || !Array.isArray(result)) return;

  eachDynamicField(result, model, (field, value, isDefaultApplied) => {
    if (isDefaultApplied) {
      setValueByKeyPath(`${prop}.${field.name}`, value, mForm?.values || model);
    }
  });
};

/** 内置叶子字段（由 `MagicForm.install` 写入；clearFields 不会清掉） */
const builtInLeafFieldTypes = new Set<string>();
const builtInMountValueEffects = new Map<string, FieldMountValueEffect>();

/** 业务侧登记的叶子字段与其挂载副作用 */
const extraLeafFieldTypes = new Set<string>();
const extraMountValueEffects = new Map<string, FieldMountValueEffect>();

/**
 * 登记一个叶子字段 type。由 `registerField` 调用，业务侧请走 `registerField`。
 *
 * 传了 `effect` 会覆盖该 type 已有的 extra effect（含覆盖内置）；不传则清掉 extra effect，
 * 内置 effect 仍生效。
 *
 * @param type - 字段 type
 * @param [effect] - 挂载时改写 model 的副作用
 * @param [builtIn=false] - 是否写入内置表
 */
export const registerLeafFieldType = (type: string, effect?: FieldMountValueEffect, builtIn = false): void => {
  if (typeof type !== 'string' || !type) return;

  const key = toLine(type);
  const types = builtIn ? builtInLeafFieldTypes : extraLeafFieldTypes;
  const effects = builtIn ? builtInMountValueEffects : extraMountValueEffects;

  types.add(key);

  if (typeof effect === 'function') {
    effects.set(key, effect);
  } else if (!builtIn) {
    effects.delete(key);
  }
};

/**
 * 是否为叶子字段 type（内置 ∪ 已登记）。
 *
 * @param type - 字段 type
 * @returns 是否为叶子
 */
export const isLeafFieldType = (type: string): boolean => {
  const key = toLine(type);
  return extraLeafFieldTypes.has(key) || builtInLeafFieldTypes.has(key);
};

/**
 * 获取指定 type 挂载时改写 model 的副作用（已登记的优先于内置）。
 *
 * @param type - 字段 type
 * @returns 副作用函数；未登记则为 `undefined`
 */
export const getFieldMountValueEffect = (type: string): FieldMountValueEffect | undefined => {
  const key = toLine(type);
  return extraMountValueEffects.get(key) ?? builtInMountValueEffects.get(key);
};

/**
 * 删除业务侧登记的叶子字段（不影响内置；主要用于单测）。
 *
 * @param type - 字段 type
 * @returns 是否删除成功
 */
export const deleteLeafFieldType = (type: string): boolean => {
  const key = toLine(type);
  extraMountValueEffects.delete(key);
  return extraLeafFieldTypes.delete(key);
};

/** 清空业务侧登记的叶子字段（不影响内置；主要用于单测）。 */
export const clearLeafFieldTypes = (): void => {
  extraLeafFieldTypes.clear();
  extraMountValueEffects.clear();
};
