/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { nextTick, reactive } from 'vue';
import { Sort } from '@element-plus/icons-vue';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';

import ActionsColumn from '@form/containers/table/ActionsColumn.vue';
import MagicForm from '@form/index';
import type { FormState } from '@form/schema';
import { createFormStateProxy } from '@form/utils/formStateProxy';

const createMForm = (context: Record<string, any>): FormState =>
  createFormStateProxy(
    reactive({
      keyProp: '__key',
      config: [],
      initValues: { list: [{ text: 'a' }] },
      parentValues: { p: 1 },
      values: { list: [{ text: 'a' }] },
      lastValues: {},
      lastValuesProcessed: {},
      isCompare: false,
      $emit: () => undefined,
    }) as unknown as FormState,
    () => context,
  );

const COMPONENT_PROP_KEYS = ['flat', 'disabled', 'sortKey', 'model'] as const;

const mountColumn = (config: any, context: Record<string, any> = { env: 'prod' }) => {
  const tableConfig = { ...config };
  const extra: Record<string, any> = {};
  for (const key of COMPONENT_PROP_KEYS) {
    if (key in tableConfig) {
      extra[key] = tableConfig[key];
      delete tableConfig[key];
    }
  }

  return mount(ActionsColumn as any, {
    global: {
      plugins: [ElementPlus as any, MagicForm as any],
      provide: { mForm: createMForm(context) },
    },
    props: {
      config: { type: 'table', name: 'list', ...tableConfig },
      model: { list: [{ text: 'a' }] },
      name: 'list',
      prop: 'list',
      currentPage: 0,
      pageSize: 10,
      index: 0,
      row: { text: 'a' },
      ...extra,
    },
  });
};

describe('ActionsColumn', () => {
  test('copyable 函数收到 model / index / prop', async () => {
    const copyable = vi.fn(() => true);
    mountColumn({ copyable });
    await nextTick();

    expect(copyable).toHaveBeenCalled();
    expect(copyable.mock.calls[0][1]).toMatchObject({ index: 0, prop: 'list' });
  });

  test('copyHandler 可从 mForm 读穿宿主 context，返回值作为新增行', async () => {
    const copyHandler = vi.fn((mForm: any, data: any) => ({ ...data.inputs, from: mForm.env }));
    const wrapper = mountColumn({ copyable: true, copyHandler });
    await nextTick();

    await wrapper.findAll('button').at(-1)!.trigger('click');

    expect(copyHandler).toHaveBeenCalled();
    expect(copyHandler.mock.calls[0][1]).toMatchObject({ prop: 'list' });
    expect(wrapper.emitted('change')?.[0][0]).toEqual([{ text: 'a' }, { text: 'a', from: 'prod' }]);
  });

  test('未配置函数时按静态值决定按钮显隐', async () => {
    const wrapper = mountColumn({ copyable: false });
    await nextTick();

    expect(wrapper.text()).not.toContain('复制');
  });

  test('未配置按钮文案时使用默认操作名称', async () => {
    const wrapper = mountColumn({ flat: true, dropSort: true, dropSortHandle: true });
    await nextTick();

    expect(wrapper.text()).toContain('删除');
    expect(wrapper.text()).toContain('复制');
    expect(wrapper.findComponent({ name: 'TMTooltip' }).props('content')).toBe('拖动排序');
  });

  test('按钮配置与 addButtonConfig 一样，用 text 改名称、props 透传', async () => {
    const wrapper = mountColumn({
      flat: true,
      dropSort: true,
      dropSortHandle: true,
      deleteButtonConfig: { text: '移除', props: { class: 'custom-delete', type: 'warning', size: 'large' } },
      copyButtonConfig: { text: '克隆', props: { plain: true } },
      dropSortButtonConfig: { text: '拖拽换序', props: { class: 'custom-drag' } },
    });
    await nextTick();

    expect(wrapper.text()).toContain('移除');
    expect(wrapper.text()).toContain('克隆');
    expect(wrapper.text()).not.toContain('删除');
    expect(wrapper.text()).not.toContain('复制');
    expect(wrapper.find('.custom-delete').exists()).toBe(true);
    expect(wrapper.find('.custom-drag').exists()).toBe(true);
    const deleteButton = wrapper.findAllComponents({ name: 'TMButton' }).find((btn) => btn.props('type') === 'warning');
    expect(deleteButton?.props('size')).toBe('large');
    const copyButton = wrapper.findAllComponents({ name: 'TMButton' }).find((btn) => btn.text().includes('克隆'));
    expect(copyButton?.find('button').classes()).toContain('is-plain');
    expect(wrapper.findComponent({ name: 'TMTooltip' }).props('content')).toBe('拖拽换序');
    expect(wrapper.findAll('button').map((btn) => btn.attributes('title'))).toEqual(
      expect.arrayContaining(['移除', '克隆']),
    );
  });

  test('delete 函数返回 false 时不展示删除，点击删除会移除当前行', async () => {
    const deleteFn = vi.fn(() => false);
    const hidden = mountColumn({ delete: deleteFn, flat: true });
    await nextTick();
    expect(deleteFn).toHaveBeenCalled();
    expect((hidden.findAll('button')[0].element as HTMLElement).style.display).toBe('none');

    const wrapper = mountColumn({ flat: true });
    await nextTick();
    await wrapper.findAll('button')[0].trigger('click');
    expect(wrapper.emitted('change')?.[0][0]).toEqual([]);
  });

  test('disabled 时点击删除不改数据，复制会沿 sortKey 递减', async () => {
    const blocked = mountColumn({ disabled: true, flat: true });
    await nextTick();
    await blocked.find('button').trigger('click');
    expect(blocked.emitted('change')).toBeUndefined();

    const wrapper = mountColumn({
      flat: true,
      sortKey: 'order',
      copyable: true,
    });
    await wrapper.setProps({
      model: {
        list: [
          { text: 'a', order: 3 },
          { text: 'b', order: 1 },
        ],
      },
    });
    await nextTick();
    const copyButton = wrapper.findAll('button').find((btn) => btn.text().includes('复制'));
    await copyButton?.trigger('click');
    expect(wrapper.emitted('change')?.[0][0]).toEqual([
      { text: 'a', order: 3 },
      { text: 'b', order: 1 },
      { text: 'a', order: 0 },
    ]);
  });

  test('actionButtons 渲染自定义按钮，点击收到行与下标，禁用时不触发', async () => {
    const handler = vi.fn();
    const wrapper = mountColumn({
      flat: true,
      actionButtons: [
        { text: '详情', props: { class: 'custom-detail' }, handler },
        { text: '隐藏', display: false, handler },
        { text: '禁用', disabled: () => true, props: { class: 'custom-disabled' }, handler },
      ],
    });
    await nextTick();

    expect(wrapper.text()).toContain('详情');
    expect(wrapper.text()).not.toContain('隐藏');
    expect(wrapper.find('.custom-detail').exists()).toBe(true);

    await wrapper.find('.custom-detail').trigger('click');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][1]).toMatchObject({
      model: { text: 'a' },
      index: 0,
      prop: 'list',
    });

    await wrapper.find('.custom-disabled').trigger('click');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('非 flat 且有 icon 时自定义按钮只显示图标，text 作为 title', async () => {
    const wrapper = mountColumn({
      actionButtons: [{ text: '详情', icon: Sort, props: { class: 'custom-icon' }, handler: () => undefined }],
    });
    await nextTick();

    const btn = wrapper.find('.custom-icon');
    expect(btn.exists()).toBe(true);
    expect(btn.attributes('title')).toBe('详情');
    expect(btn.text()).not.toContain('详情');
  });
});
