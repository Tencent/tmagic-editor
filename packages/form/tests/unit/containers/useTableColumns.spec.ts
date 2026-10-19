/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive } from 'vue';
import { mount } from '@vue/test-utils';

import { useTableColumns } from '@form/containers/table/useTableColumns';
import { setConfig } from '@form/utils/config';

const Harness = defineComponent({
  name: 'ColumnsHarness',
  props: {
    tableProps: { type: Object, required: true },
  },
  setup(props) {
    const events: any[] = [];
    const { columns } = useTableColumns(
      props.tableProps as any,
      (...args: any[]) => {
        events.push(args);
      },
      props.tableProps.currentPage,
      props.tableProps.pageSize,
      props.tableProps.modelName,
    );
    return { columns, events };
  },
  render() {
    return h('div');
  },
});

const createState = (overrides: Record<string, any> = {}) => {
  const currentPage = overrides.currentPage ?? { value: 0 };
  const pageSize = overrides.pageSize ?? { value: 10 };
  const modelName = overrides.modelName ?? { value: 'list' };
  return reactive({
    model: { list: [{ text: 'a' }, { text: 'b' }] },
    lastValues: { list: [{ text: 'old-a' }, { text: 'old-b' }] },
    name: 'list',
    prop: 'list',
    showIndex: false,
    sort: false,
    config: {
      type: 'table',
      name: 'list',
      items: [{ name: 'text', label: '文本', type: 'text' }],
    },
    currentPage,
    pageSize,
    modelName,
    ...overrides,
    config: {
      type: 'table',
      name: 'list',
      items: [{ name: 'text', label: '文本', type: 'text' }],
      ...(overrides.config || {}),
    },
  });
};

const mountColumns = (state: ReturnType<typeof createState>, mForm?: any) =>
  mount(Harness, {
    props: { tableProps: state },
    global: mForm ? { provide: { mForm } } : undefined,
  });

const labels = (wrapper: ReturnType<typeof mountColumns>) =>
  (wrapper.vm as any).columns.map((column: any) => column.props.label ?? column.props.type);

describe('useTableColumns', () => {
  test('操作列标题默认为「操作」，operateColConfig.text 可替换', async () => {
    setConfig({});
    const defaults = mountColumns(createState());
    await nextTick();
    expect(labels(defaults)).toContain('操作');

    const custom = mountColumns(
      createState({
        config: {
          operateColWidth: 112,
          fixed: 'left',
          operateColConfig: { text: '动作', props: { width: 200, align: 'left', minWidth: 80, fixed: 'right' } },
        },
      }),
    );
    await nextTick();
    const operateCol = (custom.vm as any).columns.find((column: any) => column.props.label === '动作');
    expect(operateCol).toBeTruthy();
    expect(labels(custom)).not.toContain('操作');
    expect(operateCol.props).toMatchObject({ width: 200, align: 'left', minWidth: 80, fixed: 'right' });
  });

  test('展开列、选择列、排序列、序号列与数据列按配置拼出', async () => {
    setConfig({ flat: true });
    const itemExtra = vi.fn(() => '<em>extra</em>');
    const titleTip = vi.fn(() => '提示');
    const selection = vi.fn(() => true);
    const mForm = { initValues: { list: [] }, values: { list: [{ text: 'form' }] }, $emit: vi.fn() };
    const state = createState({
      sort: true,
      showIndex: true,
      config: {
        itemExtra,
        selection,
        showIndex: true,
        flat: undefined,
        fixed: 'right',
        pagination: true,
        items: [
          { name: 'hidden', type: 'hidden' },
          { name: 'skip', label: '跳过', display: false },
          { name: 'text', label: '文本', titleTip, itemsFunction: (row: any) => [{ name: 'inner', text: row.text }] },
        ],
      },
    });
    const wrapper = mountColumns(state, mForm);
    await nextTick();

    const { columns } = wrapper.vm as any;
    expect(labels(wrapper)).toEqual(['expand', 'selection', '排序', '序号', '文本', '操作']);

    const extraVnode = columns[0].cell({ $index: 1 });
    expect(itemExtra).toHaveBeenCalled();
    expect(extraVnode.props.innerHTML).toBe('<em>extra</em>');
    expect(extraVnode.props.class).toBe('m-form-tip');

    const sortVnode = columns[2].cell({ $index: 1 });
    sortVnode.props.onSwap(1, 0);
    expect(mForm.$emit).toHaveBeenCalledWith('field-change', expect.any(Array));
    expect((wrapper.vm as any).events.at(-1)[0]).toBe('change');

    expect(String(columns[3].cell({ $index: 1 }).children)).toBe('2');

    const dataVnode = columns[4].cell({ row: { text: 'a' }, $index: 0 });
    expect(dataVnode.props.config.items).toEqual([{ name: 'inner', text: 'a' }]);
    expect(dataVnode.props.lastValues).toEqual({ text: 'old-a' });
    dataVnode.props.onChange({ text: 'next' }, { changeRecords: [] });
    dataVnode.props.onAddDiffCount();
    expect((wrapper.vm as any).events.map((event: any[]) => event[0])).toEqual(
      expect.arrayContaining(['change', 'addDiffCount']),
    );

    const titleVnode = columns[4].title();
    expect(titleTip).toHaveBeenCalled();
    expect(titleVnode).toBeTruthy();

    const actionVnode = columns[5].cell({ row: { text: 'a' }, $index: 0 });
    expect(actionVnode.props.flat).toBe(true);
    actionVnode.props.onChange([{ text: 'only' }]);
    expect((wrapper.vm as any).events.at(-1)).toEqual(['change', [{ text: 'only' }]]);

    const dropped = mountColumns(
      createState({
        config: {
          fixed: false,
          dropSort: true,
          itemExtra: 'plain',
          selection: false,
          pagination: false,
          items: [{ name: 'text', label: '文本', titleTip: '静态提示' }],
        },
      }),
      mForm,
    );
    await nextTick();

    const nextColumns = (dropped.vm as any).columns;
    expect(nextColumns[0].props.label).toBe('操作');
    expect(nextColumns[0].props.fixed).toBeUndefined();
    expect(nextColumns.some((column: any) => column.props.type === 'expand')).toBe(false);
    const plain = nextColumns.find((column: any) => column.props.prop === 'text');
    expect(plain.props.class).toBe('el-table__column--dropable');
    expect(plain.title()).toBeTruthy();
    expect(plain.cell({ row: { text: 'a' }, $index: 0 }).props.lastValues).toEqual({ text: 'old-a' });

    setConfig({});
  });

  test('选择函数返回 false、非法 fixed、全局非 flat 时不铺平操作列', async () => {
    setConfig({});
    const state = createState({
      sort: true,
      model: { list: [{ text: 'only' }] },
      lastValues: {},
      config: {
        selection: () => false,
        fixed: 'center',
        items: [{ name: 'text', label: '文本', display: () => false }],
      },
    });
    const wrapper = mountColumns(state);
    await nextTick();

    const { columns } = wrapper.vm as any;
    expect(columns.map((column: any) => column.props.label ?? column.props.type)).toEqual(['操作']);
    expect(columns[0].props.fixed).toBe('left');
    const actionVnode = columns[0].cell({ row: { text: 'only' }, $index: 0 });
    expect(actionVnode.props.flat).toBeUndefined();

    const plain = mountColumns(
      createState({
        lastValues: {},
        config: {
          fixed: 'left',
          items: [{ name: 'text', label: '文本' }],
        },
      }),
    );
    await nextTick();
    const dataColumn = (plain.vm as any).columns.find((column: any) => column.props.prop === 'text');
    expect(dataColumn.cell({ row: { text: 'only' }, $index: 0 }).props.lastValues).toBeUndefined();
    expect(dataColumn.title).toBeUndefined();
  });
});
