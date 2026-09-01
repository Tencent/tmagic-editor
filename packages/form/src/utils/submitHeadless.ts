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

import type { AppContext } from 'vue';
import { cloneDeep } from 'lodash-es';

import type { ChangeRecord, FormConfig, FormContext } from '../schema';

import { validateValues, type ValidateValuesResult } from './validateValues';

// #region SubmitFormOptions
/**
 * submitForm 函数参数（与 Form.vue 组件 props 对齐）
 */
export interface SubmitFormOptions {
  /** 表单配置 */
  config: FormConfig;
  /** 表单初始值 */
  initValues?: Record<string, any>;
  /** 需对比的值（开启对比模式时传入） */
  lastValues?: Record<string, any>;
  /** 是否开启对比模式 */
  isCompare?: boolean;
  parentValues?: Record<string, any>;
  labelWidth?: string;
  disabled?: boolean;
  height?: string;
  stepActive?: string | number;
  size?: 'small' | 'default' | 'large';
  inline?: boolean;
  labelPosition?: 'top' | 'left' | 'right';
  keyProp?: string;
  popperClass?: string;
  preventSubmitDefault?: boolean;
  /**
   * 表单校验失败时，错误提示前缀是否使用字段的 text 文案（通过 `getTextByName` 从 config 中查找）。
   * 默认 `true`，置为 `false` 时直接使用字段 name。
   */
  useFieldTextInError?: boolean;
  /** 宿主业务上下文，与 MForm 的同名 prop 语义一致 */
  context?: FormContext;
  /** 透传给 Form.submitForm 的参数：是否直接返回原始响应式 values */
  native?: boolean;
  /**
   * 是否在 resolve 结果中携带 changeRecords（变更记录）。
   * 开启后 resolve 的结果为 `{ values, changeRecords }`，否则仅 resolve values。
   */
  returnChangeRecords?: boolean;
  /**
   * 父级应用上下文，用于继承全局组件、指令、provide 等。
   * 仅 `dialog: true` 时生效。`@tmagic/form/headless` 不支持弹层。
   */
  appContext?: AppContext | null;
  /**
   * 是否以弹层展示表单。默认 `false`。
   *
   * `@tmagic/form/headless` 不支持 `dialog: true`，请从 `@tmagic/form` 引入。
   */
  dialog?: boolean;
  /**
   * 弹层标题，仅 `dialog: true` 时生效。
   */
  title?: string;
  typeMatchValid?: boolean;
  /**
   * 外部中断信号。abort 时会立即以 `signal.reason` reject。
   */
  signal?: AbortSignal;
}
// #endregion SubmitFormOptions

// #region SubmitFormResult
/**
 * 开启 `returnChangeRecords` 时 submitForm 的返回结果
 */
export interface SubmitFormResult {
  /** 校验通过后的表单值 */
  values: any;
  /** 表单变更记录 */
  changeRecords: ChangeRecord[];
}
// #endregion SubmitFormResult

// #region ValidateFormOptions
/**
 * validateForm 函数参数（与 Form.vue 组件 props 对齐，取校验所需子集）
 */
export interface ValidateFormOptions {
  /** 表单配置 */
  config: FormConfig;
  /** 待校验的表单值 */
  initValues?: Record<string, any>;
  parentValues?: Record<string, any>;
  labelWidth?: string;
  keyProp?: string;
  /**
   * 校验失败时，错误提示前缀是否使用字段的 text 文案（通过 `getTextByName` 从 config 中查找）。
   * 默认 `true`，置为 `false` 时直接使用字段 name。
   */
  useFieldTextInError?: boolean;
  /** 宿主业务上下文，与 MForm 的同名 prop 语义一致 */
  context?: FormContext;
  /**
   * 父级应用上下文。仅 `dialog: true` 时生效。`@tmagic/form/headless` 不支持弹层。
   */
  appContext?: AppContext | null;
  /**
   * 是否以弹层展示表单。默认 `false`。
   *
   * `@tmagic/form/headless` 不支持 `dialog: true`，请从 `@tmagic/form` 引入。
   */
  dialog?: boolean;
  /**
   * 弹层标题，仅 `dialog: true` 时生效。
   */
  title?: string;
  typeMatchValid?: boolean;
  /**
   * 外部中断信号。abort 时会立即以 `signal.reason` reject。
   */
  signal?: AbortSignal;
}
// #endregion ValidateFormOptions

const throwIfAborted = (signal: AbortSignal | undefined, fnName: string) => {
  if (signal?.aborted) {
    throw signal.reason ?? new Error(`${fnName} aborted`);
  }
};

const throwIfDialog = (dialog: boolean | undefined, fnName: string) => {
  if (dialog) {
    throw new Error(
      `[MForm] ${fnName}({ dialog: true }) is not available from @tmagic/form/headless. Import from @tmagic/form instead.`,
    );
  }
};

/**
 * `submitForm` 与 `validateForm` 共用的无渲染校验流程：中断检查 → `validateValues`。
 */
export const validateWithoutRender = async (
  fnName: 'submitForm' | 'validateForm',
  options: SubmitFormOptions | ValidateFormOptions,
): Promise<ValidateValuesResult> => {
  const { signal, config, initValues, parentValues, keyProp, typeMatchValid, useFieldTextInError, context } = options;

  throwIfAborted(signal, fnName);

  const result = await validateValues({
    config,
    initValues,
    parentValues,
    keyProp,
    popperClass: (options as SubmitFormOptions).popperClass,
    typeMatchValid,
    useFieldTextInError,
    context,
  });

  throwIfAborted(signal, fnName);

  return result;
};

/**
 * 以命令式方式对一份「表单配置 + 值」做一次校验并取回表单值（无渲染）。
 *
 * `@tmagic/form/headless` 不支持 `dialog: true`。
 */
export const submitForm = async (options: SubmitFormOptions): Promise<any> => {
  throwIfDialog(options.dialog, 'submitForm');

  const validated = await validateWithoutRender('submitForm', options);

  if (validated.error) throw new Error(validated.error);

  const values = options.native ? validated.values : cloneDeep(validated.values);
  return options.returnChangeRecords ? { values, changeRecords: [] as ChangeRecord[] } : values;
};

/**
 * 以命令式方式对一份「表单配置 + 值」做一次静默校验（无渲染）。
 *
 * `@tmagic/form/headless` 不支持 `dialog: true`。
 */
export const validateForm = async (options: ValidateFormOptions): Promise<string> => {
  throwIfDialog(options.dialog, 'validateForm');

  return (await validateWithoutRender('validateForm', options)).error;
};
