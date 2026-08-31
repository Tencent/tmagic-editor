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

// #region FieldInnerConfig
/** innerConfig 回调的入参：字段自身的配置、所在层级的 model、完整字段路径与表单状态 */
export interface FieldInnerConfigContext {
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

/** innerConfig 回调的返回值：需要继续遍历的内部配置及其 model / prop 基准 */
export interface FieldInnerConfigResult {
  /** 内部配置（对应字段组件内部渲染的 `MContainer` 的 `config`） */
  config: FormItemConfig | FormItemConfig[];
  /**
   * 内部配置对应的 model 切片，默认沿用字段所在层级的 `model`。
   *
   * 例如 `code-select` 内部是 `:model="model[name]"`，就应返回 `model[config.name]`。
   */
  model?: FormValue;
  /**
   * 内部配置对应的 prop 基准，默认沿用字段自身的 `prop`。
   *
   * 返回的 config 的 `name` 会被追加到这个基准上。所以当内部配置复用了字段自身的 `name`
   * （如 `display-conds` 内部的 group-list 就叫 `props.name`）时，要返回 `parentProp`，
   * 否则 name 会被拼两次。
   */
  prop?: string;
}

/**
 * 复合字段的内部配置回调。
 *
 * 有一类字段组件会在自身内部再渲染 `MContainer` 并传入组件内部临时算出来的 config
 * （如编辑器的 `code-select` / `event-select` / `style-setter`），这些内部字段同样会向
 * 父级表单注册 FormItem、参与父表单校验。无渲染校验（`validateValues`）只遍历调用方
 * 传入的 config 树，看不到这些运行期才产生的配置，因此需要字段作者通过
 * `registerField(type, { innerConfig })` 把内部配置交出来。
 *
 * 返回 `null` / `undefined` 表示该字段本次没有内部配置（例如某些分支下不渲染子表单）。
 *
 * 既未登记 innerConfig、也不在叶子字段表里的 type：配置里有 `items` 会下钻子项，
 * 自身有 `rules` 会校验自身。
 */
export type FieldInnerConfig = (_ctx: FieldInnerConfigContext) => FieldInnerConfigResult | null | undefined | void;
// #endregion FieldInnerConfig

/** 内置内部配置（由 `registerBuiltInFields` 写入；`clearFields` 不会清掉） */
const builtInInnerConfigs = new Map<string, FieldInnerConfig>();
/** 业务侧登记的内部配置 */
const extraInnerConfigs = new Map<string, FieldInnerConfig>();

/**
 * 登记复合字段的内部配置：无渲染校验遇到该 type 时，用返回值继续遍历内部字段。
 *
 * `type` 会按 Container 的规则归一化为中划线形式（`codeSelect` 与 `code-select` 等价）。
 * 重复登记以最后一次为准，便于业务侧覆盖内置实现。
 * `builtIn` 登记不受 `deleteFieldInnerConfig` / `clearFieldInnerConfigs` 影响。
 *
 * @param type - 字段 type
 * @param resolve - innerConfig 回调
 * @param [builtIn=false] - 是否写入内置表
 */
export const registerFieldInnerConfig = (type: string, resolve: FieldInnerConfig, builtIn = false): void => {
  if (typeof type !== 'string' || !type || typeof resolve !== 'function') return;
  (builtIn ? builtInInnerConfigs : extraInnerConfigs).set(toLine(type), resolve);
};

/**
 * 获取指定 type 的 innerConfig 回调（业务侧优先于内置）。
 *
 * @param type - 字段 type
 * @returns innerConfig 回调；未登记则为 `undefined`
 */
export const getFieldInnerConfig = (type: string): FieldInnerConfig | undefined => {
  const key = toLine(type);
  return extraInnerConfigs.get(key) ?? builtInInnerConfigs.get(key);
};

/**
 * 是否已登记指定 type 的 innerConfig（内置 ∪ 已登记）。
 *
 * @param type - 字段 type
 * @returns 是否已登记
 */
export const hasFieldInnerConfig = (type: string): boolean => {
  const key = toLine(type);
  return extraInnerConfigs.has(key) || builtInInnerConfigs.has(key);
};

/**
 * 删除业务侧登记的 innerConfig（不影响内置）。
 *
 * @param type - 字段 type
 * @returns 是否删除成功
 */
export const deleteFieldInnerConfig = (type: string): boolean => extraInnerConfigs.delete(toLine(type));

/** 清空业务侧登记的 innerConfig（不影响内置；主要用于单测）。 */
export const clearFieldInnerConfigs = (): void => extraInnerConfigs.clear();
