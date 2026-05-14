/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import MagicForm, { MCascader, MForm } from '@form/index';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';

const mountForm = (config: any[], initValues: any = {}) =>
  mount(MForm, {
    global: { plugins: [ElementPlus as any, MagicForm as any] },
    props: { config, initValues },
  });

describe('Cascader', () => {
  test('基础数组 options 渲染', async () => {
    const wrapper = mountForm(
      [
        {
          name: 'cas',
          type: 'cascader',
          text: 'cas',
          options: [
            { value: 'a', label: 'A', children: [{ value: 'a1', label: 'A1' }] },
            { value: 'b', label: 'B' },
          ],
        },
      ],
      { cas: ['a', 'a1'] },
    );
    await nextTick();
    expect(wrapper.findComponent(MCascader).exists()).toBe(true);
  });

  test('valueSeparator 时拆分为数组', async () => {
    const wrapper = mountForm(
      [
        {
          name: 'cas',
          type: 'cascader',
          text: 'cas',
          valueSeparator: ',',
          options: [{ value: 'a', label: 'A', children: [{ value: 'a1', label: 'A1' }] }],
        },
      ],
      { cas: 'a,a1' },
    );
    await nextTick();
    expect(wrapper.findComponent(MCascader).exists()).toBe(true);
  });

  test('options 是函数时异步获取', async () => {
    const wrapper = mountForm(
      [
        {
          name: 'cas',
          type: 'cascader',
          text: 'cas',
          options: async () => [{ value: 'x', label: 'X' }],
        },
      ],
      { cas: [] },
    );
    await nextTick();
    await nextTick();
    expect(wrapper.findComponent(MCascader).exists()).toBe(true);
  });
});
