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
import { describe, expect, test, vi } from 'vitest';

import type { ColumnConfig } from '../src/schema';
import { createColumns, formatter } from '../src/utils';

describe('createColumns', () => {
  test('原样返回 columns 配置', () => {
    const columns: ColumnConfig[] = [
      { prop: 'name', label: '名称' },
      { prop: 'age', label: '年龄' },
    ];
    expect(createColumns(columns)).toBe(columns);
  });

  test('空数组', () => {
    expect(createColumns([])).toEqual([]);
  });
});

describe('formatter', () => {
  test('未配置 prop 时返回空字符串', () => {
    const item: ColumnConfig = {};
    const result = formatter(item, { name: 'tom' }, { index: 0 });
    expect(result).toBe('');
  });

  test('未配置 formatter 时直接返回 row[prop]', () => {
    const item: ColumnConfig = { prop: 'name' };
    const result = formatter(item, { name: 'tom' }, { index: 0 });
    expect(result).toBe('tom');
  });

  test('formatter 为函数时调用并返回结果', () => {
    const fn = vi.fn((value: string, _row: any, _data: any) => `${value}!`);
    const item: ColumnConfig = { prop: 'name', formatter: fn };
    const result = formatter(item, { name: 'tom' }, { index: 1 });
    expect(fn).toHaveBeenCalledWith('tom', { name: 'tom' }, { index: 1 });
    expect(result).toBe('tom!');
  });

  test('formatter 抛错时回退到 row[prop]', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const item: ColumnConfig = {
      prop: 'name',
      formatter: () => {
        throw new Error('boom');
      },
    };
    const result = formatter(item, { name: 'jerry' }, { index: 0 });
    expect(result).toBe('jerry');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test("formatter 为 'datetime' 字符串时会被替换成函数并执行", () => {
    const item: ColumnConfig = { prop: 'createdAt', formatter: 'datetime' };
    const row = { createdAt: '2024-01-01 10:30:00' };
    const result = formatter(item, row, { index: 0 });
    expect(typeof item.formatter).toBe('function');
    expect(typeof result === 'string' || typeof result === 'undefined').toBe(true);
  });
});
