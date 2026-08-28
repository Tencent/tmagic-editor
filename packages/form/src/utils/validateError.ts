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

import type { FormConfig, ValidateError } from '../schema';

/**
 * 通过 name 从 config 中查找对应的 text
 *
 * @param name - 字段名，支持点分隔的路径格式，如 'a.b.c'
 * @param config - 表单配置数组
 * @returns 找到的 text 值，如果未找到则返回 undefined
 */
export const getTextByName = (name: string, config: FormConfig = []): string | undefined => {
  if (!name || !Array.isArray(config)) return undefined;

  const nameParts = name.split('.');

  const findInConfig = (configs: FormConfig, parts: string[]): string | undefined => {
    if (parts.length === 0) return undefined;

    const [currentPart, ...remainingParts] = parts;

    for (const item of configs) {
      if (item.name === currentPart) {
        if (remainingParts.length === 0) {
          return typeof item.text === 'string' ? item.text : undefined;
        }

        if ('items' in item && Array.isArray(item.items)) {
          const result = findInConfig(item.items, remainingParts);
          if (result !== undefined) return result;
        }
      }

      if ('items' in item && Array.isArray(item.items)) {
        const result = findInConfig(item.items, parts);
        if (result !== undefined) return result;
      }
    }

    return undefined;
  };

  return findInConfig(config, nameParts);
};

/**
 * 将校验返回的 invalidFields 汇总为可读的错误文案（多条以 `<br>` 拼接）。
 *
 * `useFieldTextInError` 为 `true`（默认）时用字段的 text 文案作为错误前缀，找不到则回退为字段 name。
 *
 * 由渲染式校验（Form.vue 的 `submitForm` / `validate`）与无渲染校验（`validateValues`）共用，
 * 保证两条校验链路产出的错误文案格式完全一致。
 *
 * @param invalidFields - async-validator 产出的字段错误表
 * @param [options] - 文案选项
 * @param [options.config] - 用于查找 text 的表单配置
 * @param [options.useFieldTextInError=true] - 错误前缀是否使用字段 text
 * @returns 拼接后的错误文案；无错误时为空串
 */
export const formatValidateError = (
  invalidFields: Record<string, any>,
  { config = [], useFieldTextInError = true }: { config?: FormConfig; useFieldTextInError?: boolean } = {},
): string => {
  const error: string[] = [];

  Object.entries(invalidFields).forEach(([prop, validateError]) => {
    (validateError as ValidateError[]).forEach(({ field, message }) => {
      const name = field || prop;
      const text = (useFieldTextInError ? getTextByName(name, config) : undefined) || name;

      error.push(`${text} -> ${message}`);
    });
  });

  return error.join('<br>');
};
