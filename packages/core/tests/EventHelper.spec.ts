/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  ActionType,
  type MApp,
  NODE_DISABLE_CODE_BLOCK_KEY,
  NODE_DISABLE_DATA_SOURCE_KEY,
  NodeType,
} from '@tmagic/schema';
import { DATA_SOURCE_FIELDS_CHANGE_EVENT_PREFIX } from '@tmagic/utils';

import App from '../src/App';
import EventHelper from '../src/EventHelper';
import FlowState from '../src/FlowState';

const flushAsync = () => new Promise((r) => setTimeout(r, 0));

const createDsl = (overrides: Partial<MApp> = {}): MApp => ({
  type: NodeType.ROOT,
  id: 'app',
  items: [
    {
      type: NodeType.PAGE,
      id: 'page_1',
      items: [
        {
          id: 'btn_1',
          type: 'button',
        },
        {
          id: 'btn_2',
          type: 'button',
        },
      ],
    },
  ],
  ...overrides,
});

describe('EventHelper 构造与销毁', () => {
  test('实例化继承 EventEmitter 并保存 app 引用', () => {
    const app = new App({});
    const helper = new EventHelper({ app });
    expect(helper).toBeInstanceOf(EventHelper);
    expect(helper.app).toBe(app);
    expect(helper.eventQueue).toEqual([]);
  });

  test('destroy 清空内部状态与监听器', () => {
    const app = new App({ config: createDsl() });
    const helper = app.eventHelper!;
    const handler = vi.fn();
    helper.on('foo', handler);

    helper.destroy();
    helper.emit('foo');
    expect(handler).not.toHaveBeenCalled();
    expect((helper as any).nodeEventList.size).toBe(0);
    expect((helper as any).dataSourceEventList.size).toBe(0);
  });
});

describe('EventHelper - bindNodeEvents / initEvents / removeNodeEvents', () => {
  test('忽略没有 name 的事件配置', () => {
    const app = new App({ config: createDsl() });
    const helper = app.eventHelper!;
    const node = app.getNode('btn_1')!;

    node.events = [{ name: '', actions: [] } as any];
    helper.bindNodeEvents(node);

    expect((helper as any).nodeEventList.size).toBe(0);
  });

  test('为带 name 的事件创建 symbol 并写入 eventKeys', () => {
    const app = new App({ config: createDsl() });
    const helper = app.eventHelper!;
    const node = app.getNode('btn_1')!;

    node.events = [{ name: 'click', actions: [] }];
    node.eventKeys.clear();
    helper.bindNodeEvents(node);

    expect(node.eventKeys.has(`click_${node.data.id}`)).toBe(true);
    expect((helper as any).nodeEventList.size).toBe(1);
  });

  test('已存在的 eventKey 会被复用而不是重新创建', () => {
    const app = new App({ config: createDsl() });
    const helper = app.eventHelper!;
    const node = app.getNode('btn_1')!;

    const existingSymbol = Symbol('click_btn_1');
    node.eventKeys.set(`click_${node.data.id}`, existingSymbol);
    node.events = [{ name: 'click', actions: [] }];

    helper.bindNodeEvents(node);
    expect(node.eventKeys.get(`click_${node.data.id}`)).toBe(existingSymbol);
  });

  test('${nodeId}.${eventName} 形式将命名空间转换为 ${eventName}_${nodeId}', () => {
    const app = new App({ config: createDsl() });
    const helper = app.eventHelper!;
    const node = app.getNode('btn_1')!;

    node.events = [{ name: 'btn_2.click', actions: [] }];
    node.eventKeys.clear();

    helper.bindNodeEvents(node);
    expect(node.eventKeys.has('click_btn_2')).toBe(true);
  });

  test('initEvents 会为 page 和 pageFragments 内的节点都绑定事件', () => {
    const dsl = createDsl({
      items: [
        {
          type: NodeType.PAGE,
          id: 'page_1',
          items: [
            {
              id: 'pf_container',
              type: 'page-fragment-container',
              pageFragmentId: 'pf_1',
            },
            {
              id: 'btn_in_page',
              type: 'button',
              events: [{ name: 'click', actions: [] }],
            },
          ],
        },
        {
          type: NodeType.PAGE_FRAGMENT,
          id: 'pf_1',
          items: [
            {
              id: 'btn_in_pf',
              type: 'button',
              events: [{ name: 'click', actions: [] }],
            },
          ],
        },
      ],
    } as any);

    const app = new App({ config: dsl });
    const helper = app.eventHelper!;
    expect(app.pageFragments.size).toBe(1);

    helper.initEvents();
    expect((helper as any).nodeEventList.size).toBeGreaterThanOrEqual(2);
  });

  test('removeNodeEvents 会移除全部 node 上注册的监听', () => {
    const app = new App({
      config: createDsl({
        items: [
          {
            type: NodeType.PAGE,
            id: 'page_1',
            items: [
              {
                id: 'btn_1',
                type: 'button',
                events: [{ name: 'click', actions: [] }],
              },
            ],
          },
        ],
      } as any),
    });

    const helper = app.eventHelper!;
    expect((helper as any).nodeEventList.size).toBe(1);

    helper.removeNodeEvents();
    expect((helper as any).nodeEventList.size).toBe(0);
  });
});

describe('EventHelper - 事件队列', () => {
  test('addEventToQueue / getEventQueue', () => {
    const app = new App({});
    const helper = new EventHelper({ app });

    helper.addEventToQueue({ toId: 'x', method: 'm', fromCpt: null, args: [1] });
    expect(helper.getEventQueue()).toHaveLength(1);
    expect(helper.getEventQueue()[0].toId).toBe('x');
  });
});

describe('EventHelper - eventHandler / actionHandler 流程', () => {
  let beforeHandler: ReturnType<typeof vi.fn>;
  let afterHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    beforeHandler = vi.fn();
    afterHandler = vi.fn();
  });

  test('emit click 时执行 EventConfig.actions 并触发 before/after 钩子', async () => {
    const fromInstance = { doIt: vi.fn() };
    const toInstance = { doIt: vi.fn() };

    const app = new App({
      beforeEventHandler: beforeHandler,
      afterEventHandler: afterHandler,
      config: createDsl({
        items: [
          {
            type: NodeType.PAGE,
            id: 'page_1',
            items: [
              {
                id: 'btn_1',
                type: 'button',
                events: [
                  {
                    name: 'click',
                    actions: [{ actionType: ActionType.COMP, to: 'btn_2', method: 'doIt' }],
                  },
                ],
              },
              { id: 'btn_2', type: 'button' },
            ],
          },
        ],
      } as any),
    });

    const fromNode = app.getNode('btn_1')!;
    const toNode = app.getNode('btn_2')!;
    fromNode.setInstance(fromInstance);
    toNode.setInstance(toInstance);

    app.emit('click', fromNode, 'extraArg');
    await flushAsync();

    expect(beforeHandler).toHaveBeenCalled();
    expect(afterHandler).toHaveBeenCalled();
    expect(toInstance.doIt).toHaveBeenCalled();
    expect(toInstance.doIt.mock.calls[0][1]).toBe('extraArg');
  });

  test('actions 中如果 flowState.isAbort 为 true 会中断后续 action', async () => {
    const action2Spy = vi.fn();
    const codeBlocks = {
      abortCode: {
        name: 'abortCode',
        params: [],
        content: ({ flowState }: any) => {
          flowState.abort();
        },
      },
      shouldNotRun: {
        name: 'shouldNotRun',
        params: [],
        content: action2Spy,
      },
    };

    const app = new App({
      config: createDsl({
        items: [
          {
            type: NodeType.PAGE,
            id: 'page_1',
            items: [
              {
                id: 'btn_1',
                type: 'button',
                events: [
                  {
                    name: 'click',
                    actions: [
                      { actionType: ActionType.CODE, codeId: 'abortCode' } as any,
                      { actionType: ActionType.CODE, codeId: 'shouldNotRun' } as any,
                    ],
                  },
                ],
              },
            ],
          },
        ],
        codeBlocks,
      } as any),
    });

    app.emit('click', app.getNode('btn_1')!);
    await flushAsync();
    await flushAsync();

    expect(action2Spy).not.toHaveBeenCalled();
  });

  test('CODE action 在 NODE_DISABLE_CODE_BLOCK_KEY=true 时跳过', async () => {
    const codeFn = vi.fn();
    const app = new App({
      config: createDsl({
        codeBlocks: { c: { name: 'c', params: [], content: codeFn } },
        items: [
          {
            type: NodeType.PAGE,
            id: 'page_1',
            items: [
              {
                id: 'btn_1',
                type: 'button',
                [NODE_DISABLE_CODE_BLOCK_KEY]: true,
                events: [
                  {
                    name: 'click',
                    actions: [{ actionType: ActionType.CODE, codeId: 'c' } as any],
                  },
                ],
              },
            ],
          },
        ],
      } as any),
    });

    app.emit('click', app.getNode('btn_1')!);
    await flushAsync();
    expect(codeFn).not.toHaveBeenCalled();
  });

  test('DATA_SOURCE action 正常执行时通过 runDataSourceMethod 调用', async () => {
    const methodFn = vi.fn().mockResolvedValue('ok');
    const app = new App({
      config: createDsl({
        dataSources: [
          {
            id: 'ds_1',
            type: 'base',
            fields: [],
            events: [],
            methods: [{ name: 'fetch', params: [], content: methodFn }],
          },
        ],
        items: [
          {
            type: NodeType.PAGE,
            id: 'page_1',
            items: [
              {
                id: 'btn_1',
                type: 'button',
                events: [
                  {
                    name: 'click',
                    actions: [
                      {
                        actionType: ActionType.DATA_SOURCE,
                        dataSourceMethod: ['ds_1', 'fetch'],
                        params: { x: 1 },
                      } as any,
                    ],
                  },
                ],
              },
            ],
          },
        ],
      } as any),
    });

    app.emit('click', app.getNode('btn_1')!);
    await flushAsync();
    await flushAsync();
    expect(methodFn).toHaveBeenCalled();
    expect(methodFn.mock.calls[0][0].params).toEqual({ x: 1 });
  });

  test('DATA_SOURCE action 在 NODE_DISABLE_DATA_SOURCE_KEY=true 时跳过', async () => {
    const methodFn = vi.fn();
    const app = new App({
      config: createDsl({
        dataSources: [
          {
            id: 'ds_1',
            type: 'base',
            fields: [],
            events: [],
            methods: [{ name: 'fetch', params: [], content: methodFn }],
          },
        ],
        items: [
          {
            type: NodeType.PAGE,
            id: 'page_1',
            items: [
              {
                id: 'btn_1',
                type: 'button',
                [NODE_DISABLE_DATA_SOURCE_KEY]: true,
                events: [
                  {
                    name: 'click',
                    actions: [
                      {
                        actionType: ActionType.DATA_SOURCE,
                        dataSourceMethod: ['ds_1', 'fetch'],
                      } as any,
                    ],
                  },
                ],
              },
            ],
          },
        ],
      } as any),
    });

    app.emit('click', app.getNode('btn_1')!);
    await flushAsync();
    expect(methodFn).not.toHaveBeenCalled();
  });

  test('actionHandler 抛错时调用 errorHandler', async () => {
    const errorHandler = vi.fn();
    const app = new App({
      errorHandler,
      config: createDsl({
        codeBlocks: {
          boom: {
            name: 'boom',
            params: [],
            content: () => {
              throw new Error('boom');
            },
          },
        },
        items: [
          {
            type: NodeType.PAGE,
            id: 'page_1',
            items: [
              {
                id: 'btn_1',
                type: 'button',
                events: [
                  {
                    name: 'click',
                    actions: [{ actionType: ActionType.CODE, codeId: 'boom' } as any],
                  },
                ],
              },
            ],
          },
        ],
      } as any),
    });

    app.emit('click', app.getNode('btn_1')!);
    await flushAsync();
    await flushAsync();
    expect(errorHandler).toHaveBeenCalled();
  });

  test('兼容 DeprecatedEventConfig：没有 actions 字段时走 compActionHandler', async () => {
    const targetInstance = { ping: vi.fn() };
    const app = new App({
      config: createDsl({
        items: [
          {
            type: NodeType.PAGE,
            id: 'page_1',
            items: [
              {
                id: 'btn_1',
                type: 'button',
                events: [{ name: 'click', to: 'btn_2', method: 'ping' } as any],
              },
              { id: 'btn_2', type: 'button' },
            ],
          },
        ],
      } as any),
    });

    const fromNode = app.getNode('btn_1')!;
    app.getNode('btn_2')!.setInstance(targetInstance);

    app.emit('click', fromNode);
    await flushAsync();

    expect(targetInstance.ping).toHaveBeenCalled();
  });

  test('compActionHandler 找不到目标节点时进入 eventQueue', async () => {
    const app = new App({
      config: createDsl({
        items: [
          {
            type: NodeType.PAGE,
            id: 'page_1',
            items: [
              {
                id: 'btn_1',
                type: 'button',
                events: [
                  {
                    name: 'click',
                    actions: [{ actionType: ActionType.COMP, to: 'not-exist', method: 'foo' }],
                  },
                ],
              },
            ],
          },
        ],
      } as any),
    });

    app.emit('click', app.getNode('btn_1')!);
    await flushAsync();

    expect(app.eventHelper!.getEventQueue()).toHaveLength(1);
    expect(app.eventHelper!.getEventQueue()[0].toId).toBe('not-exist');
    expect(app.eventHelper!.getEventQueue()[0].method).toBe('foo');
  });

  test('compActionHandler：目标节点没有 instance 时方法入 node.eventQueue', async () => {
    const app = new App({
      config: createDsl({
        items: [
          {
            type: NodeType.PAGE,
            id: 'page_1',
            items: [
              {
                id: 'btn_1',
                type: 'button',
                events: [
                  {
                    name: 'click',
                    actions: [{ actionType: ActionType.COMP, to: 'btn_2', method: 'foo' }],
                  },
                ],
              },
              { id: 'btn_2', type: 'button' },
            ],
          },
        ],
      } as any),
    });

    const targetNode = app.getNode('btn_2')!;
    app.emit('click', app.getNode('btn_1')!);
    await flushAsync();

    expect((targetNode as any).eventQueue).toHaveLength(1);
    expect((targetNode as any).eventQueue[0].method).toBe('foo');
  });

  test('compActionHandler：method 是数组时取 [to, method]', async () => {
    const targetInstance = { hi: vi.fn() };
    const app = new App({
      config: createDsl({
        items: [
          {
            type: NodeType.PAGE,
            id: 'page_1',
            items: [
              {
                id: 'btn_1',
                type: 'button',
                events: [
                  {
                    name: 'click',
                    actions: [{ actionType: ActionType.COMP, method: ['btn_2', 'hi'] } as any],
                  },
                ],
              },
              { id: 'btn_2', type: 'button' },
            ],
          },
        ],
      } as any),
    });

    app.getNode('btn_2')!.setInstance(targetInstance);
    app.emit('click', app.getNode('btn_1')!);
    await flushAsync();

    expect(targetInstance.hi).toHaveBeenCalled();
  });

  test('compActionHandler：当前没有 page 时抛错被 errorHandler 捕获（兼容旧配置）', async () => {
    const errorHandler = vi.fn();
    const app = new App({
      errorHandler,
      config: createDsl({
        items: [
          {
            type: NodeType.PAGE,
            id: 'page_1',
            items: [
              {
                id: 'btn_1',
                type: 'button',
                events: [{ name: 'click', to: 'btn_2', method: 'foo' } as any],
              },
            ],
          },
        ],
      } as any),
    });

    const node = app.getNode('btn_1')!;
    app.page = undefined;

    app.emit('click', node);
    await flushAsync();
    await flushAsync();

    expect(errorHandler).toHaveBeenCalled();
    const lastErr = errorHandler.mock.calls[errorHandler.mock.calls.length - 1][0];
    expect(lastErr).toBeInstanceOf(Error);
  });

  test('compActionHandler：在 pageFragments 中也能找到目标节点', async () => {
    const app = new App({
      config: {
        type: NodeType.ROOT,
        id: 'app',
        items: [
          {
            type: NodeType.PAGE,
            id: 'page_1',
            items: [
              { id: 'pf_container', type: 'page-fragment-container', pageFragmentId: 'pf_1' },
              {
                id: 'btn_1',
                type: 'button',
                events: [
                  {
                    name: 'click',
                    actions: [{ actionType: ActionType.COMP, to: 'btn_in_pf', method: 'go' }],
                  },
                ],
              },
            ],
          },
          {
            type: NodeType.PAGE_FRAGMENT,
            id: 'pf_1',
            items: [{ id: 'btn_in_pf', type: 'button' }],
          },
        ],
      } as any,
    });

    const target = app.pageFragments.get('pf_container')!.getNode('btn_in_pf')!;
    const inst = { go: vi.fn() };
    target.setInstance(inst);

    app.emit('click', app.getNode('btn_1')!);
    await flushAsync();

    expect(inst.go).toHaveBeenCalled();
  });
});

describe('EventHelper - bindDataSourceEvents / removeDataSourceEvents', () => {
  test('为数据源 schema.events 中自定义事件绑定监听', async () => {
    const app = new App({
      config: createDsl({
        dataSources: [
          {
            id: 'ds_1',
            type: 'base',
            fields: [],
            methods: [],
            events: [
              {
                name: 'change',
                actions: [{ actionType: ActionType.CODE, codeId: 'logCode' } as any],
              } as any,
            ],
          },
        ],
        codeBlocks: {
          logCode: { name: 'logCode', params: [], content: vi.fn() },
        },
      } as any),
    });

    await flushAsync();
    const helper = app.eventHelper!;
    expect(helper).toBeDefined();
    expect((helper as any).dataSourceEventList.has('ds_1')).toBe(true);
    const dsEvents: Map<string, any> = (helper as any).dataSourceEventList.get('ds_1');
    expect(dsEvents.has('change')).toBe(true);

    const ds = app.dataSourceManager!.get('ds_1')!;
    expect(ds.listenerCount('change')).toBeGreaterThanOrEqual(1);
  });

  test('数据源字段变更事件 (DATA_SOURCE_FIELDS_CHANGE_EVENT_PREFIX) 通过 onDataChange 注册', async () => {
    const app = new App({
      config: createDsl({
        dataSources: [
          {
            id: 'ds_1',
            type: 'base',
            fields: [{ type: 'string', name: 'foo', title: 'foo', defaultValue: '', enable: true }],
            methods: [],
            events: [
              {
                name: `${DATA_SOURCE_FIELDS_CHANGE_EVENT_PREFIX}.foo`,
                actions: [],
              } as any,
            ],
          },
        ],
      } as any),
    });

    await flushAsync();

    const ds = app.dataSourceManager!.get('ds_1')!;
    const onDataChangeSpy = vi.spyOn(ds, 'onDataChange');
    app.eventHelper!.bindDataSourceEvents();
    expect(onDataChangeSpy).toHaveBeenCalled();
  });

  test('event.name 为空字符串时跳过绑定', () => {
    const app = new App({
      config: createDsl({
        dataSources: [
          {
            id: 'ds_1',
            type: 'base',
            fields: [],
            methods: [],
            events: [{ name: '', actions: [] } as any],
          },
        ],
      } as any),
    });

    const helper = app.eventHelper!;
    expect(() => helper.bindDataSourceEvents()).not.toThrow();
  });

  test('removeDataSourceEvents：当 dataSourceEventList 为空时直接返回', () => {
    const app = new App({});
    const helper = new EventHelper({ app });
    expect(() => helper.removeDataSourceEvents([])).not.toThrow();
  });

  test('removeDataSourceEvents 会同时清理 onDataChange 与普通事件', async () => {
    const app = new App({
      config: createDsl({
        dataSources: [
          {
            id: 'ds_1',
            type: 'base',
            fields: [{ type: 'string', name: 'foo', title: 'foo', defaultValue: '', enable: true }],
            methods: [],
            events: [
              { name: 'change', actions: [] } as any,
              { name: `${DATA_SOURCE_FIELDS_CHANGE_EVENT_PREFIX}.foo`, actions: [] } as any,
            ],
          },
        ],
      } as any),
    });

    await flushAsync();
    const helper = app.eventHelper!;
    const ds = app.dataSourceManager!.get('ds_1')!;
    const offSpy = vi.spyOn(ds, 'off');
    const offDataChangeSpy = vi.spyOn(ds, 'offDataChange');

    helper.removeDataSourceEvents([ds]);

    expect(offSpy).toHaveBeenCalled();
    expect(offDataChangeSpy).toHaveBeenCalled();
    expect((helper as any).dataSourceEventList.size).toBe(0);
  });

  test('数据源触发自定义事件后会调用配置的 action', async () => {
    const codeFn = vi.fn();
    const app = new App({
      config: createDsl({
        codeBlocks: { c: { name: 'c', params: [], content: codeFn } },
        dataSources: [
          {
            id: 'ds_1',
            type: 'base',
            fields: [],
            methods: [],
            events: [
              {
                name: 'change',
                actions: [{ actionType: ActionType.CODE, codeId: 'c' } as any],
              } as any,
            ],
          },
        ],
      } as any),
    });

    await flushAsync();
    const ds = app.dataSourceManager!.get('ds_1')!;
    ds.setData({ a: 1 });
    await flushAsync();
    expect(codeFn).toHaveBeenCalled();
  });
});

describe('EventHelper - flowState 状态管理', () => {
  test('FlowState abort/reset 行为', () => {
    const fs = new FlowState();
    expect(fs.isAbort).toBe(false);
    fs.abort();
    expect(fs.isAbort).toBe(true);
    fs.reset();
    expect(fs.isAbort).toBe(false);
  });
});
