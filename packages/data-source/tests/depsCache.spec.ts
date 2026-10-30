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

  const ds: any = { id: 'ds_ref', fields: [{ name: 'list', type: 'array', fields: [{ name: 'name' }] }] };

  test('节点对象不变（即使放进新数组）时命中缓存', () => {
    const node: any = { id: 'n_hit', type: 'text', text: '${ds_ref.list.name}' };
    const r1 = getDeps(ds, [node], false);
    const r2 = getDeps(ds, [node], false);
    expect(r1).toBe(r2);
    expect(r1.deps.n_hit.keys).toEqual(['text']);
  });

  test.each([false, true])('同 id 的节点被替换且绑定的字段变了，重新收集依赖 (inEditor=%s)', (inEditor) => {
    const before: any = { id: 'n_replaced', type: 'text', text: '${ds_ref.list.name}', title: 'plain' };
    const after: any = { id: 'n_replaced', type: 'text', text: 'plain', title: '${ds_ref.list.name}' };

    const r1 = getDeps(ds, [before], inEditor);
    const r2 = getDeps(ds, [after], inEditor);

    expect(r1.deps.n_replaced.keys).toEqual(['text']);
    expect(r2.deps.n_replaced.keys).toEqual(['title']);
  });

  test('inEditor=true 时子节点被替换（父节点不变）也会重新收集', () => {
    const parent: any = {
      id: 'n_parent',
      type: 'container',
      items: [{ id: 'n_child', type: 'text', text: '${ds_ref.list.name}' }],
    };
    const r1 = getDeps(ds, [parent], true);
    expect(r1.deps.n_child.keys).toEqual(['text']);

    parent.items.splice(0, 1, { id: 'n_child', type: 'text', title: '${ds_ref.list.name}' });
    const r2 = getDeps(ds, [parent], true);
    expect(r2.deps.n_child.keys).toEqual(['title']);
  });

  test('不同数据源、不同 inEditor 的结果互不影响', () => {
    const node: any = { id: 'n_multi', type: 'text', text: '${ds_ref.list.name} ${ds_other.list.name}' };
    const other: any = { id: 'ds_other', fields: [{ name: 'list', type: 'array', fields: [{ name: 'name' }] }] };

    const a = getDeps(ds, [node], false);
    const b = getDeps(other, [node], false);
    const c = getDeps(ds, [node], true);

    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(getDeps(ds, [node], false)).toBe(a);
    expect(getDeps(other, [node], false)).toBe(b);
    expect(getDeps(ds, [node], true)).toBe(c);
  });

  test('nodes 为空时不缓存也不报错', () => {
    const r1 = getDeps(ds, [], false);
    const r2 = getDeps(ds, [], false);
    expect(r1.deps).toEqual({});
    expect(r2.deps).toEqual({});
  });
});
