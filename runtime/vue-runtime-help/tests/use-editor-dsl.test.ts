import { beforeEach, describe, expect, test } from 'vitest';

import type { MApp } from '@tmagic/core';
import Core, { NodeType } from '@tmagic/core';
import type { Runtime } from '@tmagic/stage';

import { useEditorDsl } from '../src';

const createDsl = () =>
  ({
    type: NodeType.ROOT,
    id: 'app',
    items: [
      { type: NodeType.PAGE, id: 'p1', items: [{ id: 'btn', type: 'button' }] },
      { type: NodeType.PAGE, id: 'p2', items: [] },
      { type: NodeType.PAGE_FRAGMENT, id: 'f1', items: [] },
    ],
  }) as unknown as MApp;

const setup = (curPageId?: string) => {
  const app = new Core({});
  let runtime: Runtime = {};

  (window as any).magic = {
    onRuntimeReady: (rt: Runtime) => {
      runtime = rt;
    },
  };

  useEditorDsl(app);

  const dsl = createDsl();
  runtime.updateRootConfig?.(dsl);
  if (curPageId) {
    runtime.updatePageId?.(curPageId);
  }

  return { app, runtime, dsl };
};

describe('useEditorDsl add', () => {
  beforeEach(() => {
    (window as any).magic = undefined;
  });

  test('传入 index 时按指定下标插入，不依赖 selectedId', () => {
    const { runtime, dsl } = setup();
    runtime.select?.('btn');

    runtime.add?.({
      config: { id: 'n1', type: 'text' } as any,
      parentId: 'p1',
      root: dsl,
      index: 0,
    });

    expect(dsl.items[0].items?.map((item) => item.id)).toEqual(['n1', 'btn']);
  });

  test('不传 index 时保持原有逻辑：接在选中节点之后', () => {
    const { runtime, dsl } = setup();
    runtime.select?.('btn');

    runtime.add?.({ config: { id: 'n1', type: 'text' } as any, parentId: 'p1', root: dsl });

    expect(dsl.items[0].items?.map((item) => item.id)).toEqual(['btn', 'n1']);
  });

  test('不传 index 且选中的就是父容器时追加到末尾', () => {
    const { runtime, dsl } = setup();
    runtime.select?.('p1');

    runtime.add?.({ config: { id: 'n1', type: 'text' } as any, parentId: 'p1', root: dsl });

    expect(dsl.items[0].items?.map((item) => item.id)).toEqual(['btn', 'n1']);
  });

  test('连续按递增 index 插入时保持顺序', () => {
    const { runtime, dsl } = setup();
    runtime.select?.('btn');

    runtime.add?.({
      config: { id: 'n1', type: 'text' } as any,
      parentId: 'p1',
      root: dsl,
      index: 1,
    });
    runtime.add?.({
      config: { id: 'n2', type: 'text' } as any,
      parentId: 'p1',
      root: dsl,
      index: 2,
    });

    expect(dsl.items[0].items?.map((item) => item.id)).toEqual(['btn', 'n1', 'n2']);
  });
});

describe('useEditorDsl remove', () => {
  beforeEach(() => {
    (window as any).magic = undefined;
  });

  test('删除当前渲染的页面时销毁 page 实例', () => {
    const { app, runtime, dsl } = setup();
    expect(app.page?.data.id).toBe('p1');

    runtime.remove?.({ id: 'p1', parentId: 'app', root: dsl });

    expect(app.page).toBeUndefined();
    expect(dsl.items.some((item) => item.id === 'p1')).toBe(false);
  });

  test('删除非当前页面时保留当前 page 实例，不清空画布', () => {
    const { app, runtime, dsl } = setup();
    expect(app.page?.data.id).toBe('p1');

    runtime.remove?.({ id: 'p2', parentId: 'app', root: dsl });

    expect(app.page?.data.id).toBe('p1');
    expect(dsl.items.some((item) => item.id === 'p2')).toBe(false);
  });

  test('删除当前渲染的页面片时同样销毁 page 实例', () => {
    const { app, runtime, dsl } = setup('f1');
    expect(app.page?.data.id).toBe('f1');

    runtime.remove?.({ id: 'f1', parentId: 'app', root: dsl });

    expect(app.page).toBeUndefined();
    expect(dsl.items.some((item) => item.id === 'f1')).toBe(false);
  });

  test('删除非当前页面片时保留当前 page 实例', () => {
    const { app, runtime, dsl } = setup();
    expect(app.page?.data.id).toBe('p1');

    runtime.remove?.({ id: 'f1', parentId: 'app', root: dsl });

    expect(app.page?.data.id).toBe('p1');
    expect(dsl.items.some((item) => item.id === 'f1')).toBe(false);
  });

  test('删除普通节点时只从当前 page 移除该节点', () => {
    const { app, runtime, dsl } = setup();
    expect(app.getNode('btn')?.data.id).toBe('btn');

    runtime.remove?.({ id: 'btn', parentId: 'p1', root: dsl });

    expect(app.page?.data.id).toBe('p1');
    expect(app.getNode('btn')).toBeUndefined();
  });
});
