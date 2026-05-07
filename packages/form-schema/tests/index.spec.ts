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
import { describe, expect, test } from 'vitest';

import { defineFormConfig, defineFormItem } from '../src/index';

describe('defineFormConfig', () => {
  test('应该原样返回配置（identity 函数）', () => {
    const config = [
      {
        name: 'title',
        text: '标题',
        type: 'text',
      },
    ];
    const result = defineFormConfig(config as any);
    expect(result).toBe(config);
  });

  test('支持空数组', () => {
    const result = defineFormConfig([]);
    expect(result).toEqual([]);
  });

  test('保留嵌套结构', () => {
    const config = [
      {
        type: 'tab',
        items: [
          [
            {
              name: 'a',
              text: 'A',
              type: 'text',
            },
          ],
        ],
      },
    ];
    const result = defineFormConfig(config as any);
    expect(result).toEqual(config);
  });
});

describe('defineFormItem', () => {
  test('应该原样返回 item 配置（identity 函数）', () => {
    const item = {
      name: 'title',
      text: '标题',
      type: 'text',
    };
    const result = defineFormItem(item as any);
    expect(result).toBe(item);
  });

  test('支持包含函数字段', () => {
    const handler = () => 'hello';
    const item = {
      name: 'foo',
      text: 'Foo',
      type: 'text',
      onChange: handler,
    };
    const result = defineFormItem(item as any) as any;
    expect(result.onChange).toBe(handler);
  });
});
