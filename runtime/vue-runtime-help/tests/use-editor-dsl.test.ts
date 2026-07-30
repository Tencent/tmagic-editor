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
