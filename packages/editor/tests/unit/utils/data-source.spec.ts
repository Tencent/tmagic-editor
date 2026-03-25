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

import type { DataSchema, DataSourceSchema } from '@tmagic/core';

import { getCascaderOptionsFromFields, getFieldType } from '@editor/utils/data-source';

describe('getFieldType', () => {
  test('返回空字符串当ds为undefined', () => {
    const type = getFieldType(undefined, ['field1']);
    expect(type).toBe('');
  });

  test('返回空字符串当ds.fields为空', () => {
    const ds: DataSourceSchema = { id: 'ds1', type: 'base', fields: [], methods: [], events: [] };
    const type = getFieldType(ds, ['field1']);
    expect(type).toBe('');
  });

  test('返回空字符串当fieldNames为空数组', () => {
    const ds: DataSourceSchema = {
      id: 'ds1',
      type: 'base',
      fields: [{ name: 'field1', type: 'string' }],
      methods: [],
      events: [],
    };
    const type = getFieldType(ds, []);
    expect(type).toBe('');
  });

  test('返回一级字段类型', () => {
    const ds: DataSourceSchema = {
      id: 'ds1',
      type: 'base',
      fields: [
        { name: 'field1', type: 'string' },
        { name: 'field2', type: 'number' },
        { name: 'field3', type: 'boolean' },
      ],
      methods: [],
      events: [],
    };

    expect(getFieldType(ds, ['field1'])).toBe('string');
    expect(getFieldType(ds, ['field2'])).toBe('number');
    expect(getFieldType(ds, ['field3'])).toBe('boolean');
  });

  test('返回嵌套字段类型', () => {
    const ds: DataSourceSchema = {
      id: 'ds1',
      type: 'base',
      fields: [
        {
          name: 'obj',
          type: 'object',
          fields: [
            { name: 'nested1', type: 'string' },
            { name: 'nested2', type: 'number' },
          ],
        },
      ],
      methods: [],
      events: [],
    };

    expect(getFieldType(ds, ['obj', 'nested1'])).toBe('string');
    expect(getFieldType(ds, ['obj', 'nested2'])).toBe('number');
  });

  test('返回深层嵌套字段类型', () => {
    const ds: DataSourceSchema = {
      id: 'ds1',
      type: 'base',
      fields: [
        {
          name: 'level1',
          type: 'object',
          fields: [
            {
              name: 'level2',
              type: 'object',
              fields: [{ name: 'level3', type: 'boolean' }],
            },
          ],
        },
      ],
      methods: [],
      events: [],
    };

    expect(getFieldType(ds, ['level1', 'level2', 'level3'])).toBe('boolean');
  });

  test('返回空字符串当字段不存在', () => {
    const ds: DataSourceSchema = {
      id: 'ds1',
      type: 'base',
      fields: [{ name: 'field1', type: 'string' }],
      methods: [],
      events: [],
    };

    expect(getFieldType(ds, ['nonexistent'])).toBe('');
  });

  test('返回空字符串当嵌套字段不存在', () => {
    const ds: DataSourceSchema = {
      id: 'ds1',
      type: 'base',
      fields: [
        {
          name: 'obj',
          type: 'object',
          fields: [{ name: 'nested1', type: 'string' }],
        },
      ],
      methods: [],
      events: [],
    };

    expect(getFieldType(ds, ['obj', 'nonexistent'])).toBe('');
  });

  test('返回空字符串当字段type未定义', () => {
    const ds: DataSourceSchema = {
      id: 'ds1',
      type: 'base',
      fields: [{ name: 'field1' }],
      methods: [],
      events: [],
    };

    expect(getFieldType(ds, ['field1'])).toBe('');
  });
});

describe('getCascaderOptionsFromFields', () => {
  test('返回空数组当fields为空', () => {
    const result = getCascaderOptionsFromFields([]);
    expect(result).toEqual([]);
  });

  test('返回空数组当fields为undefined', () => {
    const result = getCascaderOptionsFromFields(undefined);
    expect(result).toEqual([]);
  });

  test('返回基本字段选项（默认any类型过滤）', () => {
    const fields: DataSchema[] = [
      { name: 'field1', type: 'string' },
      { name: 'field2', type: 'number' },
    ];
    const result = getCascaderOptionsFromFields(fields);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      label: 'field1(string)',
      value: 'field1',
      children: [],
    });
    expect(result[1]).toEqual({
      label: 'field2(number)',
      value: 'field2',
      children: [],
    });
  });

  test('使用title作为label（如果存在）', () => {
    const fields: DataSchema[] = [{ name: 'field1', title: '字段1', type: 'string' }];
    const result = getCascaderOptionsFromFields(fields);

    expect(result[0].label).toBe('字段1(string)');
  });

  test('按类型过滤字段', () => {
    const fields: DataSchema[] = [
      { name: 'field1', type: 'string' },
      { name: 'field2', type: 'number' },
      { name: 'field3', type: 'boolean' },
    ];
    const result = getCascaderOptionsFromFields(fields, ['string', 'number']);

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.value)).toEqual(['field1', 'field2']);
  });

  test('递归处理嵌套object字段', () => {
    const fields: DataSchema[] = [
      {
        name: 'obj',
        type: 'object',
        fields: [
          { name: 'nested1', type: 'string' },
          { name: 'nested2', type: 'number' },
        ],
      },
    ];
    const result = getCascaderOptionsFromFields(fields);

    expect(result).toHaveLength(1);
    expect(result[0].children).toHaveLength(2);
    expect(result[0].children![0]).toEqual({
      label: 'nested1(string)',
      value: 'nested1',
      children: [],
    });
  });

  test('递归处理嵌套array字段', () => {
    const fields: DataSchema[] = [
      {
        name: 'arr',
        type: 'array',
        fields: [{ name: 'item', type: 'string' }],
      },
    ];
    const result = getCascaderOptionsFromFields(fields);

    expect(result).toHaveLength(1);
    expect(result[0].children).toHaveLength(1);
  });

  test('过滤掉不匹配类型且无子项的object/array字段', () => {
    const fields: DataSchema[] = [
      { name: 'obj', type: 'object', fields: [] },
      { name: 'str', type: 'string' },
    ];
    const result = getCascaderOptionsFromFields(fields, ['string']);

    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('str');
  });

  test('保留有匹配子项的object字段', () => {
    const fields: DataSchema[] = [
      {
        name: 'obj',
        type: 'object',
        fields: [{ name: 'nested', type: 'string' }],
      },
    ];
    const result = getCascaderOptionsFromFields(fields, ['string']);

    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('obj');
    expect(result[0].children).toHaveLength(1);
  });

  test('深层嵌套字段', () => {
    const fields: DataSchema[] = [
      {
        name: 'level1',
        type: 'object',
        fields: [
          {
            name: 'level2',
            type: 'object',
            fields: [{ name: 'level3', type: 'string' }],
          },
        ],
      },
    ];
    const result = getCascaderOptionsFromFields(fields);

    expect(result[0].children![0].children![0].value).toBe('level3');
  });

  test('字段type未定义时视为any', () => {
    const fields: DataSchema[] = [{ name: 'field1' }];
    const result = getCascaderOptionsFromFields(fields);

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('field1(undefined)');
  });
});
