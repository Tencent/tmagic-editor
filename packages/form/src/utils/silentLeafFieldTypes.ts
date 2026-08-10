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

/**
 * 可在静默校验模式下跳过渲染的内置叶子字段（默认集合）。
 *
 * 这些字段只渲染一个输入控件，内部没有嵌套 FormItem，且不会依赖组件挂载修改 model；
 * 字段值由初始化逻辑处理（包括 defaultValue），因此跳过不影响校验结果。
 *
 * 业务侧可通过 `registerSilentLeafFieldTypes` 追加已审计的安全自定义字段。
 */
export const LEAF_FIELD_TYPES: ReadonlySet<string> = new Set([
  'text',
  'textarea',
  'number',
  'time',
  'daterange',
  'timerange',
  'checkbox',
  'radio-group',
  'switch',
  'select',
  'cascader',
  'color-picker',
  'link',
]);

/** 业务侧追加的静默叶子字段（不含内置默认集合） */
const extraSilentLeafFieldTypes = new Set<string>();

/**
 * 注册可在静默校验中跳过渲染的叶子字段 type（追加到默认 `LEAF_FIELD_TYPES` 之上）。
 *
 * 仅应纳入「无嵌套 FormItem、无挂载值副作用」的字段；复合 / 动态子表单不可加入。
 */
export const registerSilentLeafFieldTypes = (types: Iterable<string>): void => {
  for (const type of types) {
    if (typeof type !== 'string' || !type) continue;
    extraSilentLeafFieldTypes.add(toLine(type));
  }
};

/** 当前生效的静默叶子字段集合：内置默认 ∪ 已注册扩展 */
export const getSilentLeafFieldTypes = (): ReadonlySet<string> => {
  if (extraSilentLeafFieldTypes.size === 0) {
    return LEAF_FIELD_TYPES;
  }
  return new Set([...LEAF_FIELD_TYPES, ...extraSilentLeafFieldTypes]);
};

/** 清空业务侧追加的静默叶子字段（不影响内置默认集合；主要用于单测） */
export const clearSilentLeafFieldTypes = (): void => {
  extraSilentLeafFieldTypes.clear();
};
