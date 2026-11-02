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

const createFragmentDsl = () =>
  ({
    type: NodeType.ROOT,
    id: 'app',
    items: [
      {
        type: NodeType.PAGE,
        id: 'p1',
        items: [{ id: 'pfc', type: 'page-fragment-container' }],
      },
      {
        type: NodeType.PAGE_FRAGMENT,
        id: 'f1',
        items: [{ id: 'text_in_f1', type: 'text' }],
      },
      {
        type: NodeType.PAGE_FRAGMENT,
        id: 'f2',
        items: [{ id: 'text_in_f2', type: 'text' }],
      },
    ],
  }) as unknown as MApp;

const setupFragment = () => {
  const app = new Core({});
  let runtime: Runtime = {};

  (window as any).magic = {
    onRuntimeReady: (rt: Runtime) => {
      runtime = rt;
    },
  };

  useEditorDsl(app);

  const dsl = createFragmentDsl();
  runtime.updateRootConfig?.(dsl);

  return { app, runtime, dsl };
};

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

describe('useEditorDsl 页面片容器关联', () => {
  beforeEach(() => {
    (window as any).magic = undefined;
  });

  test('新增未关联的容器不会创建页面片实例', () => {
    const { app } = setupFragment();
    expect(app.pageFragments.size).toBe(0);
  });

  test('属性面板关联页面片后创建页面片实例', () => {
    const { app, runtime, dsl } = setupFragment();

    runtime.update?.({
      config: { id: 'pfc', type: 'page-fragment-container', pageFragmentId: 'f1' } as any,
      parentId: 'p1',
      root: dsl,
    });

    const fragment = app.pageFragments.get('pfc');
    expect(fragment?.data.id).toBe('f1');
    expect(fragment?.getNode('text_in_f1')?.data.id).toBe('text_in_f1');
  });

  test('切换关联的页面片会替换实例', () => {
    const { app, runtime, dsl } = setupFragment();

    runtime.update?.({
      config: { id: 'pfc', type: 'page-fragment-container', pageFragmentId: 'f1' } as any,
      parentId: 'p1',
      root: dsl,
    });
    runtime.update?.({
      config: { id: 'pfc', type: 'page-fragment-container', pageFragmentId: 'f2' } as any,
      parentId: 'p1',
      root: dsl,
    });

    expect(app.pageFragments.get('pfc')?.data.id).toBe('f2');
    expect(app.pageFragments.get('pfc')?.getNode('text_in_f2')?.data.id).toBe('text_in_f2');
  });

  test('容器其它属性更新不会重建页面片实例', () => {
    const { app, runtime, dsl } = setupFragment();

    runtime.update?.({
      config: { id: 'pfc', type: 'page-fragment-container', pageFragmentId: 'f1' } as any,
      parentId: 'p1',
      root: dsl,
    });
    const fragment = app.pageFragments.get('pfc');

    runtime.update?.({
      config: {
        id: 'pfc',
        type: 'page-fragment-container',
        pageFragmentId: 'f1',
        style: { width: '100px' },
      } as any,
      parentId: 'p1',
      root: dsl,
    });

    expect(app.pageFragments.get('pfc')).toBe(fragment);
  });

  test('取消关联后移除页面片实例', () => {
    const { app, runtime, dsl } = setupFragment();

    runtime.update?.({
      config: { id: 'pfc', type: 'page-fragment-container', pageFragmentId: 'f1' } as any,
      parentId: 'p1',
      root: dsl,
    });
    runtime.update?.({
      config: { id: 'pfc', type: 'page-fragment-container', pageFragmentId: '' } as any,
      parentId: 'p1',
      root: dsl,
    });

    expect(app.pageFragments.size).toBe(0);
  });

  test('删除容器后移除页面片实例', () => {
    const { app, runtime, dsl } = setupFragment();

    runtime.update?.({
      config: { id: 'pfc', type: 'page-fragment-container', pageFragmentId: 'f1' } as any,
      parentId: 'p1',
      root: dsl,
    });
    expect(app.pageFragments.size).toBe(1);

    runtime.remove?.({ id: 'pfc', parentId: 'p1', root: dsl });

    expect(app.pageFragments.size).toBe(0);
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
