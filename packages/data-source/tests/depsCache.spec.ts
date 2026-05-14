/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';

import { getDeps } from '@data-source/depsCache';

describe('getDeps', () => {
  test('从节点收集普通字段依赖', () => {
    const ds: any = {
      id: 'ds_1',
      fields: [{ name: 'name', type: 'string' }],
    };
    const nodes: any[] = [
      {
        id: 'page_1',
        type: 'page',
        items: [
          {
            id: 'btn_1',
            type: 'text',
            text: '${ds_1.name}',
          },
        ],
      },
    ];
    const result = getDeps(ds, nodes, false);
    expect(result.deps).toBeDefined();
    expect(result.condDeps).toBeDefined();
  });

  test('inEditor=true 时缓存键包含所有 traverse 节点', () => {
    const ds: any = {
      id: 'ds_2',
      fields: [{ name: 'name' }],
    };
    const nodes: any[] = [
      {
        id: 'page_1',
        type: 'page',
        items: [{ id: 'btn_1', type: 'text', text: '${ds_2.name}' }],
      },
    ];
    const result = getDeps(ds, nodes, true);
    expect(result.deps).toBeDefined();
  });

  test('cache 命中时返回同一对象', () => {
    const ds: any = { id: 'ds_3', fields: [{ name: 'n' }] };
    const nodes: any[] = [{ id: 'p', type: 'page', items: [] }];
    const r1 = getDeps(ds, nodes, false);
    const r2 = getDeps(ds, nodes, false);
    expect(r1).toBe(r2);
  });
});
