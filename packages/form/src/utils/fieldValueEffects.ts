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
 * @fileoverview 叶子字段登记表：哪些 type 是叶子，以及该字段对表单值的初始化写入。
 *
 * 无渲染校验据此判定该 type 没有属于父表单的嵌套字段。
 * 业务自定义字段通过 `registerField` / `registerFields` 登记。
 * 内置叶子字段由 `MagicForm.install` 的 `registerBuiltInFields` 写入。
 * 未登记且没有 innerConfig 的 type：有 `items` 会下钻子项，自身有 `rules` 会校验自身。
 *
 * 这里只是登记表。各字段的 effect 写在对应组件同目录的 `fields/<Field>/effect.ts`，
 * 执行收口在 `collectFields` 的 `applyMountValueEffects`：渲染（`Form.vue`）
 * 与无渲染（`validateValues`）都在表单值初始化完成后调用它一次，
 * 字段组件自身不再在 setup 里改写 model。
 *
 * @module fieldValueEffects
 */

import { toLine } from '@tmagic/utils';

import type { FormItemConfig, FormState, FormValue } from '../schema';

// #region FieldMountValueEffect
/** effect 的入参：字段自身的配置、所在层级的 model、完整字段路径、表单值根对象与表单状态 */
export interface FieldMountValueEffectContext {
  /** 字段自身的配置 */
  config: FormItemConfig;
  /** 字段所在层级的 model 切片 */
  model: FormValue;
  /** 字段的完整 prop 路径（含父级前缀），对应 Container 的 `itemProp` */
  prop: string;
  /**
   * 本次处理的表单值根对象，`prop` 即以它为根。
   *
   * 需要按路径跨层级写值时用它，不要用 `mForm.values`：对比模式下处理的是 lastValues 那一份，
   * tab / table 新增行处理的则是还没挂到表单上的一行值，两者都与 `mForm.values` 不是同一个对象。
   */
  values: FormValue;
  /** 表单状态 */
  mForm: FormState | undefined;
}

/**
 * 字段对表单值的初始化写入（如 `display` 的 `initValue`、`date` 的格式归一化）。
 *
 * 由 `applyMountValueEffects` 在表单值初始化完成后统一执行一次，渲染与无渲染共用。
 * 因为可能对同一份值重复执行（如 `initValues` 变化后重新初始化），实现必须幂等。
 */
export type FieldMountValueEffect = (_ctx: FieldMountValueEffectContext) => void;
// #endregion FieldMountValueEffect

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
