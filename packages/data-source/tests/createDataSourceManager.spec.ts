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

describe('createDataSourceManager - batch 批量更新', () => {
  let app: TMagicApp;
  let manager: DataSourceManager;

  beforeEach(() => {
    const dsl: MApp = {
      type: NodeType.ROOT,
      id: 'app_batch',
      items: [
        {
          type: NodeType.PAGE,
          id: 'page_1',
          items: [
            { type: 'text', id: 'text_a', text: 'a ${ds_1.name}' } as any,
            { type: 'text', id: 'text_b', text: 'b ${ds_2.title}' } as any,
            { type: 'text', id: 'text_ab', text: '${ds_1.name}-${ds_2.title}' } as any,
          ],
        },
      ],
      dataSourceDeps: {
        ds_1: {
          text_a: { name: 'a', keys: ['text'] },
          text_ab: { name: 'ab', keys: ['text'] },
        },
        ds_2: {
          text_b: { name: 'b', keys: ['text'] },
          text_ab: { name: 'ab', keys: ['text'] },
        },
      },
      dataSources: [
        { id: 'ds_1', type: 'base', fields: [{ name: 'name', defaultValue: 'n1' }], methods: [], events: [] },
        { id: 'ds_2', type: 'base', fields: [{ name: 'title', defaultValue: 't1' }], methods: [], events: [] },
      ],
    };
    app = new TMagicApp({ config: dsl, platform: 'mobile' });
    manager = createDataSourceManager(app)!;
  });

  test('batch 内多次 setData 只在结束后统一更新一次，数据本身实时更新', () => {
    const update = vi.fn();
    manager.on('update-data', update);
    const change = vi.fn();
    manager.on('change', change);
    const dataChange = vi.fn();
    manager.onDataChange('ds_1', 'name', dataChange);

    const compiledSpy = vi.spyOn(manager, 'compiledNode');

    const ds1 = manager.get('ds_1')!;
    const result = manager.batch(
      () => {
        expect(manager.isBatching).toBe(true);
        ds1.setData('x', 'name');
        // 数据、change 事件、onDataChange 仍然实时生效
        expect(manager.data.ds_1.name).toBe('x');
        expect(change).toHaveBeenCalledTimes(1);
        expect(dataChange).toHaveBeenCalledTimes(1);
        expect(update).not.toHaveBeenCalled();

        ds1.setData('y', 'name');
        return 'ret';
      },
      { mergeChangeEvents: true },
    );

    expect(result).toBe('ret');
    expect(manager.isBatching).toBe(false);
    expect(change).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenCalledTimes(1);
    expect(compiledSpy).toHaveBeenCalledTimes(2); // text_a, text_ab 各编译一次

    const [nodes, sourceId, changeEvent, pageId] = update.mock.calls[0];
    expect(sourceId).toBe('ds_1');
    expect(pageId).toBe('page_1');
    // 同一数据源多次变化，只保留最后一次 changeEvent
    expect(changeEvent.updateData).toBe('y');
    expect(nodes.map((n: any) => n.id)).toEqual(['text_a', 'text_ab']);
    expect(app.getNode('text_a')?.data.text).toBe('a y');
  });

  test('多个数据源的变化：节点只编译一次，按数据源分别发出 update-data', () => {
    const update = vi.fn();
    manager.on('update-data', update);
    const compiledSpy = vi.spyOn(manager, 'compiledNode');

    manager.batch(() => {
      manager.get('ds_1')!.setData('N', 'name');
      manager.get('ds_2')!.setData('T', 'title');
    });

    // text_a、text_b、text_ab 各编译一次
    expect(compiledSpy).toHaveBeenCalledTimes(3);
    expect(update).toHaveBeenCalledTimes(2);

    const bySource: Record<string, string[]> = {};
    update.mock.calls.forEach(([nodes, sourceId]) => {
      bySource[sourceId] = nodes.map((n: any) => n.id);
    });
    expect(bySource.ds_1).toEqual(['text_a', 'text_ab']);
    expect(bySource.ds_2).toEqual(['text_b', 'text_ab']);

    expect(app.getNode('text_ab')?.data.text).toBe('N-T');
    expect(app.getNode('text_b')?.data.text).toBe('b T');
  });

  test('嵌套 batch 只在最外层结束时更新', () => {
    const update = vi.fn();
    manager.on('update-data', update);

    manager.batch(() => {
      manager.batch(() => {
        manager.get('ds_1')!.setData('inner', 'name');
      });
      expect(manager.isBatching).toBe(true);
      expect(update).not.toHaveBeenCalled();
    });

    expect(update).toHaveBeenCalledTimes(1);
  });

  test('batch 内没有数据变化时不触发更新；fn 抛错时也会更新并恢复状态', () => {
    const update = vi.fn();
    manager.on('update-data', update);

    manager.batch(() => undefined);
    expect(update).not.toHaveBeenCalled();

    expect(() =>
      manager.batch(() => {
        manager.get('ds_1')!.setData('err', 'name');
        throw new Error('boom');
      }),
    ).toThrow('boom');

    expect(manager.isBatching).toBe(false);
    expect(update).toHaveBeenCalledTimes(1);
    expect(app.getNode('text_a')?.data.text).toBe('a err');

    // 恢复后普通 setData 仍然同步更新
    manager.get('ds_1')!.setData('after', 'name');
    expect(update).toHaveBeenCalledTimes(2);
  });

  test('mergeChangeEvents: false 时每次变化各触发一次 update-data，节点仍只编译一次', () => {
    const update = vi.fn();
    manager.on('update-data', update);
    const compiledSpy = vi.spyOn(manager, 'compiledNode');

    manager.batch(
      () => {
        manager.get('ds_1')!.setData('x', 'name');
        manager.get('ds_1')!.setData('y', 'name');
      },
      { mergeChangeEvents: false },
    );

    // 每次变化各一次，各自携带自己的 changeEvent
    expect(update).toHaveBeenCalledTimes(2);
    expect(update.mock.calls.map((call) => call[2].updateData)).toEqual(['x', 'y']);
    expect(update.mock.calls.map((call) => call[1])).toEqual(['ds_1', 'ds_1']);

    // 页面节点仍然只编译一次
    expect(compiledSpy).toHaveBeenCalledTimes(2);
    expect(app.getNode('text_a')?.data.text).toBe('a y');
    expect(app.getNode('text_ab')?.data.text).toBe('y-t1');
  });

  test('mergeChangeEvents: false 时多个数据源各自触发，且只带自己依赖的节点', () => {
    const update = vi.fn();
    manager.on('update-data', update);

    manager.batch(
      () => {
        manager.get('ds_1')!.setData('N', 'name');
        manager.get('ds_2')!.setData('T', 'title');
      },
      { mergeChangeEvents: false },
    );

    expect(update).toHaveBeenCalledTimes(2);
    const bySource: Record<string, string[]> = {};
    update.mock.calls.forEach(([nodes, sourceId]) => {
      bySource[sourceId] = nodes.map((n: any) => n.id);
    });
    expect(bySource.ds_1).toEqual(['text_a', 'text_ab']);
    expect(bySource.ds_2).toEqual(['text_b', 'text_ab']);
  });

  test('嵌套 batch 的选项以最外层为准', () => {
    const update = vi.fn();
    manager.on('update-data', update);

    manager.batch(
      () => {
        manager.batch(
          () => {
            manager.get('ds_1')!.setData('x', 'name');
            manager.get('ds_1')!.setData('y', 'name');
          },
          { mergeChangeEvents: false },
        );
      },
      { mergeChangeEvents: true },
    );

    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][2].updateData).toBe('y');
  });

  test('默认（不传选项）每次变化各触发一次，各自携带自己的 changeEvent', () => {
    const update = vi.fn();
    manager.on('update-data', update);

    manager.batch(() => {
      manager.get('ds_1')!.setData('x', 'name');
      manager.get('ds_1')!.setData('y', 'name');
    });

    expect(update).toHaveBeenCalledTimes(2);
    expect(update.mock.calls.map((call) => call[2].updateData)).toEqual(['x', 'y']);
  });

  test('destroy 会清空 batch 状态', () => {
    const update = vi.fn();
    manager.on('update-data', update);

    manager.batch(() => {
      manager.get('ds_1')!.setData('x', 'name');
      manager.destroy();
    });

    expect(manager.isBatching).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});

describe('createDataSourceManager - 父子节点同时依赖同一数据源', () => {
  const create = () => {
    const dsl: MApp = {
      type: NodeType.ROOT,
      id: 'app_nested',
      items: [
        {
          type: NodeType.PAGE,
          id: 'page_1',
          items: [
            {
              type: 'container',
              id: 'node_b',
              title: 'b ${ds_1.name}',
              items: [{ type: 'text', id: 'node_a', text: 'a ${ds_1.name}' }],
            } as any,
          ],
        },
      ],
      dataSourceDeps: {
        ds_1: {
          node_b: { name: 'b', keys: ['title'] },
          node_a: { name: 'a', keys: ['text'] },
        },
      },
      dataSources: [
        { id: 'ds_1', type: 'base', fields: [{ name: 'name', defaultValue: 'n' }], methods: [], events: [] },
      ],
    };
    const app = new TMagicApp({ config: dsl, platform: 'mobile' });
    const manager = createDataSourceManager(app)!;
    return { app, manager };
  };

  test('页面数据中父、子节点都是最新编译结果，子节点不会被覆盖', () => {
    const { app, manager } = create();
    manager.get('ds_1')!.setData('v1', 'name');

    const pageData: any = app.page!.data;
    expect(pageData.items[0].title).toBe('b v1');
    expect(pageData.items[0].items[0].text).toBe('a v1');

    manager.get('ds_1')!.setData('v2', 'name');
    expect(pageData.items[0].title).toBe('b v2');
    expect(pageData.items[0].items[0].text).toBe('a v2');
  });

  test('update-data 的节点顺序为父节点在前，运行时按顺序替换不会丢失子节点更新', () => {
    const { app, manager } = create();
    const update = vi.fn();
    manager.on('update-data', update);

    manager.get('ds_1')!.setData('v1', 'name');

    const nodes = update.mock.calls[0][0] as any[];
    expect(nodes.map((n) => n.id)).toEqual(['node_b', 'node_a']);

    // 新父节点与原父节点共用同一个 items 数组
    const container: any = app.page!.data.items![0];
    expect(nodes[0].items).toBe(container.items);
  });

  test('batch 中的父子节点同样不会互相覆盖', () => {
    const { app, manager } = create();
    manager.batch(() => {
      manager.get('ds_1')!.setData('x', 'name');
      manager.get('ds_1')!.setData('y', 'name');
    });

    const pageData: any = app.page!.data;
    expect(pageData.items[0].title).toBe('b y');
    expect(pageData.items[0].items[0].text).toBe('a y');
  });
});
