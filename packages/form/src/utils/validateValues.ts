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

import { computed, reactive } from 'vue';
import Schema from 'async-validator';

import type { FormConfig, FormState, FormValue } from '../schema';

import { type CollectedField, collectValidatableFields } from './collectFields';
import { applyExtendState, createFormStateBase, initValue } from './form';
import { formatValidateError } from './validateError';

// #region HeadlessFormStateOptions
/** 构造无渲染 formState 所需的参数（与 MForm 的同名 props 对齐） */
export interface HeadlessFormStateOptions {
  config: FormConfig;
  initValues?: FormValue;
  parentValues?: FormValue;
  keyProp?: string;
  popperClass?: string;
}
// #endregion HeadlessFormStateOptions

/**
 * 构造一个不依赖组件实例的 `formState`。
 *
 * 字段结构与 `Form.vue` 中 provide 给子树的 `mForm` 保持一致，使配置里的
 * `display` / `rules.validator` / `filter` 等回调拿到的上下文与渲染式校验相同。
 *
 * 差异：没有真实的表单实例，因此 `$emit` 为空实现、`fields` 注册表始终为空
 * （该注册表在整个仓库中只写不读，不参与校验）。
 */
export const createHeadlessFormState = (options: HeadlessFormStateOptions): FormState => {
  const state: FormState = {
    keyProp: options.keyProp ?? '__key',
    popperClass: options.popperClass ?? '',
    config: options.config,
    initValues: options.initValues ?? {},
    isCompare: false,
    lastValues: {},
    parentValues: options.parentValues ?? {},
    values: {},
    lastValuesProcessed: {},
    $emit: () => undefined,
    ...createFormStateBase(),
  };

  return reactive(state);
};

/**
 * 按 prop 路径从表单值中取字段值，路径中断时返回 `undefined`。
 *
 * 不复用 `@tmagic/utils` 的 `getValueByKeyPath`：后者在路径中断时抛错，
 * 而 Element Plus 的 FormItem 取值是宽松的（拿不到就是 `undefined`），此处与之对齐。
 */
const getFieldValue = (prop: string, values: FormValue): any => {
  if (!prop) return undefined;

  return prop.split('.').reduce<any>((acc, key) => {
    if (acc === null || typeof acc !== 'object') return undefined;
    return acc[key];
  }, values);
};

/**
 * 校验单个字段，返回 async-validator 的 `fields` 错误映射（通过则返回 `null`）。
 *
 * 与 Element Plus 的 FormItem 逐字段校验保持一致：
 * 每个字段独立构造一个 `Schema({ [prop]: rules })`，以字段自身的值为 source，
 * 并开启 `firstFields` 只取每个字段的首条错误；`trigger` 是 FormItem 用来筛选规则的
 * 元信息，交给 async-validator 前必须剔除，否则会改变规则的匹配方式。
 */
const validateField = async (field: CollectedField, values: FormValue): Promise<Record<string, any> | null> => {
  const rules = field.rules.map(({ trigger, ...rule }: any) => rule);
  if (!rules.length) return null;

  const value = getFieldValue(field.prop, values);

  try {
    await new Schema({ [field.prop]: rules } as any).validate({ [field.prop]: value }, { firstFields: true });
    return null;
  } catch (err: any) {
    // async-validator reject 的形态为 { errors, fields }
    if (err?.fields) return err.fields;
    return { [field.prop]: [{ field: field.prop, message: err?.message ?? `${err}` }] };
  }
};

// #region ValidateValuesOptions
/** `validateValues` 参数 */
export interface ValidateValuesOptions extends HeadlessFormStateOptions {
  /** 是否开启类型匹配校验 */
  typeMatchValid?: boolean;
  /**
   * 校验失败时错误提示前缀是否使用字段的 text 文案。默认 `true`。
   */
  useFieldTextInError?: boolean;
  /** 扩展 formState，与 MForm 的同名 prop 语义一致（只能新增字段，不能覆盖内置字段） */
  extendState?: (_state: FormState) => Record<string, any> | Promise<Record<string, any>>;
}
// #endregion ValidateValuesOptions

// #region ValidateValuesResult
/** `validateValues` 结果 */
export interface ValidateValuesResult {
  /** 经 `initValue` 初始化并复刻挂载副作用后的表单值 */
  values: FormValue;
  /** 汇总后的错误文案（多条以 `<br>` 拼接），校验通过为空字符串 */
  error: string;
  /** 原始错误映射，形如 `{ [prop]: [{ field, message }] }` */
  invalidFields: Record<string, any>;
}
// #endregion ValidateValuesResult

/**
 * 不挂载任何组件，纯逻辑地对「一份 config + 一份值」执行一次完整校验。
 *
 * 流程与渲染式校验一一对应，但不需要 DOM，也不会实例化任何字段组件：
 *
 * 1. 构造 headless `formState` 并合并 `extendState`；
 * 2. `initValue` 初始化表单值（默认值、嵌套结构、`onInitValue` 等）；
 * 3. 遍历 config 树收集所有带规则的字段（等价于渲染出的 FormItem 集合）；
 * 4. 逐字段交给 async-validator 执行，汇总错误文案。
 *
 * @example
 * ```ts
 * const { error, values } = await validateValues({
 *   config: [...],
 *   initValues: { name: '' },
 *   typeMatchValid: true,
 * });
 * ```
 */
export const validateValues = async (options: ValidateValuesOptions): Promise<ValidateValuesResult> => {
  const { config, initValues = {}, typeMatchValid, useFieldTextInError = true, extendState } = options;

  const formState = createHeadlessFormState(options);

  // formState 的内置 key 快照：extendState 只能新增字段，不能覆盖这些字段，与 Form.vue 语义一致
  const reservedStateKeys = new Set<string | symbol>(Reflect.ownKeys(formState));

  if (typeof extendState === 'function') {
    try {
      applyExtendState(formState, await extendState(formState), reservedStateKeys);
    } catch (e) {
      console.error('[MForm] extendState failed:', e);
    }
  }

  const values = await initValue(formState, { initValues, config });
  formState.values = values;

  const fields = collectValidatableFields(
    formState,
    config,
    values,
    computed(() => Boolean(typeMatchValid)),
  );

  const invalidFields: Record<string, any> = {};
  for (const field of fields) {
    const fieldErrors = await validateField(field, values);
    if (fieldErrors) {
      Object.assign(invalidFields, fieldErrors);
    }
  }

  return {
    values,
    invalidFields,
    error: formatValidateError(invalidFields, { config, useFieldTextInError }),
  };
};
