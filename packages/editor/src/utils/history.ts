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

import type { Id } from '@tmagic/core';

import type { StepDiffItem } from '@editor/type';

/**
 * 「回滚」生成的新 step 简短描述。代码块 / 数据源共用。
 * 二者逻辑一致，仅展示名取值字段不同（代码块取 `name`，数据源取 `title`），
 * 因此通过 `getLabel` 注入取值方式。
 *
 * @param id 关联的代码块 / 数据源 id
 * @param diff 单条变更 diff（缺省视为空）
 * @param getLabel 从快照取展示名
 */
export const describeRevertStep = <T extends object>(
  id: Id,
  { oldSchema, newSchema, changeRecords }: StepDiffItem<T> = {},
  getLabel: (schema: T) => string | undefined,
): string => {
  const labelOf = (schema: T) => getLabel(schema) || (schema as { id?: Id }).id;
  if (!oldSchema && newSchema) return `撤回新增 ${labelOf(newSchema) || id}`;
  if (oldSchema && !newSchema) return `还原已删除的 ${labelOf(oldSchema) || id}`;
  const label = (newSchema && getLabel(newSchema)) || (oldSchema && getLabel(oldSchema)) || `${id}`;
  const propPath = changeRecords?.[0]?.propPath;
  return propPath ? `还原 ${label} · ${propPath}` : `还原 ${label}`;
};
