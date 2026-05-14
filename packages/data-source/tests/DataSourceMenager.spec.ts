import { afterAll, afterEach, describe, expect, test, vi } from 'vitest';

import TMagicApp, {
  type MApp,
  NODE_CONDS_KEY,
  NODE_CONDS_RESULT_KEY,
  NODE_DISABLE_DATA_SOURCE_KEY,
  NodeType,
} from '@tmagic/core';

import { DataSource, DataSourceManager } from '@data-source/index';
import { SimpleObservedData } from '@data-source/observed-data/SimpleObservedData';

const app = new TMagicApp({
  config: {
    type: NodeType.ROOT,
    id: '1',
    items: [],
    dataSources: [
      {
        type: 'base',
        id: '1',
        fields: [{ name: 'name' }],
        methods: [],
        events: [],
      },
      {
        type: 'http',
        id: '2',
        fields: [{ name: 'name' }],
        methods: [],
        events: [],
      },
    ],
  },
});

afterAll(async () => {
  DataSourceManager.clearDataSourceClass();
});

describe('DataSourceManager', () => {
  const dsm = new DataSourceManager({
    app,
  });

  test('instance', () => {
    expect(dsm).toBeInstanceOf(DataSourceManager);
    expect(dsm.dataSourceMap.get('1')).toBeInstanceOf(DataSource);
    expect(dsm.dataSourceMap.get('2')?.type).toBe('http');
  });

  test('register', () => {
    class TestDataSource extends DataSource {}

    DataSourceManager.register('test', TestDataSource as any);
    expect(DataSourceManager.getDataSourceClass('test')).toBe(TestDataSource);
  });

  test('get', () => {
    const ds = dsm.get('1');
    expect(ds).toBeInstanceOf(DataSource);
  });

  test('removeDataSource', () => {
    dsm.removeDataSource('1');
    const ds = dsm.get('1');
    expect(ds).toBeUndefined();
  });

  test('updateSchema', () => {
    const dsm = new DataSourceManager({ app });

    dsm.updateSchema([
      {
        type: 'base',
        id: '1',
        fields: [{ name: 'name1' }],
        methods: [],
        events: [],
      },
    ]);
    const ds = dsm.get('1');
    expect(ds).toBeInstanceOf(DataSource);
  });

  test('destroy', () => {
    dsm.destroy();
    expect(dsm.dataSourceMap.size).toBe(0);
  });

  test('addDataSource error', async () => {
    await dsm.addDataSource({
      type: 'base',
      id: '1',
      fields: [{ name: 'name' }],
      methods: [],
      events: [],
    });
    expect(dsm.get('1')).toBeInstanceOf(DataSource);
  });
});

describe('DataSourceManager - 注册 / 等待 / observedData', () => {
  test('register 注册新的数据源类', () => {
    class Custom extends DataSource {}
    DataSourceManager.register('custom-1', Custom as any);
    expect(DataSourceManager.getDataSourceClass('custom-1')).toBe(Custom);
    DataSourceManager.clearDataSourceClass();
    expect(DataSourceManager.getDataSourceClass('custom-1')).toBeUndefined();
  });

  test('initialData 在构造时被合并到 data', () => {
    const dsm = new DataSourceManager({
      app: new TMagicApp({}),
      initialData: { 1: { name: 'preset' } },
    });
    expect(dsm.data['1']).toEqual({ name: 'preset' });
    expect(dsm.initialData['1']).toEqual({ name: 'preset' });
  });

  test('useMock 可被读取', () => {
    const dsm = new DataSourceManager({ app: new TMagicApp({}), useMock: true });
    expect(dsm.useMock).toBe(true);
  });

  test('registerObservedData 静态方法', () => {
    class Fake {}
    expect(() => DataSourceManager.registerObservedData(Fake as any)).not.toThrow();
    // 用完恢复，避免污染后续用例
    DataSourceManager.registerObservedData(SimpleObservedData);
  });
});

describe('DataSourceManager - init 生命周期', () => {
  afterEach(() => {
    DataSourceManager.clearDataSourceClass();
  });

  const createApp = (jsEngine?: any) =>
    new TMagicApp({
      // jsEngine 选填，用于走 init 中的 jsEngine 分支
      ...(jsEngine ? { jsEngine } : {}),
      config: {
        type: NodeType.ROOT,
        id: 'app_init',
        items: [],
      },
    } as any);

  test('ds.isInit 为 true 时直接跳过', async () => {
    const dsm = new DataSourceManager({ app: createApp() });
    const ds = new DataSource({
      app: createApp(),
      schema: { type: 'base', id: 'ds_skip', fields: [], methods: [], events: [] },
    });
    ds.isInit = true;
    await dsm.init(ds);
    // isInit 仍为 true，且没有抛错
    expect(ds.isInit).toBe(true);
  });

  test('jsEngine 命中 disabledInitInJsEngine 时跳过 init', async () => {
    const app = createApp('nodejs');
    const dsm = new DataSourceManager({ app });
    const ds = new DataSource({
      app,
      schema: {
        type: 'base',
        id: 'ds_disabled',
        fields: [],
        methods: [],
        events: [],
        disabledInitInJsEngine: ['nodejs'],
      } as any,
    });
    expect(ds.isInit).toBe(false);
    await dsm.init(ds);
    expect(ds.isInit).toBe(false);
  });

  test('methods 中 timing=beforeInit 的 content 会在 ds.init 之前调用', async () => {
    const app = createApp();
    const dsm = new DataSourceManager({ app });
    const beforeContent = vi.fn();
    const ds = new DataSource({
      app,
      schema: {
        type: 'base',
        id: 'ds_before',
        fields: [],
        events: [],
        methods: [{ name: 'before', content: beforeContent, timing: 'beforeInit', params: [] }],
      } as any,
    });
    await dsm.init(ds);
    expect(beforeContent).toHaveBeenCalledTimes(1);
    const arg = beforeContent.mock.calls[0][0];
    expect(arg.dataSource).toBe(ds);
    expect(arg.app).toBe(app);
    expect(ds.isInit).toBe(true);
  });

  test('methods 中 timing=afterInit 的 content 会在 ds.init 之后调用', async () => {
    const app = createApp();
    const dsm = new DataSourceManager({ app });
    const order: string[] = [];
    const afterContent = vi.fn(() => {
      order.push('after');
    });
    const ds = new DataSource({
      app,
      schema: {
        type: 'base',
        id: 'ds_after',
        fields: [],
        events: [],
        methods: [{ name: 'after', content: afterContent, timing: 'afterInit', params: [] }],
      } as any,
    });
    const origInit = ds.init.bind(ds);
    ds.init = async () => {
      order.push('init');
      await origInit();
    };
    await dsm.init(ds);
    expect(afterContent).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['init', 'after']);
  });

  test('method.content 非函数时 init 提前返回，不会执行 ds.init', async () => {
    const app = createApp();
    const dsm = new DataSourceManager({ app });
    const ds = new DataSource({
      app,
      schema: {
        type: 'base',
        id: 'ds_bad_method',
        fields: [],
        events: [],
        methods: [{ name: 'bad', content: 'not-a-function', timing: 'beforeInit', params: [] } as any],
      } as any,
    });
    const initSpy = vi.spyOn(ds, 'init');
    await dsm.init(ds);
    expect(initSpy).not.toHaveBeenCalled();
    expect(ds.isInit).toBe(false);
  });

  test('afterInit 阶段遇到非函数 content 也会提前返回', async () => {
    const app = createApp();
    const dsm = new DataSourceManager({ app });
    const afterFn = vi.fn();

    const ds = new DataSource({
      app,
      schema: {
        type: 'base',
        id: 'ds_after_bad',
        fields: [],
        events: [],
        methods: [{ name: 'before', content: () => undefined, timing: 'beforeInit', params: [] } as any],
      } as any,
    });
    // ds.init 执行之后再向 methods 中追加一个 content 非函数的 afterInit 项
    const origInit = ds.init.bind(ds);
    ds.init = async () => {
      await origInit();
      ds.setMethods([
        { name: 'bad', content: 'not-a-function', timing: 'afterInit', params: [] } as any,
        { name: 'after', content: afterFn, timing: 'afterInit', params: [] } as any,
      ]);
    };

    await dsm.init(ds);
    // 第二个循环在第一个非函数 content 处提前返回，afterFn 不会被调用
    expect(afterFn).not.toHaveBeenCalled();
    expect(ds.isInit).toBe(true);
  });

  test('beforeInit / afterInit 同时存在但 timing 不匹配时安全跳过', async () => {
    const app = createApp();
    const dsm = new DataSourceManager({ app });
    const beforeFn = vi.fn();
    const afterFn = vi.fn();
    const ds = new DataSource({
      app,
      schema: {
        type: 'base',
        id: 'ds_mixed',
        fields: [],
        events: [],
        methods: [
          { name: 'b', content: beforeFn, timing: 'beforeInit', params: [] } as any,
          { name: 'a', content: afterFn, timing: 'afterInit', params: [] } as any,
        ],
      } as any,
    });
    await dsm.init(ds);
    expect(beforeFn).toHaveBeenCalledTimes(1);
    expect(afterFn).toHaveBeenCalledTimes(1);
  });
});

describe('DataSourceManager - addDataSource 边界', () => {
  afterEach(() => {
    DataSourceManager.clearDataSourceClass();
  });

  test('config 为空时直接返回 undefined', () => {
    const dsm = new DataSourceManager({ app: new TMagicApp({}) });
    expect(dsm.addDataSource(undefined)).toBeUndefined();
  });

  test('destroy 后 waitInitSchemaList 为空，再次加入未知类型会重建 listMap', () => {
    const dsm = new DataSourceManager({ app: new TMagicApp({}) });
    dsm.destroy();
    const ret = dsm.addDataSource({
      id: 'ds_unknown_after_destroy',
      type: 'never-registered',
      fields: [{ name: 'a', defaultValue: 1 }],
      methods: [],
      events: [],
    } as any);
    expect(ret).toBeUndefined();
    expect(dsm.data.ds_unknown_after_destroy).toEqual({ a: 1 });
  });

  test('多次加入同一未知类型会推到等待列表', () => {
    const dsm = new DataSourceManager({ app: new TMagicApp({}) });
    dsm.addDataSource({
      id: 'pending_1',
      type: 'pending-shared',
      fields: [],
      methods: [],
      events: [],
    } as any);
    dsm.addDataSource({
      id: 'pending_2',
      type: 'pending-shared',
      fields: [],
      methods: [],
      events: [],
    } as any);

    class SharedDS extends DataSource {}
    DataSourceManager.register('pending-shared', SharedDS as any);

    expect(dsm.get('pending_1')).toBeInstanceOf(SharedDS);
    expect(dsm.get('pending_2')).toBeInstanceOf(SharedDS);
  });
});

describe('DataSourceManager - updateSchema 边界', () => {
  afterEach(() => {
    DataSourceManager.clearDataSourceClass();
  });

  test('传入的 schema 在 manager 中不存在时直接 return', () => {
    const dsm = new DataSourceManager({
      app: new TMagicApp({
        config: {
          type: NodeType.ROOT,
          id: 'app_us',
          items: [],
          dataSources: [{ type: 'base', id: 'real', fields: [{ name: 'a' }], methods: [], events: [] }],
        },
      }),
    });
    expect(dsm.get('real')).toBeInstanceOf(DataSource);
    dsm.updateSchema([
      { type: 'base', id: 'not_exist', fields: [{ name: 'b' }], methods: [], events: [] },
      { type: 'base', id: 'real', fields: [{ name: 'a' }], methods: [], events: [] },
    ]);
    // real 没有被删除/重建（因为遇到 not_exist 时整个 updateSchema 提前 return）
    expect(dsm.get('real')).toBeInstanceOf(DataSource);
  });

  test('updateSchema 中新 type 未注册时不会调用 init', () => {
    const dsm = new DataSourceManager({
      app: new TMagicApp({
        config: {
          type: NodeType.ROOT,
          id: 'app_us2',
          items: [],
          dataSources: [{ type: 'base', id: 'X', fields: [], methods: [], events: [] }],
        },
      }),
    });
    expect(dsm.get('X')).toBeInstanceOf(DataSource);
    dsm.updateSchema([{ type: 'never-registered', id: 'X', fields: [], methods: [], events: [] } as any]);
    expect(dsm.get('X')).toBeUndefined();
  });
});

describe('DataSourceManager - compiledNode 边界', () => {
  afterEach(() => {
    DataSourceManager.clearDataSourceClass();
  });

  const createManager = () =>
    new DataSourceManager({
      app: new TMagicApp({
        config: {
          type: NodeType.ROOT,
          id: 'app_cn',
          items: [],
          dataSources: [
            {
              type: 'base',
              id: 'ds_cn',
              fields: [{ name: 'val', defaultValue: 'V' }],
              methods: [],
              events: [],
            },
          ],
          dataSourceDeps: {
            ds_cn: {
              text_a: { name: 'text', keys: ['text'] },
            },
          } as any,
        },
      }),
    });

  test('节点带 NODE_DISABLE_DATA_SOURCE_KEY 时直接返回原节点', () => {
    const dsm = createManager();
    const node: any = {
      id: 'text_a',
      type: 'text',
      text: 'hello ${ds_cn.val}',
      [NODE_DISABLE_DATA_SOURCE_KEY]: true,
    };
    expect(dsm.compiledNode(node)).toBe(node);
  });

  test('deep=true 时数组 items 会递归编译', () => {
    const dsm = createManager();
    const node: any = {
      id: 'wrap',
      type: 'container',
      items: [{ id: 'text_a', type: 'text', text: 'hi ${ds_cn.val}' }],
    };
    const compiled: any = dsm.compiledNode(node, undefined, true);
    expect(compiled.items[0].text).toBe('hi V');
  });

  test('deep=false 时 items 保持原样', () => {
    const dsm = createManager();
    const items = [{ id: 'text_a', type: 'text', text: 'hi ${ds_cn.val}' }];
    const node: any = { id: 'wrap', type: 'container', items };
    const compiled: any = dsm.compiledNode(node);
    expect(compiled.items).toBe(items);
  });

  test('节点 condResult=false 时跳过模板编译', () => {
    const dsm = createManager();
    const node: any = {
      id: 'text_a',
      type: 'text',
      text: 'hi ${ds_cn.val}',
      condResult: false,
    };
    const compiled: any = dsm.compiledNode(node);
    expect(compiled.text).toBe('hi ${ds_cn.val}');
  });

  test('condResult=undefined 且 NODE_CONDS_RESULT_KEY=true 时也跳过模板编译', () => {
    const dsm = createManager();
    const node: any = {
      id: 'text_a',
      type: 'text',
      text: 'hi ${ds_cn.val}',
      [NODE_CONDS_RESULT_KEY]: true,
    };
    const compiled: any = dsm.compiledNode(node);
    expect(compiled.text).toBe('hi ${ds_cn.val}');
  });

  test('dsl.dataSourceDeps 缺失时使用空依赖对象', () => {
    const app = new TMagicApp({
      config: {
        type: NodeType.ROOT,
        id: 'app_no_deps',
        items: [],
        dataSources: [
          { type: 'base', id: 'ds_nd', fields: [{ name: 'v', defaultValue: 'V' }], methods: [], events: [] },
        ],
      },
    });
    expect(app.dsl?.dataSourceDeps).toBeUndefined();
    const dsm = new DataSourceManager({ app });
    const node: any = { id: 'p', type: 'text', text: 'hi' };
    const compiled = dsm.compiledNode(node) as any;
    expect(compiled.text).toBe('hi');
  });
});

describe('DataSourceManager - compliedConds 边界', () => {
  afterEach(() => {
    DataSourceManager.clearDataSourceClass();
  });

  test('NODE_DISABLE_DATA_SOURCE_KEY=true 时直接返回 true', () => {
    const dsm = new DataSourceManager({ app: new TMagicApp({}) });
    expect(
      dsm.compliedConds({
        [NODE_DISABLE_DATA_SOURCE_KEY]: true,
        [NODE_CONDS_KEY]: [{ cond: [{ field: ['ds_1', 'a'], op: '=', value: 1 }] }] as any,
      }),
    ).toBe(true);
  });

  test('NODE_CONDS_RESULT_KEY 为真时会对条件结果取反', () => {
    const dsm = new DataSourceManager({ app: new TMagicApp({}) });
    dsm.data.ds_x = { a: 1 };
    // 条件成立 -> compliedConditions 返回 true，再取反应为 false
    expect(
      dsm.compliedConds({
        [NODE_CONDS_KEY]: [{ cond: [{ field: ['ds_x', 'a'], op: '=', value: 1 }] }] as any,
        [NODE_CONDS_RESULT_KEY]: true,
      }),
    ).toBe(false);
  });
});

describe('DataSourceManager - 迭代器相关方法', () => {
  afterEach(() => {
    DataSourceManager.clearDataSourceClass();
  });

  const createManager = () =>
    new DataSourceManager({
      app: new TMagicApp({
        config: {
          type: NodeType.ROOT,
          id: 'app_iter',
          items: [],
          dataSources: [
            {
              type: 'base',
              id: 'ds_iter',
              fields: [
                {
                  name: 'list',
                  type: 'array',
                  fields: [{ name: 'label' }],
                  defaultValue: [{ label: 'A' }],
                },
              ],
              methods: [],
              events: [],
            },
          ],
        },
      }),
    });

  test('compliedIteratorItemConds: dataSourceField 指向未知数据源时返回 true', () => {
    const dsm = createManager();
    const result = dsm.compliedIteratorItemConds(
      { label: 'x' },
      { [NODE_CONDS_KEY]: [{ cond: [{ field: ['ds_iter', 'list', 'label'], op: '=', value: 'x' }] }] } as any,
      ['no_such_ds', 'list'],
    );
    expect(result).toBe(true);
  });

  test('compliedIteratorItemConds: 使用迭代上下文计算条件', () => {
    const dsm = createManager();
    const node: any = {
      [NODE_CONDS_KEY]: [{ cond: [{ field: ['ds_iter', 'list', 'label'], op: '=', value: 'B' }] }],
    };
    expect(dsm.compliedIteratorItemConds({ label: 'B' }, node, ['ds_iter', 'list'])).toBe(true);
    expect(dsm.compliedIteratorItemConds({ label: 'A' }, node, ['ds_iter', 'list'])).toBe(false);
  });

  test('compliedIteratorItems: 未知数据源时原样返回 nodes', () => {
    const dsm = createManager();
    const nodes: any = [{ id: 'iter_1', type: 'text', text: '${ds_iter.list.label}' }];
    expect(dsm.compliedIteratorItems({ label: 'B' }, nodes, ['no_such_ds'])).toBe(nodes);
  });

  test('compliedIteratorItems: 无 deps / condDeps 时原样返回 nodes', () => {
    const dsm = createManager();
    const nodes: any = [{ id: 'plain', type: 'text', text: 'plain' }];
    expect(dsm.compliedIteratorItems({ label: 'B' }, nodes, ['ds_iter', 'list'])).toBe(nodes);
  });

  test('compliedIteratorItems: 命中 deps 时按迭代上下文进行编译', () => {
    const dsm = createManager();
    const nodes: any = [{ id: 'iter_text', type: 'text', text: 'hello ${ds_iter.list.label}' }];
    const compiled = dsm.compliedIteratorItems({ label: 'B' }, nodes, ['ds_iter', 'list']);
    expect(compiled[0]).not.toBe(nodes[0]);
    expect((compiled[0] as any).text).toBe('hello B');
  });
});

describe('DataSourceManager - onDataChange / offDataChange', () => {
  afterEach(() => {
    DataSourceManager.clearDataSourceClass();
  });

  test('onDataChange / offDataChange 转发到对应数据源', () => {
    const dsm = new DataSourceManager({
      app: new TMagicApp({
        config: {
          type: NodeType.ROOT,
          id: 'app_odc',
          items: [],
          dataSources: [{ type: 'base', id: 'ds_odc', fields: [{ name: 'name' }], methods: [], events: [] }],
        },
      }),
    });

    const callback = vi.fn();
    dsm.onDataChange('ds_odc', 'name', callback);

    const ds = dsm.get('ds_odc')!;
    ds.setData('A', 'name');
    expect(callback).toHaveBeenCalledTimes(1);

    dsm.offDataChange('ds_odc', 'name', callback);
    ds.setData('B', 'name');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('数据源不存在时 onDataChange / offDataChange 安全返回 undefined', () => {
    const dsm = new DataSourceManager({ app: new TMagicApp({}) });
    const callback = vi.fn();
    expect(dsm.onDataChange('no_id', 'a', callback)).toBeUndefined();
    expect(dsm.offDataChange('no_id', 'a', callback)).toBeUndefined();
  });
});

describe('DataSourceManager - callDsInit 异常 / 兼容分支', () => {
  afterEach(() => {
    DataSourceManager.clearDataSourceClass();
    vi.restoreAllMocks();
  });

  const buildConfig = (id: string): MApp => ({
    type: NodeType.ROOT,
    id,
    items: [],
    dataSources: [
      { type: 'base', id: 'ds_ok', fields: [{ name: 'a', defaultValue: 1 }], methods: [], events: [] },
      { type: 'base', id: 'ds_err', fields: [{ name: 'b', defaultValue: 2 }], methods: [], events: [] },
    ],
  });

  test('init 完成但 this.data[dsId] 为空时走 delete 分支', async () => {
    const app = new TMagicApp({ config: buildConfig('app_empty_data') });
    const dsm = new DataSourceManager({ app });
    // 在 Promise.allSettled 的 .then() 微任务执行之前把 data 清空
    dsm.data = {} as any;

    const [data, errors] = await new Promise<any[]>((resolve) => {
      dsm.once('init', (...args: any[]) => resolve(args));
    });
    // 由于 this.data[dsId] 为空，data 中也不会包含对应 dsId
    expect(data.ds_ok).toBeUndefined();
    expect(data.ds_err).toBeUndefined();
    expect(Object.keys(errors)).toHaveLength(0);
  });

  test('init 抛错时通过 Promise.allSettled 的 rejected 分支收集 errors', async () => {
    const initSpy = vi.spyOn(DataSource.prototype, 'init').mockImplementation(async function (this: DataSource) {
      if (this.id === 'ds_err') {
        throw new Error('boom');
      }
      // ok 路径
      (this as any).isInit = true;
    });

    const app = new TMagicApp({ config: buildConfig('app_err') });
    const dsm = new DataSourceManager({ app });

    const [data, errors] = await new Promise<any[]>((resolve) => {
      dsm.once('init', (...args: any[]) => resolve(args));
    });
    expect(data.ds_ok).toEqual({ a: 1 });
    expect(data.ds_err).toBeUndefined();
    expect(errors.ds_err).toBeInstanceOf(Error);
    expect(errors.ds_err.message).toBe('boom');

    initSpy.mockRestore();
  });

  test('Promise.allSettled 不可用时走 Promise.all 兼容分支并发出 init 事件', async () => {
    const original = Promise.allSettled;
    (Promise as any).allSettled = undefined;

    try {
      const app = new TMagicApp({ config: buildConfig('app_compat') });
      const dsm = new DataSourceManager({ app });

      await new Promise<void>((resolve) => {
        dsm.once('init', () => resolve());
      });
      expect(dsm.data.ds_ok).toEqual({ a: 1 });
      expect(dsm.data.ds_err).toEqual({ b: 2 });
    } finally {
      (Promise as any).allSettled = original;
    }
  });

  test('Promise.allSettled 不可用且 init 抛错时进入 catch 分支', async () => {
    const original = Promise.allSettled;
    (Promise as any).allSettled = undefined;
    const initSpy = vi.spyOn(DataSource.prototype, 'init').mockRejectedValue(new Error('compat-boom'));

    try {
      const app = new TMagicApp({ config: buildConfig('app_compat_err') });
      const dsm = new DataSourceManager({ app });

      // 在兼容路径下，catch 分支也会发 init 事件
      const data = await new Promise<any>((resolve) => {
        dsm.once('init', (...args: any[]) => resolve(args[0]));
      });
      expect(data).toBeDefined();
    } finally {
      (Promise as any).allSettled = original;
      initSpy.mockRestore();
    }
  });
});
