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

import { setValueByKeyPath } from '@tmagic/utils';

import type { DynamicFieldConfig, FormValue } from '@form/schema';
import { getConfig } from '@form/utils/config';
import type { FieldMountValueEffect } from '@form/utils/fieldValueEffects';

/** `dynamic-field` 的 `returnFields` 返回的单个字段描述 */
type DynamicFieldItem = ReturnType<DynamicFieldConfig['returnFields']>[number];

/**
 * 遍历动态字段列表，按「原值为空且声明了 defaultValue 则取默认值」求出每个字段当前的值。
 *
 * `isDefaultApplied` 为真表示该值来自 `defaultValue`，需要写回表单值
 * （组件通过 emit change 写回，初始化写入直接写 `values`）。
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

/**
 * 同步 `returnFields` 的 defaultValue 按 prop 写入值根对象。
 *
 * 该组件读取的是同级 model，但写入走 Container 的 modifyKey 分支，落在 `${prop}.${key}`，
 * 这里保持与渲染一致（含这层不对称），避免两条链路产出不同的值。
 * 异步 returnFields 由组件挂载后的 watch 负责，此处不等待。
 */
export const effect: FieldMountValueEffect = ({ config, model, prop, values }) => {
  const { returnFields, dynamicKey } = config as DynamicFieldConfig;
  if (typeof returnFields !== 'function' || !model) return;
  if (model[dynamicKey] === '') return;

  const result = returnFields(config as DynamicFieldConfig, model, getConfig<Function>('request'));
  if (!result || typeof (result as any).then === 'function' || !Array.isArray(result)) return;

  eachDynamicField(result, model, (field, value, isDefaultApplied) => {
    if (isDefaultApplied) {
      setValueByKeyPath(`${prop}.${field.name}`, value, values || model);
    }
  });
};
