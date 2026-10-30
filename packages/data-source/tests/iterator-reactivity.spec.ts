import { afterAll, describe, expect, test } from 'vitest';
import { computed, createApp, defineComponent, h, nextTick, ref } from 'vue';

import TMagicApp, { NodeType } from '@tmagic/core';

import { DataSourceManager } from '@data-source/index';

/**
 * 模拟 IteratorContainer.vue：
 * configs 是依赖 props.config 的 computed，内部调用 dataSourceManager.compliedIteratorItems，
 * 每项渲染一个 Item，Item 把绑定到的“兄弟字段对象”作为 prop 继续传给 Cell。
 */
const setup = () => {
  const dsId = 'ds_iter_reactivity';
  const app = new TMagicApp({
    config: {
      type: NodeType.ROOT,
      id: 'app_iter_reactivity',
      items: [],
      dataSources: [
        {
          type: 'base',
          id: dsId,
          fields: [
            {
              name: 'list',
              type: 'array',
              fields: [{ name: 'label' }],
              defaultValue: [{ label: 'A' }, { label: 'B' }],
            },
            { name: 'matrix', type: 'array', fields: [{ name: 'v' }], defaultValue: [{ v: 1 }] },
          ],
          methods: [],
          events: [],
        },
      ],
    },
  });

  const dsm = new DataSourceManager({ app });
  const ds = dsm.get(dsId)!;

  const rawMatrix = dsm.data[dsId].matrix;

  const templateNodes = [
    {
      id: 'iter_reactivity_node',
      type: 'text',
      text: '${ds_iter_reactivity.list.label}',
      // 绑定整个数据源，编译结果是迭代上下文（matrix 是迭代路径之外的兄弟字段）
      cell: { isBindDataSource: true, dataSourceId: dsId },
    },
  ] as any[];

  const renderCount = { cell: 0, item: 0 };

  const cellComp = defineComponent({
    props: { matrix: { type: Array, required: true } },
    setup(props) {
      return () => {
        renderCount.cell += 1;
        return h('i', { class: 'cell' }, String((props.matrix[0] as any).v));
      };
    },
  });

  const itemComp = defineComponent({
    props: { config: { type: Object, required: true } },
    setup(props) {
      return () => {
        renderCount.item += 1;
        const node = (props.config as any).items[0];
        return h('div', { class: 'item' }, [h('b', node.text), h(cellComp, { matrix: node.cell.matrix })]);
      };
    },
  });

  // 与 IteratorContainer.vue 一样：数据源变化 -> 节点被替换(config 变成新对象) -> computed 重算
  const containerConfig = ref<any>({ iteratorData: ds.data.list, items: templateNodes });

  const containerComp = defineComponent({
    setup() {
      const configs = computed(() =>
        (containerConfig.value.iteratorData as any[]).map((itemData) => ({
          items: dsm.compliedIteratorItems(itemData, containerConfig.value.items, [dsId, 'list']),
        })),
      );
      return () =>
        h(
          'div',
          configs.value.map((config, index) => h(itemComp, { key: index, config })),
        );
    },
  });

  const root = document.createElement('div');
  const vueApp = createApp(containerComp);
  vueApp.mount(root);

  // 模拟 createDataSourceManager 的 change 处理：触发容器节点被整体替换
  const replaceContainerNode = () => {
    containerConfig.value = { iteratorData: ds.data.list, items: templateNodes };
  };

  return { ds, dsm, root, renderCount, rawMatrix, replaceContainerNode, unmount: () => vueApp.unmount() };
};

describe('迭代容器编译 + Vue 响应式', () => {
  afterAll(() => {
    DataSourceManager.clearDataSourceClass();
  });

  test('路径之外的兄弟字段是与数据源隔离的快照，不修改数据源原始数据', async () => {
    const { dsm, root, rawMatrix, unmount } = setup();
    await nextTick();

    expect(root.querySelectorAll('.item').length).toBe(2);
    expect(root.querySelector('.cell')?.textContent).toBe('1');
    expect(rawMatrix).toEqual([{ v: 1 }]);
    expect(dsm.data.ds_iter_reactivity.matrix).toBe(rawMatrix);

    unmount();
  });

  test('整体替换数据源数据（setData 无 path）后，视图和子孙组件都会更新', async () => {
    const { ds, root, replaceContainerNode, unmount } = setup();
    await nextTick();

    ds.setData([{ v: 2 }], 'matrix');
    replaceContainerNode();
    await nextTick();

    expect(root.querySelector('.cell')?.textContent).toBe('2');

    unmount();
  });

  test('按 path 原地修改兄弟字段对象内部值后，子孙组件也会更新', async () => {
    const { ds, root, renderCount, replaceContainerNode, unmount } = setup();
    await nextTick();
    const cellRenderBefore = renderCount.cell;

    // SimpleObservedData 按路径更新为原地修改，matrix[0] 的引用不变
    ds.setData(9, 'matrix.0.v');
    replaceContainerNode();
    await nextTick();

    // Item 一定会因 config 换新对象而重新渲染
    expect(renderCount.item).toBeGreaterThan(2);
    // 兄弟字段是新的快照，子孙组件的 props 会变化并拿到最新值
    expect(renderCount.cell).toBeGreaterThan(cellRenderBefore);
    expect(root.querySelector('.cell')?.textContent).toBe('9');

    unmount();
  });
});
