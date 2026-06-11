/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import Table from '../src/Table.vue';
import { tableRefMethods } from '../test-support/design.mock';

vi.mock('@tmagic/design', async () => {
  const { createDesignMock } = await import('../test-support/design.mock');
  return createDesignMock();
});

vi.mock('@tmagic/form', async () => {
  const { createFormMock } = await import('../test-support/design.mock');
  return createFormMock();
});

describe('Table.vue', () => {
  const mountTable = (props: Record<string, unknown> = {}) =>
    mount(Table, {
      props: {
        data: [{ id: 1, name: 'Alice' }],
        columns: [{ prop: 'name', label: '名称' }],
        ...props,
      },
    });

  test('渲染文本列内容', () => {
    const wrapper = mountTable();
    expect(wrapper.text()).toContain('Alice');
  });

  test('无 selection 列时对 data 做深拷贝', () => {
    const data = [{ id: 1, name: 'Bob' }];
    const wrapper = mountTable({ data });
    const table = wrapper.findComponent({ name: 'TMagicTable' });
    expect(table.props('data')).not.toBe(data);
    expect(table.props('data')).toEqual(data);
  });

  test('selection 列映射为 selection 类型', () => {
    const wrapper = mountTable({
      columns: [{ selection: true }, { prop: 'name', label: '名称' }],
    });
    const columns = wrapper.findComponent({ name: 'TMagicTable' }).props('columns') as any[];
    expect(columns[0].props.type).toBe('selection');
    expect(columns[1].cell).toBeDefined();
  });

  test('border 默认 false，显式 true 时开启边框', () => {
    const wrapperDefault = mountTable();
    expect(wrapperDefault.findComponent({ name: 'TMagicTable' }).props('border')).toBe(false);
    const wrapperBorder = mountTable({ border: true });
    expect(wrapperBorder.findComponent({ name: 'TMagicTable' }).props('border')).toBe(true);
  });

  test('border=false 时使用传入值', () => {
    const wrapper = mountTable({ border: false });
    expect(wrapper.findComponent({ name: 'TMagicTable' }).props('border')).toBe(false);
  });

  test('expose 方法代理到 TMagicTable', async () => {
    const wrapper = mountTable();
    const row = { id: 1 };
    wrapper.vm.toggleRowSelection(row, true);
    wrapper.vm.toggleRowExpansion(row, false);
    wrapper.vm.clearSelection();
    expect(tableRefMethods.toggleRowSelection).toHaveBeenCalledWith(row, true);
    expect(tableRefMethods.toggleRowExpansion).toHaveBeenCalledWith(row, false);
    expect(tableRefMethods.clearSelection).toHaveBeenCalled();
    await nextTick();
  });

  test('自定义 spanMethod 生效', () => {
    const spanMethod = vi.fn(() => [2, 1] as [number, number]);
    const wrapper = mountTable({ spanMethod });
    const fn = wrapper.findComponent({ name: 'TMagicTable' }).props('spanMethod') as Function;
    expect(fn({ row: {}, column: {}, rowIndex: 0, columnIndex: 0 })).toEqual([2, 1]);
  });

  test('未配置 spanMethod 时返回占位函数', () => {
    const wrapper = mountTable();
    const fn = wrapper.findComponent({ name: 'TMagicTable' }).props('spanMethod') as Function;
    const result = fn({});
    expect(typeof result).toBe('function');
    expect(result()).toEqual({ rowspan: 0, colspan: 0 });
  });

  test('派发 sort-change / select-all / selection-change / cell-click / expand-change', async () => {
    const wrapper = mountTable({
      columns: [{ selection: true }, { prop: 'name', label: '名称' }],
    });
    const table = wrapper.findComponent({ name: 'TMagicTable' });

    table.vm.$emit('sort-change', { prop: 'name' });
    table.vm.$emit('select-all', [{ id: 1 }]);
    table.vm.$emit('selection-change', [{ id: 1 }]);
    table.vm.$emit('cell-click', {}, {}, {}, new Event('click'));
    table.vm.$emit('expand-change', { id: 1 }, []);

    expect(wrapper.emitted('sort-change')?.[0]).toEqual([{ prop: 'name' }]);
    expect(wrapper.emitted('select-all')?.[0]).toEqual([[{ id: 1 }]]);
    expect(wrapper.emitted('selection-change')?.[0]).toEqual([[{ id: 1 }]]);
    expect(wrapper.emitted('cell-click')).toBeTruthy();
    expect(wrapper.emitted('expand-change')).toBeTruthy();
    await nextTick();
  });

  test('select 事件在有 selection 列时派发', async () => {
    const wrapper = mountTable({
      columns: [{ selection: 'single' }, { prop: 'name', label: '名称' }],
    });
    const table = wrapper.findComponent({ name: 'TMagicTable' });
    const row = { id: 1, name: 'Dave' };
    table.vm.$emit('select', [row], row);
    expect(wrapper.emitted('select')?.[0]).toEqual([[row], row]);
    await nextTick();
  });

  test('无 selection 列时不派发 select', async () => {
    const wrapper = mountTable();
    const table = wrapper.findComponent({ name: 'TMagicTable' });
    table.vm.$emit('select', [], {});
    expect(wrapper.emitted('select')).toBeUndefined();
    await nextTick();
  });

  test('渲染 expand / component / actions / popover 列', () => {
    const customCell = defineComponent({
      props: ['row'],
      setup(p) {
        return () => h('i', { class: 'custom-cell' }, p.row?.name);
      },
    });

    const wrapper = mountTable({
      data: [{ id: 1, name: 'Eve', items: [{ sub: 'x' }] }],
      columns: [
        { type: 'expand', table: [{ prop: 'sub', label: '子项' }] },
        { type: 'component', component: customCell, props: (row: any) => ({ row }) },
        {
          actions: [{ type: 'edit', text: '编辑' }],
        },
        {
          type: 'popover',
          prop: 'items',
          text: '详情',
          popover: { tableEmbed: true, trigger: 'click' },
          table: [{ prop: 'sub', label: '子项' }],
        },
      ],
    });

    expect(wrapper.find('.tmagic-table-stub').exists()).toBe(true);
    expect(wrapper.find('.custom-cell').exists()).toBe(true);
    expect(wrapper.find('.action-btn').exists()).toBe(true);
    expect(wrapper.find('.tmagic-popover-stub').exists()).toBe(true);
  });

  test('actions 列 after-action 事件向上透传', async () => {
    const wrapper = mountTable({
      columns: [
        {
          actions: [
            {
              type: 'edit',
              text: '编辑',
              action: vi.fn(),
            },
          ],
        },
      ],
    });

    const editBtn = wrapper.findAll('.action-btn').find((b) => b.text().includes('编辑'));
    await editBtn?.trigger('click');
    const saveBtn = wrapper.findAll('.action-btn').find((b) => b.text() === '保存');
    await saveBtn?.trigger('click');
    expect(wrapper.emitted('after-action')?.[0]).toEqual([{ index: 0 }]);
  });
});
