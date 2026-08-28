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

import type { App, Component } from 'vue';

import { toLine } from '@tmagic/utils';

import {
  clearContainerWalkers,
  type ContainerWalker,
  deleteContainerWalker,
  registerContainerWalker,
} from './collectFields';
import {
  clearFieldNestedConfigs,
  deleteFieldNestedConfig,
  type FieldNestedConfig,
  registerFieldNestedConfig,
} from './fieldNestedConfig';
import {
  clearLeafFieldTypes,
  deleteLeafFieldType,
  type FieldMountValueEffect,
  registerLeafFieldType,
} from './fieldValueEffects';
import { clearTypeMatchRules, deleteTypeMatchRule, registerTypeMatchRule, type TypeMatchValidator } from './typeMatch';

// #region FieldOptions
/**
 * 自定义字段 type 的登记项。
 *
 * 不传或只传空对象：当作叶子，不再下钻 `items`。
 */
export interface FieldOptions {
  /**
   * 渲染用的 Vue 组件，写入字段注册表。
   * 传入 `app` 时同时 `app.component('m-fields-*')`。
   */
  component?: Component;
  /**
   * 容器组件，写入字段注册表。
   * 传入 `app` 时同时 `app.component('m-form-*')`。
   */
  container?: Component;
  /** 叶子字段挂载时改写 model 的副作用。 */
  effect?: FieldMountValueEffect;
  /**
   * 按容器模板遍历（tab / table 等）。
   * 与 `nested` / `effect` 同时传入时 `walk` 优先。
   */
  walk?: ContainerWalker;
  /**
   * 把内部会挂到父表单的配置交出来。
   * 与 `effect` 同时传入时 `effect` 被忽略。
   */
  nested?: FieldNestedConfig;
  /** 该 type 的 typeMatch 校验；可与叶子、walk 或 nested 同时登记。 */
  typeMatch?: TypeMatchValidator;
}

/**
 * 无渲染校验用的登记项，不含 Vue 组件。
 *
 * 给 Node / `validateForm` / `submitForm` 用。
 */
export type HeadlessFieldOptions = Omit<FieldOptions, 'component' | 'container'>;
// #endregion FieldOptions

const extraComponents = new Map<string, Component>();
const builtInComponents = new Map<string, Component>();

const applyVueComponent = (
  type: string,
  component: Component,
  app: App | undefined,
  builtIn: boolean,
  kind: 'fields' | 'form',
): void => {
  const key = toLine(type);
  if (builtIn) {
    builtInComponents.set(key, component);
  } else {
    extraComponents.set(key, component);
  }
  app?.component(`m-${kind}-${key}`, component);
};

/**
 * 把已登记字段的 Vue 组件写入注册表；传入 `app` 时同时挂 `m-fields-*` / `m-form-*`。
 *
 * @param fields - 字段登记表
 * @param [app] - Vue 应用；省略则只写入注册表
 * @param [builtIn=false] - 是否写入内置表（`clearFields` 不会清掉）
 */
export const bindFieldApp = (fields: Record<string, FieldOptions>, app?: App, builtIn = false): void => {
  for (const [type, options] of Object.entries(fields)) {
    if (options?.component) {
      applyVueComponent(type, options.component, app, builtIn, 'fields');
    }
    if (options?.container) {
      applyVueComponent(type, options.container, app, builtIn, 'form');
    }
  }
};

/**
 * 把多份字段登记表按 type 浅合并。后一份只覆盖自己带了的 key，未出现的 key 保留前一份。
 *
 * 安装插件时用：Node 侧只登记 `headless`，浏览器再补 `component` / `container`。
 *
 * @param tables - 待合并的登记表，`undefined` 会被跳过
 * @returns 合并后的登记表
 */
export const mergeFieldOptions = (
  ...tables: Array<Record<string, HeadlessFieldOptions | FieldOptions> | undefined>
): Record<string, FieldOptions> => {
  const result: Record<string, FieldOptions> = {};
  for (const table of tables) {
    if (!table) continue;
    for (const [type, options] of Object.entries(table)) {
      result[type] = { ...result[type], ...pickDefinedFieldOptions(options) };
    }
  }
  return result;
};

const FIELD_OPTION_KEYS = ['component', 'container', 'effect', 'walk', 'nested', 'typeMatch'] as const;

const pickDefinedFieldOptions = (options?: FieldOptions): FieldOptions => {
  if (!options) return {};
  const next: FieldOptions = {};
  for (const key of FIELD_OPTION_KEYS) {
    if (options[key] !== undefined) {
      (next as any)[key] = options[key];
    }
  }
  return next;
};

const extraFieldOptions = new Map<string, FieldOptions>();
const builtInFieldOptions = new Map<string, FieldOptions>();

const removeFormComponent = (type: string): void => {
  extraComponents.delete(toLine(type));
};

const clearFormComponents = (): void => {
  extraComponents.clear();
};

/**
 * 按字段 type 取已登记的渲染组件（`codeSelect` 与 `code-select` 等价）。
 *
 * @param type - 字段 type
 * @returns 已登记的 Vue 组件；未登记则为 `undefined`
 */
export const getField = (type: string): Component | undefined => {
  const key = toLine(type);
  return extraComponents.get(key) ?? builtInComponents.get(key);
};

const registerFieldImpl = (type: string, options: FieldOptions | undefined, app: App | undefined, builtIn: boolean) => {
  if (typeof type !== 'string' || !type) return;

  const key = toLine(type);
  const store = builtIn ? builtInFieldOptions : extraFieldOptions;
  const incoming = pickDefinedFieldOptions(options);
  const merged: FieldOptions = { ...store.get(key), ...incoming };
  store.set(key, merged);

  if (incoming.walk && (incoming.nested || typeof incoming.effect === 'function')) {
    console.warn(
      `[MForm] registerField("${key}"): walk is set together with nested/effect; ` +
        'headless validation will use walk and nested/effect will be ignored.',
    );
  } else if (incoming.nested && typeof incoming.effect === 'function') {
    console.warn(
      `[MForm] registerField("${key}"): nested and effect are both set; ` +
        'headless validation will use nested and the mount value effect will be ignored.',
    );
  }

  if (incoming.component && incoming.container) {
    console.warn(
      `[MForm] registerField("${key}"): component and container are both set; ` +
        'getField will use container, and both m-fields-* / m-form-* will be registered.',
    );
  }

  if (merged.component) {
    applyVueComponent(type, merged.component, app, builtIn, 'fields');
  }

  if (merged.container) {
    applyVueComponent(type, merged.container, app, builtIn, 'form');
  }

  if (merged.typeMatch) {
    registerTypeMatchRule(type, merged.typeMatch, builtIn);
  }

  if (merged.walk) {
    registerContainerWalker(type, merged.walk, builtIn);
    if (!builtIn) {
      deleteLeafFieldType(type);
      deleteFieldNestedConfig(type);
    }
    return;
  }

  if (!builtIn) {
    deleteContainerWalker(type);
  }

  if (merged.nested) {
    if (!builtIn) deleteLeafFieldType(type);
    registerFieldNestedConfig(type, merged.nested, builtIn);
    return;
  }

  // 只登记了容器组件：不当叶子，dispatch 会按 items 下钻
  if (merged.container && !merged.component && typeof merged.effect !== 'function') {
    if (!builtIn) deleteLeafFieldType(type);
    return;
  }

  if (!builtIn) {
    deleteFieldNestedConfig(type);
  }
  registerLeafFieldType(type, merged.effect, builtIn);
};

/**
 * 登记一个字段 type 在无渲染校验里的行为，以及可选的渲染组件。
 *
 * `type` 会按 Container 的规则归一化为中划线形式（`codeSelect` 与 `code-select` 等价）。
 * 对同一 type 重复登记按字段浅合并：后一次只覆盖自己传入的 key，未传入的 key 保留。
 * 传入 `app` 且带了 `component` / `container` 时，会同步 `app.component('m-fields-*'` / `'m-form-*')`。
 *
 * @param type - 字段 type
 * @param [options] - 登记项；省略或空对象视为叶子
 * @param [app] - Vue 应用；省略则不调用 `app.component`
 */
export const registerField = (type: string, options?: FieldOptions, app?: App): void => {
  registerFieldImpl(type, options, app, false);
};

/**
 * 批量登记字段。
 *
 * @param fields - type 到登记项的映射
 * @param [app] - Vue 应用；省略则不调用 `app.component`
 */
export const registerFields = (fields: Record<string, FieldOptions>, app?: App): void => {
  for (const [type, options] of Object.entries(fields)) {
    registerFieldImpl(type, options, app, false);
  }
};

/**
 * 登记内置字段（`clearFields` / `unregisterField` 不会清掉）。
 *
 * @param fields - type 到登记项的映射
 * @param [app] - Vue 应用；省略则不调用 `app.component`
 */
export const registerBuiltInFields = (fields: Record<string, FieldOptions>, app?: App): void => {
  for (const [type, options] of Object.entries(fields)) {
    registerFieldImpl(type, options, app, true);
  }
};

/**
 * 删除业务侧对指定 type 的登记（不影响内置；主要用于单测）。
 *
 * @param type - 字段 type
 */
export const unregisterField = (type: string): void => {
  extraFieldOptions.delete(toLine(type));
  deleteLeafFieldType(type);
  deleteFieldNestedConfig(type);
  deleteTypeMatchRule(type);
  deleteContainerWalker(type);
  removeFormComponent(type);
};

/** 清空业务侧登记（不影响内置；主要用于单测）。 */
export const clearFields = (): void => {
  extraFieldOptions.clear();
  clearLeafFieldTypes();
  clearFieldNestedConfigs();
  clearTypeMatchRules();
  clearContainerWalkers();
  clearFormComponents();
};
