import { describe, expect, test, vi } from 'vitest';

import TMagicApp, { DATA_SOURCE_FIELDS_CHANGE_EVENT_PREFIX, IteratorContainer, NodeType } from '@tmagic/core';

const flush = () => new Promise((resolve) => setTimeout(resolve, 10));

const createApp = (beforeEventHandler?: (e: any) => void) =>
  new TMagicApp({
    platform: 'mobile',
    beforeEventHandler,
    config: {
      type: NodeType.ROOT,
      id: 'app',
      items: [
        {
          type: NodeType.PAGE,
          id: 'page_1',
          items: [{ type: 'text', id: 'n1', text: '${ds_1.foo}' }],
        },
      ],
      dataSourceDeps: { ds_1: { n1: { name: 'n1', keys: ['text'] } } },
      dataSources: [
        {
          id: 'ds_1',
          type: 'base',
          fields: [
            { name: 'foo', type: 'string', defaultValue: 'f0' },
            { name: 'bar', type: 'string', defaultValue: 'b0' },
          ],
          methods: [],
          events: [{ name: `${DATA_SOURCE_FIELDS_CHANGE_EVENT_PREFIX}.foo`, actions: [] }],
        },
      ],
    } as any,
  } as any);

describe('数据源字段更新的事件监听', () => {
  test('onDataChange 在 batch 内同步触发，且每次 setData 都会触发', () => {
    const app = createApp();
    const manager = app.dataSourceManager!;
    const ds = manager.get('ds_1')!;

    const callback = vi.fn();
    manager.onDataChange('ds_1', 'foo', callback);

    const order: string[] = [];
    callback.mockImplementation(() => order.push('callback'));

    manager.batch(() => {
      ds.setData('a', 'foo');
      order.push('after-first');
      ds.setData('b', 'foo');
      order.push('after-second');
    });
    order.push('batch-end');

    // 监听在 setData 时同步执行，不会被 batch 合并
    expect(order).toEqual(['callback', 'after-first', 'callback', 'after-second', 'batch-end']);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback.mock.calls[1][0].updateData).toBe('b');
  });

  test('数据源字段变更事件（联动动作）在 batch 内仍按每次 setData 触发', async () => {
    const events: any[] = [];
    const app = createApp((e) => events.push(e));
    const manager = app.dataSourceManager!;
    app.eventHelper!.bindDataSourceEvents();
    const ds = manager.get('ds_1')!;
    await flush();

    events.length = 0;
    ds.setData('x', 'foo');
    await flush();
    expect(events).toHaveLength(1);

    events.length = 0;
    manager.batch(() => {
      ds.setData('y', 'foo');
      ds.setData('z', 'bar');
    });
    await flush();

    // foo 的监听触发 1 次（bar 没有配置事件），batch 不会合并字段变更事件
    expect(events).toHaveLength(1);
    expect(events[0].args[0].updateData).toBe('y');
  });

  test('反复重建迭代节点不会移除、也不会重复注册数据源字段变更监听', async () => {
    const events: any[] = [];
    const app = createApp((e) => events.push(e));
    const manager = app.dataSourceManager!;
    app.eventHelper!.bindDataSourceEvents();
    const helper: any = app.eventHelper;
    const ds = manager.get('ds_1')!;
    await flush();

    const before = helper.dataSourceEventList.get('ds_1')?.size;
    const offDataChange = vi.spyOn(ds, 'offDataChange');

    const container = new IteratorContainer({ config: { id: 'iter', type: 'iterator-container' } as any, app });
    for (let round = 0; round < 20; round++) {
      container.resetNodes();
      for (let i = 0; i < 5; i++) {
        container.setNodes([{ id: `btn_${i}`, type: 'button', events: [{ name: 'click', actions: [] }] } as any], i);
      }
    }

    expect(offDataChange).not.toHaveBeenCalled();
    expect(helper.dataSourceEventList.get('ds_1')?.size).toBe(before);

    events.length = 0;
    ds.setData('after', 'foo');
    await flush();
    expect(events).toHaveLength(1);
  });
});
