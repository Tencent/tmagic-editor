/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';

import MagicTable, { createColumns, formatter, MagicTable as Table } from '../src/index';

describe('table 入口导出', () => {
  test('插件 install 注册组件', () => {
    const calls: any[] = [];
    const fakeApp = {
      component(name: string, comp: any) {
        calls.push([name, comp]);
      },
    } as any;
    MagicTable.install(fakeApp);
    expect(calls[0][0]).toBe('m-table');
  });

  test('Table 组件存在', () => {
    expect(Table).toBeDefined();
  });

  test('createColumns / formatter 可正常使用', () => {
    expect(createColumns([{ prop: 'a' }])).toHaveLength(1);
    expect(formatter({ prop: 'a' }, { a: 'v' }, { index: 0 })).toBe('v');
  });
});
