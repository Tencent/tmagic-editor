/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import MagicForm, { MForm, MNumberRange } from '@form/index';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';

const getWrapper = (initValues: any = { range: [10, 20] }) =>
  mount(MForm, {
    global: { plugins: [ElementPlus as any, MagicForm as any] },
    props: {
      initValues,
      config: [
        {
          text: 'range',
          name: 'range',
          type: 'number-range',
        },
      ],
    },
  });

describe('NumberRange', () => {
  test('基础渲染', async () => {
    const wrapper = getWrapper();
    await nextTick();
    expect(wrapper.findComponent(MNumberRange).exists()).toBe(true);
  });

  test('change first 触发 emit', async () => {
    const wrapper = getWrapper();
    await nextTick();
    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('100');
    await inputs[0].trigger('change');
    const value = await (wrapper.vm as any).submitForm();
    expect(value.range[0]).toBe(100);
  });

  test('initValues 不是数组时被自动初始化为 []', async () => {
    const wrapper = mount(MForm, {
      global: { plugins: [ElementPlus as any, MagicForm as any] },
      props: {
        initValues: { range: 'not-array' },
        config: [{ name: 'range', text: 'range', type: 'number-range' }],
      },
    });
    await nextTick();
    expect(wrapper.findComponent(MNumberRange).exists()).toBe(true);
  });
});
