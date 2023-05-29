/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2023 THL A29 Limited, a Tencent company.  All rights reserved.
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

import type { DataSchema } from '@tmagic/schema';

export const getDefaultValueFromFields = (fields: DataSchema[]) => {
  const data: Record<string, any> = {};

  const defaultValue: Record<string, any> = {
    string: '',
    object: {},
    array: [],
    boolean: false,
    number: 0,
    null: null,
    any: undefined,
  };

  fields.forEach((field) => {
    if (typeof field.defaultValue !== 'undefined') {
      data[field.name] = field.defaultValue;
    } else if (field.type === 'object') {
      data[field.name] = field.fields ? getDefaultValueFromFields(field.fields) : {};
    } else if (field.type) {
      data[field.name] = defaultValue[field.type];
    } else {
      data[field.name] = undefined;
    }
  });
  return data;
};
