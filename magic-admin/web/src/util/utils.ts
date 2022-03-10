/*
 * Tencent is pleased to support the open source community by making MagicEditor available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
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

import momentTimezone from 'moment-timezone';
import serialize from 'serialize-javascript';

import { EditorInfo } from '@src/typings';

export const datetimeFormatter = function (v: string | number | Date): string {
  if (v) {
    let time = null;
    time = momentHandler(v);
    // 格式化为北京时间
    if (time !== 'Invalid date') {
      return time;
    }
    return '-';
  }
  return '-';
};
const momentHandler = (v: string | number | Date) =>
  momentTimezone.tz(v, 'Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss');

export const serializeConfig = function (value: EditorInfo): string {
  return serialize(value, {
    space: 2,
    unsafe: true,
  }).replace(/"(\w+)":\s/g, '$1: ');
};
