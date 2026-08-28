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

import { toLine } from '@tmagic/utils';

import type { FormItemConfig, FormState, FormValue } from '../schema';

// #region FieldNestedConfig
/** 嵌套配置回调的入参：字段自身的配置、所在层级的 model、完整字段路径与表单状态 */
export interface FieldNestedConfigContext {
  /** 字段自身的配置（已经过 filterFunction 之外的原样配置） */
  config: FormItemConfig;
  /** 字段所在层级的 model 切片 */
  model: FormValue;
  /** 字段的完整 prop 路径（含父级前缀），即字段组件拿到的 `props.prop` */
  prop: string;
  /** 字段所在层级的 prop 基准（父级 Container 的 `props.prop`），即 `prop` 去掉自身 name 的部分 */
  parentProp: string;
  /** 表单状态 */
  mForm: FormState | undefined;
}

/** 嵌套配置回调的返回值：需要继续遍历的嵌套配置及其 model / prop 基准 */
export interface FieldNestedConfigResult {
  /** 嵌套配置（对应字段组件内部渲染的 `MContainer` 的 `config`） */
  config: FormItemConfig | FormItemConfig[];
  /**
   * 嵌套配置对应的 model 切片，默认沿用字段所在层级的 `model`。
   *
   * 例如 `code-select` 内部是 `:model="model[name]"`，就应返回 `model[config.name]`。
   */
  model?: FormValue;
  /**
   * 嵌套配置对应的 prop 基准，默认沿用字段自身的 `prop`。
   *
   * 返回的 config 的 `name` 会被追加到这个基准上。所以当嵌套配置复用了字段自身的 `name`
   * （如 `display-conds` 内部的 group-list 就叫 `props.name`）时，要返回 `parentProp`，
   * 否则 name 会被拼两次。
   */
  prop?: string;
}

/**
 * 复合字段的嵌套配置回调。
 *
 * 有一类字段组件会在自身内部再渲染 `MContainer` 并传入组件内部临时算出来的 config
 * （如编辑器的 `code-select` / `event-select` / `style-setter`），这些嵌套字段同样会向
 * 父级表单注册 FormItem、参与父表单校验。无渲染校验（`validateValues`）只遍历调用方
 * 传入的 config 树，看不到这些运行期才产生的配置，因此需要字段作者通过
 * `registerField(type, { nested })` 把内部配置交出来。
 *
 * 返回 `null` / `undefined` 表示该字段本次没有嵌套配置（例如某些分支下不渲染子表单）。
 *
 * 既未登记嵌套配置、也不在叶子字段表里的 type：配置里有 `items` 会下钻子项，
 * 自身有 `rules` 会校验自身。
 */
export type FieldNestedConfig = (_ctx: FieldNestedConfigContext) => FieldNestedConfigResult | null | undefined | void;
// #endregion FieldNestedConfig

/** 内置嵌套配置（由 `registerBuiltInFields` 写入；`clearFields` 不会清掉） */
const builtInNestedConfigs = new Map<string, FieldNestedConfig>();
/** 业务侧登记的嵌套配置 */
const extraNestedConfigs = new Map<string, FieldNestedConfig>();

/**
 * 登记复合字段的嵌套配置：无渲染校验遇到该 type 时，用返回值继续遍历内部字段。
 *
 * `type` 会按 Container 的规则归一化为中划线形式（`codeSelect` 与 `code-select` 等价）。
 * 重复登记以最后一次为准，便于业务侧覆盖内置实现。
 * `builtIn` 登记不受 `deleteFieldNestedConfig` / `clearFieldNestedConfigs` 影响。
 *
 * @param type - 字段 type
 * @param resolve - 嵌套配置回调
 * @param [builtIn=false] - 是否写入内置表
 */
export const registerFieldNestedConfig = (type: string, resolve: FieldNestedConfig, builtIn = false): void => {
  if (typeof type !== 'string' || !type || typeof resolve !== 'function') return;
  (builtIn ? builtInNestedConfigs : extraNestedConfigs).set(toLine(type), resolve);
};

/**
 * 获取指定 type 的嵌套配置回调（业务侧优先于内置）。
 *
 * @param type - 字段 type
 * @returns 嵌套配置回调；未登记则为 `undefined`
 */
export const getFieldNestedConfig = (type: string): FieldNestedConfig | undefined => {
  const key = toLine(type);
  return extraNestedConfigs.get(key) ?? builtInNestedConfigs.get(key);
};

/**
 * 是否已登记指定 type 的嵌套配置（内置 ∪ 已登记）。
 *
 * @param type - 字段 type
 * @returns 是否已登记
 */
export const hasFieldNestedConfig = (type: string): boolean => {
  const key = toLine(type);
  return extraNestedConfigs.has(key) || builtInNestedConfigs.has(key);
};

/**
 * 删除业务侧登记的嵌套配置（不影响内置）。
 *
 * @param type - 字段 type
 * @returns 是否删除成功
 */
export const deleteFieldNestedConfig = (type: string): boolean => extraNestedConfigs.delete(toLine(type));

/** 清空业务侧登记的嵌套配置（不影响内置；主要用于单测）。 */
export const clearFieldNestedConfigs = (): void => extraNestedConfigs.clear();
