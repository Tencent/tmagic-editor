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

export const style2Obj = (style: string) => {
  if (typeof style !== 'string') {
    return style;
  }

  const obj: Record<string, any> = {};
  style.split(';').forEach((element) => {
    if (!element) {
      return;
    }

    const items = element.split(':');

    let key = items.shift();
    let value = items.join(':');

    if (!key) return;

    key = key.replace(/^\s*/, '').replace(/\s*$/, '');
    value = value.replace(/^\s*/, '').replace(/\s*$/, '');

    key = key
      .split('-')
      .map((v, i) => (i > 0 ? `${v[0].toUpperCase()}${v.substr(1)}` : v))
      .join('');

    obj[key] = value;
  });
  return obj;
};

export const fillBackgroundImage = (value: string) => {
  if (value && !/^url/.test(value) && !/^linear-gradient/.test(value)) {
    return `url(${value})`;
  }
  return value;
};

export const isNumber = (value: string) => /^(-?\d+)(\.\d+)?$/.test(value);
