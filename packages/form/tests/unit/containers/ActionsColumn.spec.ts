/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { nextTick, reactive } from 'vue';
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

const mountColumn = (config: any, context: Record<string, any> = { env: 'prod' }) =>
  mount(ActionsColumn as any, {
    global: {
      plugins: [ElementPlus as any, MagicForm as any],
      provide: { mForm: createMForm(context) },
    },
    props: {
      config: { type: 'table', name: 'list', ...config },
      model: { list: [{ text: 'a' }] },
      name: 'list',
      prop: 'list',
      currentPage: 0,
      pageSize: 10,
      index: 0,
      row: { text: 'a' },
    },
  });

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
});
