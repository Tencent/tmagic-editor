import { describe, expect, test, vi } from 'vitest';

import { MApp, NodeType } from '@tmagic/schema';

import App from '../src/App';
import TMagicIteratorContainer from '../src/IteratorContainer';
import Node from '../src/Node';

const createAppDsl = (pageLength: number, nodeLength = 0) => {
  const dsl: MApp = {
    type: NodeType.ROOT,
    id: 'app_1',
    dataSources: [
      {
        id: 'ds_1',
        fields: [
          {
            type: 'array',
            name: 'array',
            title: 'array',
            enable: true,
            fields: [
              {
                type: 'array',
                name: 'arr',
                title: 'arr',
                defaultValue: [],
                enable: true,
                fields: [],
              },
            ],
          },
        ],
        events: [],
        methods: [],
        type: 'base',
      },
    ],
    dataSourceDeps: {},
    dataSourceCondDeps: {},
    items: [
      ...new Array(pageLength)
        .fill({
          type: NodeType.PAGE,
          items: new Array(nodeLength)
            .fill({
              type: 'text',
            })
            .map((node, index) => ({
              ...node,
              id: `text_${index}`,
            })),
        })
        .map((page, index) => ({
          ...page,
          id: `page_${index}`,
        })),
      {
        type: NodeType.PAGE_FRAGMENT,
        id: 'page_fragment_1',
        items: [
          {
            type: 'text',
            id: 'text_page_fragment',
            text: 'text_page_fragment',
          },
        ],
      },
    ],
  };

  return dsl;
};

describe('App', () => {
  test('instance', () => {
    const app = new App({});
    expect(app).toBeInstanceOf(App);
  });

  test('page', () => {
    const app = new App({
      config: createAppDsl(2),
    });
    expect(app.getNode('page_0')?.data.id).toBe('page_0');
    expect(app.page?.data.id).toBe('page_0');

    app.setConfig(createAppDsl(3), 'page_1');
    expect(app.page?.data.id).toBe('page_1');

    app.setPage('page_2');
    expect(app.page?.data.id).toBe('page_2');
  });

  test('node', () => {
    const app = new App({
      config: createAppDsl(1, 10),
    });

    expect(app.getNode('text_1')?.data.id).toBe('text_1');
  });

  test('iterator-container', () => {
    const dsl = createAppDsl(1, 10);

    dsl.items[0].items.push({
      type: 'iterator-container',
      id: 'iterator-container_1',
      items: [
        {
          type: 'text',
          id: 'text',
        },
      ],
    });

    const app = new App({
      config: dsl,
    });

    const ic = app.getNode('iterator-container_1') as unknown as TMagicIteratorContainer;

    expect(ic?.data.id).toBe('iterator-container_1');

    ic?.setNodes(
      [
        {
          type: 'text',
          id: 'text',
          text: '1',
        },
        {
          type: 'page-fragment-container',
          id: 'page_fragment_container_1',
          pageFragmentId: 'page_fragment_1',
        },
        {
          type: 'iterator-container',
          id: 'iterator-container_11',
          items: [
            {
              type: 'text',
              id: 'text',
            },
          ],
        },
      ],
      0,
    );

    ic?.setNodes(
      [
        {
          type: 'text',
          id: 'text',
          text: '2',
        },
        {
          type: 'iterator-container',
          id: 'iterator-container_11',
          items: [
            {
              type: 'text',
              id: 'text',
            },
          ],
        },
      ],
      1,
    );

    expect(app.getNode('text', { iteratorContainerId: ['iterator-container_1'], iteratorIndex: [0] })?.data.text).toBe(
      '1',
    );
    expect(app.getNode('text', { iteratorContainerId: ['iterator-container_1'], iteratorIndex: [1] })?.data.text).toBe(
      '2',
    );
    expect(
      app.getNode('text_page_fragment', { iteratorContainerId: ['iterator-container_1'], iteratorIndex: [0] })?.data
        .text,
    ).toBe('text_page_fragment');

    const ic1 = app.getNode('iterator-container_11', {
      iteratorContainerId: ['iterator-container_1'],
      iteratorIndex: [0],
    }) as unknown as TMagicIteratorContainer;

    ic1?.setNodes(
      [
        {
          type: 'text',
          id: 'text',
          text: '111',
        },
      ],
      0,
    );

    ic1?.setNodes(
      [
        {
          type: 'text',
          id: 'text',
          text: '222',
        },
      ],
      1,
    );

    const ic2 = app.getNode('iterator-container_11', {
      iteratorContainerId: ['iterator-container_1'],
      iteratorIndex: [1],
    }) as unknown as TMagicIteratorContainer;

    ic2?.setNodes(
      [
        {
          type: 'text',
          id: 'text',
          text: '11',
        },
      ],
      0,
    );

    ic2?.setNodes(
      [
        {
          type: 'text',
          id: 'text',
          text: '22',
        },
      ],
      1,
    );

    expect(
      app.getNode('text', {
        iteratorContainerId: ['iterator-container_1', 'iterator-container_11'],
        iteratorIndex: [0, 0],
      })?.data.text,
    ).toBe('111');
    expect(
      app.getNode('text', {
        iteratorContainerId: ['iterator-container_1', 'iterator-container_11'],
        iteratorIndex: [0, 1],
      })?.data.text,
    ).toBe('222');
    expect(
      app.getNode('text', {
        iteratorContainerId: ['iterator-container_1', 'iterator-container_11'],
        iteratorIndex: [1, 0],
      })?.data.text,
    ).toBe('11');
    expect(
      app.getNode('text', {
        iteratorContainerId: ['iterator-container_1', 'iterator-container_11'],
        iteratorIndex: [1, 1],
      })?.data.text,
    ).toBe('22');

    ic.resetNodes();

    expect(ic2?.nodes.length).toBe(0);
  });
});

describe('App 配置/方法/组件注册', () => {
  test('platform=editor 时不创建 eventHelper', () => {
    const app = new App({ platform: 'editor' });
    expect(app.eventHelper).toBeUndefined();
    expect(app.platform).toBe('editor');
  });

  test('disabledFlexible 时不创建 flexible', () => {
    const app = new App({ disabledFlexible: true });
    expect((app as any).flexible).toBeUndefined();
  });

  test('设置自定义 iteratorContainerType / pageFragmentContainerType', () => {
    const app = new App({
      iteratorContainerType: ['my-iter', 'custom-iter'],
      pageFragmentContainerType: 'my-frag',
    });
    expect(app.iteratorContainerType.has('my-iter')).toBe(true);
    expect(app.iteratorContainerType.has('custom-iter')).toBe(true);
    expect(app.pageFragmentContainerType.has('my-frag')).toBe(true);
  });

  test('useMock=true 透传到 DataSourceManager', () => {
    const app = new App({ useMock: true });
    expect(app.useMock).toBe(true);
  });

  test('registerComponent / resolveComponent / unregisterComponent', () => {
    const app = new App({});
    const comp = { tag: 'x' };
    app.registerComponent('my', comp);
    expect(app.resolveComponent('my')).toBe(comp);
    app.unregisterComponent('my');
    expect(app.resolveComponent('my')).toBeUndefined();
  });

  test('registerNode 静态方法存入 nodeClassMap', () => {
    class Custom extends Node {}
    App.registerNode('custom-type', Custom);
    expect(App.nodeClassMap.get('custom-type')).toBe(Custom);
  });

  test('setEnv 接受字符串/Env 实例', () => {
    const app = new App({});
    app.setEnv();
    expect(app.env).toBeDefined();
    app.setEnv('Mozilla/5.0');
    expect(app.env).toBeDefined();
  });

  test('getPage / getNode 默认返回当前 page', () => {
    const app = new App({
      config: {
        type: NodeType.ROOT,
        id: 'app',
        items: [{ type: NodeType.PAGE, id: 'p1', items: [{ id: 'btn', type: 'button' }] }],
      },
    });
    expect(app.getPage()).toBe(app.page);
    expect(app.getPage('p1')).toBe(app.page);
    expect(app.getPage('not-exist')).toBeUndefined();
    expect(app.getNode('btn')?.data.id).toBe('btn');
  });

  test('setPage 不存在时清空当前 page', () => {
    const app = new App({
      config: {
        type: NodeType.ROOT,
        id: 'app',
        items: [{ type: NodeType.PAGE, id: 'p1', items: [] }],
      },
    });
    app.setPage('not-exist');
    expect(app.page).toBeUndefined();
  });

  test('runCode 执行代码块', async () => {
    const fn = vi.fn();
    const app = new App({
      config: {
        type: NodeType.ROOT,
        id: 'app',
        items: [{ type: NodeType.PAGE, id: 'p1', items: [] }],
        codeBlocks: { c1: { name: 'c1', content: fn, params: [] } },
      },
    });
    await app.runCode('c1', { p: 1 }, []);
    expect(fn).toHaveBeenCalled();
  });

  test('runCode 抛错时进入 errorHandler', async () => {
    const errorHandler = vi.fn();
    const app = new App({
      errorHandler,
      config: {
        type: NodeType.ROOT,
        id: 'app',
        items: [{ type: NodeType.PAGE, id: 'p1', items: [] }],
        codeBlocks: {
          c1: {
            name: 'c1',
            content: () => {
              throw new Error('boom');
            },
            params: [],
          },
        },
      },
    });
    await app.runCode('c1', {}, []);
    expect(errorHandler).toHaveBeenCalled();
  });

  test('runDataSourceMethod 调用 schema methods 中的 content', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const app = new App({
      config: {
        type: NodeType.ROOT,
        id: 'app',
        items: [{ type: NodeType.PAGE, id: 'p1', items: [] }],
        dataSources: [
          {
            type: 'base',
            id: 'ds_1',
            fields: [],
            methods: [{ name: 'doIt', content: fn, params: [] }],
            events: [],
          },
        ],
      } as any,
    });
    await app.runDataSourceMethod('ds_1', 'doIt', { p: 1 }, []);
    expect(fn).toHaveBeenCalled();
  });

  test('runDataSourceMethod 不存在的数据源直接返回', async () => {
    const app = new App({
      config: {
        type: NodeType.ROOT,
        id: 'app',
        items: [{ type: NodeType.PAGE, id: 'p1', items: [] }],
      },
    });
    await expect(app.runDataSourceMethod('not', 'm', {}, [])).resolves.toBeUndefined();
    await expect(app.runDataSourceMethod('', '', {}, [])).resolves.toBeUndefined();
  });

  test('emit 触发 node 事件时走 eventHelper', () => {
    const app = new App({
      config: {
        type: NodeType.ROOT,
        id: 'app',
        items: [
          {
            type: NodeType.PAGE,
            id: 'p1',
            items: [{ id: 'btn', type: 'button', events: [{ name: 'click', actions: [] }] }],
          },
        ],
      } as any,
    });
    const node = app.getNode('btn')!;
    const result = app.emit('click', node, 'arg1');
    expect(typeof result).toBe('boolean');
  });

  // 回归用例：节点配置了 events 时，eventHelper 派发不能短路掉 super.emit，
  // 即 app.on(name, cb) 注册的回调依然要被触发。
  test('emit: 节点已绑定 events 时，app.on 注册的监听器仍然会被调用', () => {
    const app = new App({
      config: {
        type: NodeType.ROOT,
        id: 'app',
        items: [
          {
            type: NodeType.PAGE,
            id: 'p1',
            items: [{ id: 'btn', type: 'button', events: [{ name: 'click', actions: [] }] }],
          },
        ],
      } as any,
    });
    const node = app.getNode('btn')!;
    const cb = vi.fn();
    app.on('click', cb);

    const result = app.emit('click', node, 'arg1');

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(node, 'arg1');
    // EventEmitter.emit 在有 listener 时返回 true
    expect(result).toBe(true);
  });

  test('emit: 未命中节点 eventKeys 时，app.on 注册的监听器正常被调用', () => {
    const app = new App({
      config: {
        type: NodeType.ROOT,
        id: 'app',
        items: [
          {
            type: NodeType.PAGE,
            id: 'p1',
            items: [{ id: 'btn', type: 'button' }],
          },
        ],
      } as any,
    });
    const node = app.getNode('btn')!;
    const cb = vi.fn();
    app.on('click', cb);

    app.emit('click', node, 'arg1');

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(node, 'arg1');
  });

  test('destroy 清理所有资源', () => {
    const app = new App({
      config: {
        type: NodeType.ROOT,
        id: 'app',
        items: [{ type: NodeType.PAGE, id: 'p1', items: [{ id: 'btn', type: 'button' }] }],
      },
    });
    app.destroy();
    expect(app.page).toBeUndefined();
    expect(app.dsl).toBeUndefined();
    expect(app.components.size).toBe(0);
  });
});
