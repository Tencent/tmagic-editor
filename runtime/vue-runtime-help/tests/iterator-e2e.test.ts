import { afterEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick, provide } from 'vue';
import { mount } from '@vue/test-utils';

import TMagicApp, { DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX, NodeType } from '@tmagic/core';

import IteratorContainer from '../../../vue-components/iterator-container/src/IteratorContainer.vue';
import { useDsl } from '../src';

/** 叶子组件：接收绑定到数据源的“兄弟字段” matrix 作为 prop，用于验证子孙组件的更新 */
const cellRenders = { count: 0 };
const cellComp = defineComponent({
  props: { matrix: { type: Array, default: () => [] } },
  setup(props) {
    return () => {
      cellRenders.count += 1;
      return h('i', { class: 'cell' }, String((props.matrix[0] as any)?.v));
    };
  },
});

const textComp = defineComponent({
  props: { config: { type: Object, required: true } },
  setup(props) {
    return () =>
      h('span', { class: 'txt' }, [
        (props.config as any).text,
        (props.config as any).cell ? h(cellComp, { matrix: (props.config as any).cell.matrix }) : null,
      ]);
  },
});

const createApp = () => {
  const app = new TMagicApp({
    platform: 'mobile',
    config: {
      type: NodeType.ROOT,
      id: 'app',
      items: [
        {
          type: NodeType.PAGE,
          id: 'page',
          items: [
            {
              type: 'iterator-container',
              id: 'iter',
              dsField: ['ds', 'list'],
              iteratorData: [`${DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX}ds`, 'list'],
              itemConfig: { style: {} },
              items: [
                {
                  type: 'text',
                  id: 'txt',
                  text: '${ds.list.label}',
                  cell: { isBindDataSource: true, dataSourceId: 'ds' },
                  events: [{ name: 'click', actions: [] }],
                },
              ],
            },
            { type: 'text', id: 'plain', text: 'total=${ds.total}' },
          ],
        },
      ],
      dataSourceDeps: {
        ds: { iter: { name: 'iter', keys: ['iteratorData'] }, plain: { name: 'plain', keys: ['text'] } },
      },
      dataSources: [
        {
          id: 'ds',
          type: 'base',
          fields: [
            {
              name: 'list',
              type: 'array',
              fields: [{ name: 'label' }],
              defaultValue: [{ label: 'A' }, { label: 'B' }],
            },
            { name: 'matrix', type: 'array', fields: [{ name: 'v' }], defaultValue: [{ v: 1 }] },
            { name: 'total', defaultValue: 2 },
          ],
          methods: [],
          events: [],
        },
      ],
    } as any,
  });
  app.registerComponent('iterator-container', IteratorContainer);
  app.registerComponent('text', textComp);
  const renderNodes = (items: any[]) =>
    (items || []).map((item) => h(app.resolveComponent(item.type), { key: item.id, config: item }));
  app.registerComponent(
    'container',
    defineComponent({
      props: { config: { type: Object, required: true } },
      setup(props) {
        return () => h('div', renderNodes((props.config as any).items));
      },
    }),
  );
  app.registerComponent(
    'page',
    defineComponent({
      setup() {
        const { pageConfig } = useDsl(app);
        // 与真实运行时一致：页面组件创建后会给 page 设置 instance
        app.page!.emit('created', { config: app.page!.data });
        return () => h('div', { class: 'page' }, renderNodes(pageConfig.value?.items as any[]));
      },
    }),
  );
  return app;
};

const mountApp = (app: TMagicApp) => {
  const root = defineComponent({
    setup() {
      provide('app', app);
      return () => h(app.resolveComponent('page'));
    },
  });
  return mount(root, { global: { provide: { app } } });
};

const texts = (wrapper: ReturnType<typeof mountApp>) =>
  wrapper.findAll('.txt').map((el) => el.element.firstChild?.textContent);

describe('真实 IteratorContainer + useDsl + createDataSourceManager', () => {
  afterEach(() => {
    cellRenders.count = 0;
  });

  test('初始渲染', async () => {
    const app = createApp();
    const wrapper = mountApp(app);
    await nextTick();
    expect(texts(wrapper)).toEqual(['A', 'B', 'total=2']);
    wrapper.unmount();
  });

  test('整体替换列表（含追加一项）后视图更新', async () => {
    const app = createApp();
    const wrapper = mountApp(app);
    await nextTick();

    app.dataSourceManager!.get('ds')!.setData([{ label: 'A' }, { label: 'B' }, { label: 'C' }], 'list');
    await nextTick();
    await nextTick();
    expect(texts(wrapper)).toEqual(['A', 'B', 'C', 'total=2']);
    wrapper.unmount();
  });

  test('按 path 原地修改 matrix.0.v：迭代项里的子孙组件会更新', async () => {
    const app = createApp();
    const wrapper = mountApp(app);
    await nextTick();
    expect(wrapper.findAll('.cell').map((c) => c.text())).toEqual(['1', '1']);

    // 触发迭代容器重新编译（列表整体替换），同时 matrix 原地修改
    app.dataSourceManager!.get('ds')!.setData(9, 'matrix.0.v');
    app.dataSourceManager!.get('ds')!.setData([{ label: 'A' }, { label: 'B' }], 'list');
    await nextTick();
    await nextTick();
    expect(wrapper.findAll('.cell').map((c) => c.text())).toEqual(['9', '9']);
    wrapper.unmount();
  });

  test('batch：多次 setData 合并成一次 update-data，视图为最终值', async () => {
    const app = createApp();
    const wrapper = mountApp(app);
    await nextTick();
    const update = vi.fn();
    app.dataSourceManager!.on('update-data', update);

    app.dataSourceManager!.batch(
      () => {
        const ds = app.dataSourceManager!.get('ds')!;
        ds.setData(3, 'total');
        ds.setData(4, 'total');
        ds.setData([{ label: 'X' }], 'list');
      },
      { mergeChangeEvents: true },
    );
    await nextTick();
    await nextTick();

    expect(update).toHaveBeenCalledTimes(1);
    expect(texts(wrapper)).toEqual(['X', 'total=4']);
    wrapper.unmount();
  });

  test('batch 会让 replaced-node 只触发一次并只携带最后一次变更', async () => {
    const app = createApp();
    const wrapper = mountApp(app);
    await nextTick();
    const replaced = vi.fn();
    app.on('replaced-node', replaced);
    const ds = app.dataSourceManager!.get('ds')!;

    ds.setData(1, 'total');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(replaced).toHaveBeenCalledTimes(1);

    replaced.mockClear();
    app.dataSourceManager!.batch(
      () => {
        ds.setData(2, 'total');
        ds.setData([{ label: 'Y' }], 'list');
      },
      { mergeChangeEvents: true },
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    // 合并后只发一次，changeEvent 取该数据源最后一次变更
    expect(replaced).toHaveBeenCalledTimes(1);
    expect(replaced.mock.calls[0][0].path).toBe('list');
    expect(texts(wrapper)).toEqual(['Y', 'total=2']);
    wrapper.unmount();
  });

  test('默认（不传选项）replaced-node 每次变化各触发一次，不丢中间变更', async () => {
    const app = createApp();
    const wrapper = mountApp(app);
    await nextTick();
    const replaced = vi.fn();
    app.on('replaced-node', replaced);
    const ds = app.dataSourceManager!.get('ds')!;

    app.dataSourceManager!.batch(() => {
      ds.setData(2, 'total');
      ds.setData([{ label: 'Z' }], 'list');
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(replaced).toHaveBeenCalledTimes(2);
    expect(replaced.mock.calls.map((call) => call[0].path)).toEqual(['total', 'list']);
    expect(texts(wrapper)).toEqual(['Z', 'total=2']);
    wrapper.unmount();
  });

  test('mergeChangeEvents: false 时 replaced-node 每次变化各触发一次，不丢中间变更', async () => {
    const app = createApp();
    const wrapper = mountApp(app);
    await nextTick();
    const replaced = vi.fn();
    app.on('replaced-node', replaced);
    const ds = app.dataSourceManager!.get('ds')!;

    app.dataSourceManager!.batch(
      () => {
        ds.setData(2, 'total');
        ds.setData([{ label: 'Z' }], 'list');
      },
      { mergeChangeEvents: false },
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(replaced).toHaveBeenCalledTimes(2);
    expect(replaced.mock.calls.map((call) => call[0].path)).toEqual(['total', 'list']);
    expect(replaced.mock.calls.map((call) => call[0].updateData)).toEqual([2, [{ label: 'Z' }]]);
    expect(texts(wrapper)).toEqual(['Z', 'total=2']);
    wrapper.unmount();
  });

  test('反复更新列表后，EventHelper 上的节点事件监听数量不增长', async () => {
    const app = createApp();
    const wrapper = mountApp(app);
    await nextTick();
    const helper: any = app.eventHelper;
    const ds = app.dataSourceManager!.get('ds')!;

    ds.setData([{ label: 'A' }, { label: 'B' }], 'list');
    await nextTick();
    await nextTick();
    const baseline = helper.nodeEventList.size;

    for (let i = 0; i < 20; i++) {
      ds.setData([{ label: `A${i}` }, { label: `B${i}` }], 'list');
      await nextTick();
      await nextTick();
    }

    console.log(`[e2e-leak] 基线 nodeEventList=${baseline}, 更新20次后=${helper.nodeEventList.size}`);
    expect(helper.nodeEventList.size).toBe(baseline);
    wrapper.unmount();
  });
});
