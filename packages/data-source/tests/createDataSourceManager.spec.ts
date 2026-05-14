import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import TMagicApp, { type MApp, NodeType } from '@tmagic/core';

import { createDataSourceManager, DataSource, DataSourceManager } from '@data-source/index';

const createDsl = (): MApp => ({
  type: NodeType.ROOT,
  id: 'app_1',
  items: [
    {
      type: NodeType.PAGE,
      id: 'page_1',
      items: [
        {
          type: 'text',
          id: 61705611,
          text: '{{ds_bebcb2d5.text}}',
        },
      ],
    },
  ],
  dataSourceDeps: {
    ds_bebcb2d5: {
      61705611: {
        name: '文本',
        keys: ['text'],
      },
    },
  },
  dataSources: [
    {
      id: 'ds_bebcb2d5',
      type: 'http',
      fields: [
        {
          name: 'text',
        },
      ],
      methods: [],
      events: [],
    },
  ],
});

afterEach(() => {
  DataSourceManager.clearDataSourceClass();
});

describe('createDataSourceManager - 基础', () => {
  test('instance', () => {
    const manager = createDataSourceManager(new TMagicApp({ config: createDsl() }));
    expect(manager).toBeInstanceOf(DataSourceManager);
  });

  test('dsl 中没有 dataSources 时返回 undefined', () => {
    const app = new TMagicApp({
      config: {
        type: NodeType.ROOT,
        id: 'app_no_ds',
        items: [],
      },
    });
    const manager = createDataSourceManager(app);
    expect(manager).toBeUndefined();
  });

  test('app 没有 dsl 时返回 undefined', () => {
    const app = new TMagicApp({});
    const manager = createDataSourceManager(app);
    expect(manager).toBeUndefined();
  });

  test('useMock 透传到 DataSourceManager', () => {
    const manager = createDataSourceManager(new TMagicApp({ config: createDsl() }), true);
    expect(manager?.useMock).toBe(true);
  });

  test('initialData 透传到 DataSourceManager', () => {
    const manager = createDataSourceManager(new TMagicApp({ config: createDsl() }), false, {
      ds_bebcb2d5: { text: 'preset' },
    });
    expect(manager?.initialData.ds_bebcb2d5).toEqual({ text: 'preset' });
    expect(manager?.data.ds_bebcb2d5.text).toBe('preset');
  });
});

describe('createDataSourceManager - 初始化阶段编译', () => {
  test('platform!=editor && 存在 dataSourceCondDeps 时按节点写入 condResult', () => {
    const dsl: MApp = {
      type: NodeType.ROOT,
      id: 'app_cond',
      items: [
        {
          type: NodeType.PAGE,
          id: 'page_1',
          items: [
            {
              type: 'text',
              id: 'cond_node',
              text: 'hello',
              displayConds: [{ cond: [{ field: ['ds_1', 'a'], op: '=', value: 1 }] }],
            } as any,
          ],
        },
      ],
      dataSourceCondDeps: {
        ds_1: {
          cond_node: { name: '文本', keys: ['displayConds'] },
        },
      },
      dataSourceDeps: {},
      dataSources: [
        {
          id: 'ds_1',
          type: 'base',
          fields: [{ name: 'a', defaultValue: 1 }],
          methods: [],
          events: [],
        },
      ],
    };
    const app = new TMagicApp({ config: dsl, platform: 'mobile' });
    createDataSourceManager(app);
    const node: any = (app.dsl?.items[0] as any).items[0];
    expect(node.condResult).toBe(true);
  });

  test('platform=editor 时初始化不写入 condResult', () => {
    const dsl: MApp = {
      type: NodeType.ROOT,
      id: 'app_cond_editor',
      items: [
        {
          type: NodeType.PAGE,
          id: 'page_1',
          items: [
            {
              type: 'text',
              id: 'cond_node',
              text: 'hello',
              displayConds: [{ cond: [{ field: ['ds_1', 'a'], op: '=', value: 1 }] }],
            } as any,
          ],
        },
      ],
      dataSourceCondDeps: {
        ds_1: {
          cond_node: { name: '文本', keys: ['displayConds'] },
        },
      },
      dataSourceDeps: {},
      dataSources: [
        {
          id: 'ds_1',
          type: 'base',
          fields: [{ name: 'a', defaultValue: 1 }],
          methods: [],
          events: [],
        },
      ],
    };
    const app = new TMagicApp({ config: dsl, platform: 'editor' });
    createDataSourceManager(app);
    const node: any = (app.dsl?.items[0] as any).items[0];
    expect(node.condResult).toBeUndefined();
  });

  test('存在 dataSourceDeps 时初始化即编译节点字段（模板）', () => {
    const dsl: MApp = {
      type: NodeType.ROOT,
      id: 'app_dep',
      items: [
        {
          type: NodeType.PAGE,
          id: 'page_1',
          items: [
            {
              type: 'text',
              id: 'dep_node',
              text: 'hello ${ds_1.name}',
            } as any,
          ],
        },
      ],
      dataSourceDeps: {
        ds_1: {
          dep_node: { name: '文本', keys: ['text'] },
        },
      },
      dataSources: [
        {
          id: 'ds_1',
          type: 'base',
          fields: [{ name: 'name', defaultValue: 'world' }],
          methods: [],
          events: [],
        },
      ],
    };
    const app = new TMagicApp({ config: dsl, platform: 'mobile' });
    createDataSourceManager(app);
    const node: any = (app.dsl?.items[0] as any).items[0];
    expect(node.text).toBe('hello world');
  });
});

describe('createDataSourceManager - jsEngine=nodejs', () => {
  test('nodejs 环境下不监听 change，触发 setData 不会走 update-data', () => {
    const app = new TMagicApp({ config: createDsl(), jsEngine: 'nodejs' });
    const manager = createDataSourceManager(app);
    expect(manager).toBeInstanceOf(DataSourceManager);
    expect(manager?.listenerCount('change')).toBe(0);

    const updateSpy = vi.fn();
    manager?.on('update-data', updateSpy);
    const ds = manager?.get('ds_bebcb2d5');
    ds?.setData({ text: 'changed' });
    expect(updateSpy).not.toHaveBeenCalled();
  });
});

describe('createDataSourceManager - change 事件', () => {
  let app: TMagicApp;
  let manager: DataSourceManager | undefined;

  beforeEach(() => {
    const dsl: MApp = {
      type: NodeType.ROOT,
      id: 'app_change',
      items: [
        {
          type: NodeType.PAGE,
          id: 'page_1',
          items: [
            {
              type: 'text',
              id: 'text_1',
              text: 'origin ${ds_1.name}',
            } as any,
          ],
        },
      ],
      dataSourceDeps: {
        ds_1: {
          text_1: { name: '文本', keys: ['text'] },
        },
      },
      dataSources: [
        {
          id: 'ds_1',
          type: 'base',
          fields: [{ name: 'name', defaultValue: 'world' }],
          methods: [],
          events: [],
        },
      ],
    };
    app = new TMagicApp({ config: dsl, platform: 'mobile' });
    manager = createDataSourceManager(app);
  });

  test('change 事件触发后会发出 update-data，并携带新节点 / sourceId / pageId', () => {
    const update = vi.fn();
    manager?.on('update-data', update);

    const ds = manager?.get('ds_1');
    ds?.setData({ name: 'new' });

    expect(update).toHaveBeenCalledTimes(1);
    const [newNodes, sourceId, , pageId] = update.mock.calls[0];
    expect(sourceId).toBe('ds_1');
    expect(pageId).toBe('page_1');
    expect(newNodes[0].id).toBe('text_1');
    expect(newNodes[0].text).toBe('origin new');
  });

  test('change 事件会调用 page.setData 并触发节点 setData', () => {
    const node = app.getNode('text_1');
    const setDataSpy = vi.spyOn(node!, 'setData');

    const ds = manager?.get('ds_1');
    ds?.setData({ name: 'second' });

    expect(setDataSpy).toHaveBeenCalled();
    const calledArg = setDataSpy.mock.calls[0][0] as any;
    expect(calledArg.text).toBe('origin second');
  });

  test('依赖中的节点不存在时不会发出 update-data', () => {
    const update = vi.fn();
    manager?.on('update-data', update);

    if (app.dsl?.dataSourceDeps) {
      app.dsl.dataSourceDeps = {};
    }

    const ds = manager?.get('ds_1');
    ds?.setData({ name: 'noop' });

    expect(update).not.toHaveBeenCalled();
  });

  test('page 自身被命中时调用 app.page.setData', () => {
    // 把 page 自己加入到依赖中
    if (app.dsl?.dataSourceDeps) {
      app.dsl.dataSourceDeps.ds_1 = {
        page_1: { name: 'page', keys: ['style'] },
      } as any;
    }
    const pageSetData = vi.spyOn(app.page!, 'setData');
    const ds = manager?.get('ds_1');
    ds?.setData({ name: 'X' });
    expect(pageSetData).toHaveBeenCalled();
    const arg: any = pageSetData.mock.calls[0][0];
    expect(arg.id).toBe('page_1');
  });

  test('page 没有 instance 时通过 replaceChildNode 写回 page.data', () => {
    const ds = manager?.get('ds_1');
    expect(app.page?.instance).toBeFalsy();

    ds?.setData({ name: 'replaced' });

    const replacedText = (app.page?.data as any).items[0].text;
    expect(replacedText).toBe('origin replaced');
  });
});

describe('createDataSourceManager - editor 平台', () => {
  test('editor 平台会遍历所有页面，而非仅当前页', () => {
    const dsl: MApp = {
      type: NodeType.ROOT,
      id: 'app_editor',
      items: [
        {
          type: NodeType.PAGE,
          id: 'page_1',
          items: [{ type: 'text', id: 'text_a', text: 'a ${ds_1.name}' } as any],
        },
        {
          type: NodeType.PAGE,
          id: 'page_2',
          items: [{ type: 'text', id: 'text_b', text: 'b ${ds_1.name}' } as any],
        },
      ],
      dataSourceDeps: {
        ds_1: {
          text_a: { name: '文本', keys: ['text'] },
          text_b: { name: '文本', keys: ['text'] },
        },
      },
      dataSources: [
        {
          id: 'ds_1',
          type: 'base',
          fields: [{ name: 'name', defaultValue: 'init' }],
          methods: [],
          events: [],
        },
      ],
    };
    const app = new TMagicApp({ config: dsl, platform: 'editor' });
    const manager = createDataSourceManager(app);

    const update = vi.fn();
    manager?.on('update-data', update);

    const ds = manager?.get('ds_1');
    ds?.setData({ name: 'V' });

    expect(update).toHaveBeenCalledTimes(2);
    const pageIds = update.mock.calls.map((c) => c[3]);
    expect(pageIds).toContain('page_1');
    expect(pageIds).toContain('page_2');
  });

  test('非 editor 平台只处理当前页', () => {
    const dsl: MApp = {
      type: NodeType.ROOT,
      id: 'app_runtime',
      items: [
        {
          type: NodeType.PAGE,
          id: 'page_1',
          items: [{ type: 'text', id: 'text_a', text: 'a ${ds_1.name}' } as any],
        },
        {
          type: NodeType.PAGE,
          id: 'page_2',
          items: [{ type: 'text', id: 'text_b', text: 'b ${ds_1.name}' } as any],
        },
      ],
      dataSourceDeps: {
        ds_1: {
          text_a: { name: '文本', keys: ['text'] },
          text_b: { name: '文本', keys: ['text'] },
        },
      },
      dataSources: [
        {
          id: 'ds_1',
          type: 'base',
          fields: [{ name: 'name', defaultValue: 'init' }],
          methods: [],
          events: [],
        },
      ],
    };
    const app = new TMagicApp({ config: dsl, platform: 'mobile', curPage: 'page_1' });
    const manager = createDataSourceManager(app);

    const update = vi.fn();
    manager?.on('update-data', update);

    const ds = manager?.get('ds_1');
    ds?.setData({ name: 'V' });

    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][3]).toBe('page_1');
  });

  test('非 editor 平台命中 isPageFragment 分支也会被处理', () => {
    const dsl: MApp = {
      type: NodeType.ROOT,
      id: 'app_pf',
      items: [
        {
          type: NodeType.PAGE,
          id: 'page_1',
          items: [{ type: 'text', id: 'text_a', text: 'a' } as any],
        },
        {
          type: NodeType.PAGE_FRAGMENT,
          id: 'pf_1',
          items: [{ type: 'text', id: 'text_b', text: 'b ${ds_1.name}' } as any],
        } as any,
      ],
      dataSourceDeps: {
        ds_1: {
          text_b: { name: '文本', keys: ['text'] },
        },
      },
      dataSources: [
        {
          id: 'ds_1',
          type: 'base',
          fields: [{ name: 'name', defaultValue: 'init' }],
          methods: [],
          events: [],
        },
      ],
    };
    const app = new TMagicApp({ config: dsl, platform: 'mobile', curPage: 'page_1' });
    const manager = createDataSourceManager(app);

    const update = vi.fn();
    manager?.on('update-data', update);

    const ds = manager?.get('ds_1');
    ds?.setData({ name: 'V' });

    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][3]).toBe('pf_1');
  });
});

describe('createDataSourceManager - pageFragments 同步', () => {
  test('当 newNode 为 pageFragment 自身时，调用 pageFragment.setData', () => {
    const dsl: MApp = {
      type: NodeType.ROOT,
      id: 'app_pf_self',
      items: [
        {
          type: NodeType.PAGE,
          id: 'page_1',
          items: [
            {
              type: 'page-fragment-container',
              id: 'pfc_1',
              pageFragmentId: 'pf_1',
              items: [],
            } as any,
          ],
        },
        {
          type: NodeType.PAGE_FRAGMENT,
          id: 'pf_1',
          items: [{ type: 'text', id: 'pf_text', text: 'pf ${ds_1.name}' } as any],
          extra: '${ds_1.name}',
        } as any,
      ],
      dataSourceDeps: {
        ds_1: {
          pf_1: { name: 'pf', keys: ['extra'] },
        },
      },
      dataSources: [
        {
          id: 'ds_1',
          type: 'base',
          fields: [{ name: 'name', defaultValue: 'init' }],
          methods: [],
          events: [],
        },
      ],
    };
    const app = new TMagicApp({ config: dsl, platform: 'editor', curPage: 'page_1' });
    const manager = createDataSourceManager(app);

    expect(app.pageFragments.size).toBeGreaterThan(0);
    const pageFragment = app.pageFragments.get('pfc_1')!;
    const pfSetData = vi.spyOn(pageFragment, 'setData');

    const ds = manager?.get('ds_1');
    ds?.setData({ name: 'X' });

    expect(pfSetData).toHaveBeenCalled();
    const arg: any = pfSetData.mock.calls[0][0];
    expect(arg.id).toBe('pf_1');
  });

  test('当 newNode 是 pageFragment 内子节点时，pageFragment 内同步并 replaceChildNode', () => {
    const dsl: MApp = {
      type: NodeType.ROOT,
      id: 'app_pf_child',
      items: [
        {
          type: NodeType.PAGE,
          id: 'page_1',
          items: [
            {
              type: 'page-fragment-container',
              id: 'pfc_1',
              pageFragmentId: 'pf_1',
              items: [],
            } as any,
          ],
        },
        {
          type: NodeType.PAGE_FRAGMENT,
          id: 'pf_1',
          items: [{ type: 'text', id: 'pf_text', text: 'pf ${ds_1.name}' } as any],
        } as any,
      ],
      dataSourceDeps: {
        ds_1: {
          pf_text: { name: 'pf_text', keys: ['text'] },
        },
      },
      dataSources: [
        {
          id: 'ds_1',
          type: 'base',
          fields: [{ name: 'name', defaultValue: 'init' }],
          methods: [],
          events: [],
        },
      ],
    };
    const app = new TMagicApp({ config: dsl, platform: 'editor', curPage: 'page_1' });
    const manager = createDataSourceManager(app);

    const pageFragment = app.pageFragments.get('pfc_1')!;
    const innerNode = pageFragment.getNode('pf_text', { strict: true })!;
    const innerSetData = vi.spyOn(innerNode, 'setData');

    const ds = manager?.get('ds_1');
    ds?.setData({ name: 'Y' });

    expect(innerSetData).toHaveBeenCalled();
    const arg: any = innerSetData.mock.calls[0][0];
    expect(arg.text).toBe('pf Y');
    expect((pageFragment.data as any).items[0].text).toBe('pf Y');
  });
});

describe('createDataSourceManager - app.page 不存在', () => {
  test('app.page 缺失时跳过 page.setData / 节点 setData，但仍发出 update-data', () => {
    const dsl: MApp = {
      type: NodeType.ROOT,
      id: 'app_no_page',
      items: [
        {
          type: NodeType.PAGE,
          id: 'page_1',
          items: [{ type: 'text', id: 'text_a', text: 'a ${ds_1.name}' } as any],
        },
      ],
      dataSourceDeps: {
        ds_1: {
          text_a: { name: '文本', keys: ['text'] },
        },
      },
      dataSources: [
        {
          id: 'ds_1',
          type: 'base',
          fields: [{ name: 'name', defaultValue: 'init' }],
          methods: [],
          events: [],
        },
      ],
    };
    // curPage 指向不存在的页，setPage 会调用 deletePage 让 app.page = undefined
    const app = new TMagicApp({ config: dsl, platform: 'editor', curPage: 'not_exist' });
    expect(app.page).toBeUndefined();
    const manager = createDataSourceManager(app);

    const update = vi.fn();
    manager?.on('update-data', update);

    const ds = manager?.get('ds_1');
    expect(() => ds?.setData({ name: 'V' })).not.toThrow();

    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][3]).toBe('page_1');
  });
});

describe('createDataSourceManager - pageFragment 与被遍历 page 同 id', () => {
  test('editor 平台遍历到 pageFragment 自身页时进入 pageFragment.data.id === page.id 分支', () => {
    const dsl: MApp = {
      type: NodeType.ROOT,
      id: 'app_pf_iter',
      items: [
        {
          type: NodeType.PAGE,
          id: 'page_1',
          items: [
            {
              type: 'page-fragment-container',
              id: 'pfc_1',
              pageFragmentId: 'pf_1',
              items: [],
            } as any,
          ],
        },
        {
          type: NodeType.PAGE_FRAGMENT,
          id: 'pf_1',
          items: [{ type: 'text', id: 'pf_text', text: 'pf ${ds_1.name}' } as any],
        } as any,
      ],
      dataSourceDeps: {
        ds_1: {
          pf_text: { name: 'pf_text', keys: ['text'] },
        },
      },
      dataSources: [
        {
          id: 'ds_1',
          type: 'base',
          fields: [{ name: 'name', defaultValue: 'init' }],
          methods: [],
          events: [],
        },
      ],
    };
    const app = new TMagicApp({ config: dsl, platform: 'editor', curPage: 'page_1' });
    const manager = createDataSourceManager(app);

    const pageFragment = app.pageFragments.get('pfc_1')!;
    const innerNode = pageFragment.getNode('pf_text', { strict: true })!;
    const innerSetData = vi.spyOn(innerNode, 'setData');

    const ds = manager?.get('ds_1');
    ds?.setData({ name: 'Z' });

    expect(innerSetData).toHaveBeenCalled();
    const arg: any = innerSetData.mock.calls[0][0];
    expect(arg.text).toBe('pf Z');
    expect((pageFragment.data as any).items[0].text).toBe('pf Z');
  });
});

describe('createDataSourceManager - pageFragment 边界分支', () => {
  const buildDsl = (): MApp => ({
    type: NodeType.ROOT,
    id: 'app_pf_edge',
    items: [
      {
        type: NodeType.PAGE,
        id: 'page_1',
        items: [
          {
            type: 'page-fragment-container',
            id: 'pfc_1',
            pageFragmentId: 'pf_1',
            items: [],
          } as any,
        ],
      },
      {
        type: NodeType.PAGE_FRAGMENT,
        id: 'pf_1',
        items: [{ type: 'text', id: 'pf_text', text: 'pf ${ds_1.name}' } as any],
      } as any,
    ],
    dataSourceDeps: {
      ds_1: {
        pf_text: { name: 'pf_text', keys: ['text'] },
      },
    },
    dataSources: [
      {
        id: 'ds_1',
        type: 'base',
        fields: [{ name: 'name', defaultValue: 'init' }],
        methods: [],
        events: [],
      },
    ],
  });

  test('pageFragment.getNode 返回 undefined 时安全跳过 setData', () => {
    const app = new TMagicApp({ config: buildDsl(), platform: 'editor', curPage: 'page_1' });
    const manager = createDataSourceManager(app);

    const pageFragment = app.pageFragments.get('pfc_1')!;
    // 模拟 pageFragment 内对应节点已被移除的边界
    pageFragment.nodes.delete('pf_text');

    const ds = manager?.get('ds_1');
    expect(() => ds?.setData({ name: 'A' })).not.toThrow();
  });

  test('pageFragment 与当前遍历的 page、newNode 都无关时不会进入 pageFragment 同步分支', () => {
    const dsl: MApp = {
      type: NodeType.ROOT,
      id: 'app_pf_unrelated',
      items: [
        {
          type: NodeType.PAGE,
          id: 'page_1',
          items: [
            { type: 'text', id: 'plain_text', text: 'a ${ds_1.name}' } as any,
            {
              type: 'page-fragment-container',
              id: 'pfc_1',
              pageFragmentId: 'pf_1',
              items: [],
            } as any,
          ],
        },
        {
          type: NodeType.PAGE_FRAGMENT,
          id: 'pf_1',
          items: [{ type: 'text', id: 'pf_text', text: 'pf' } as any],
        } as any,
      ],
      dataSourceDeps: {
        ds_1: {
          plain_text: { name: 'plain_text', keys: ['text'] },
        },
      },
      dataSources: [
        {
          id: 'ds_1',
          type: 'base',
          fields: [{ name: 'name', defaultValue: 'init' }],
          methods: [],
          events: [],
        },
      ],
    };
    const app = new TMagicApp({ config: dsl, platform: 'mobile', curPage: 'page_1' });
    const manager = createDataSourceManager(app);

    const pageFragment = app.pageFragments.get('pfc_1')!;
    const pfSetData = vi.spyOn(pageFragment, 'setData');

    const ds = manager?.get('ds_1');
    ds?.setData({ name: 'C' });

    // pageFragment 与本次更新无关，不会被同步
    expect(pfSetData).not.toHaveBeenCalled();
  });

  test('pageFragment.instance 为真时跳过 replaceChildNode', () => {
    const app = new TMagicApp({ config: buildDsl(), platform: 'editor', curPage: 'page_1' });
    const manager = createDataSourceManager(app);

    const pageFragment = app.pageFragments.get('pfc_1')!;
    pageFragment.setInstance({ __isVue: true });

    const before = (pageFragment.data as any).items[0].text;
    const ds = manager?.get('ds_1');
    ds?.setData({ name: 'B' });

    // 因为 instance 存在，pageFragment.data 不会被 replaceChildNode 改写
    expect((pageFragment.data as any).items[0].text).toBe(before);
  });
});

describe('createDataSourceManager - 自定义数据源类型尚未注册', () => {
  test('未知类型在初始化时不抛错，仅写入默认数据', () => {
    const dsl: MApp = {
      type: NodeType.ROOT,
      id: 'app_pending',
      items: [],
      dataSources: [
        {
          id: 'ds_unknown',
          type: 'custom-not-registered',
          fields: [{ name: 'name', defaultValue: 'd' }],
          methods: [],
          events: [],
        } as any,
      ],
    };
    const app = new TMagicApp({ config: dsl });
    const manager = createDataSourceManager(app);
    expect(manager).toBeInstanceOf(DataSourceManager);
    expect(manager?.data.ds_unknown).toEqual({ name: 'd' });
    expect(manager?.get('ds_unknown')).toBeUndefined();
  });

  test('在未注册期间通过 register 触发延迟初始化', () => {
    const dsl: MApp = {
      type: NodeType.ROOT,
      id: 'app_lazy',
      items: [],
      dataSources: [
        {
          id: 'ds_lazy',
          type: 'lazy-type',
          fields: [{ name: 'name' }],
          methods: [],
          events: [],
        } as any,
      ],
    };
    const app = new TMagicApp({ config: dsl });
    const manager = createDataSourceManager(app);
    expect(manager?.get('ds_lazy')).toBeUndefined();

    class LazyDataSource extends DataSource {}
    DataSourceManager.register('lazy-type', LazyDataSource as any);

    expect(manager?.get('ds_lazy')).toBeInstanceOf(LazyDataSource);
  });
});
