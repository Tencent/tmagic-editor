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

import type { DateTimeConfig } from '@form/schema';
import type { FieldMountValueEffect } from '@form/utils/fieldValueEffects';
import { datetimeFormatter } from '@form/utils/form';

/** 按 `valueFormat` 归一化日期时间值，空值与非法值统一为空字符串。 */
export const effect: FieldMountValueEffect = ({ config, model }) => {
  if (!model) return;

  const { name, valueFormat } = config as DateTimeConfig & { name: string };
  const value = model[name]?.toString();

  if (!value || value === 'Invalid Date') {
    model[name] = '';
    return;
  }

  model[name] = datetimeFormatter(model[name], '', valueFormat || 'YYYY/MM/DD HH:mm:ss');
};
