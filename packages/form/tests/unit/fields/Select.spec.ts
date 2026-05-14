/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import MagicForm, { MForm, MSelect } from '@form/index';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';

const mountForm = (config: any[], initValues: any = {}) =>
  mount(MForm, {
    global: { plugins: [ElementPlus as any, MagicForm as any] },
    props: { config, initValues },
  });

describe('Select', () => {
  test('数组 options 渲染', async () => {
    const wrapper = mountForm(
      [
        {
          name: 's',
          type: 'select',
          text: 's',
          options: [
            { text: 'A', value: 'a' },
            { text: 'B', value: 'b' },
          ],
        },
      ],
      { s: 'a' },
    );
    await nextTick();
    expect(wrapper.findComponent(MSelect).exists()).toBe(true);
  });

  test('options 是函数', async () => {
    const wrapper = mountForm(
      [
        {
          name: 's',
          type: 'select',
          text: 's',
          options: () => [{ text: 'A', value: 'a' }],
        },
      ],
      { s: 'a' },
    );
    await nextTick();
    await nextTick();
    expect(wrapper.findComponent(MSelect).exists()).toBe(true);
  });

  test('group 形式 options', async () => {
    const wrapper = mountForm(
      [
        {
          name: 's',
          type: 'select',
          text: 's',
          group: true,
          options: [
            {
              label: 'g1',
              options: [{ text: 'A', value: 'a' }],
            },
          ],
        },
      ],
      { s: 'a' },
    );
    await nextTick();
    expect(wrapper.findComponent(MSelect).exists()).toBe(true);
  });

  test('multiple 多选', async () => {
    const wrapper = mountForm(
      [
        {
          name: 's',
          type: 'select',
          text: 's',
          multiple: true,
          options: [
            { text: 'A', value: 'a' },
            { text: 'B', value: 'b' },
          ],
        },
      ],
      { s: ['a'] },
    );
    await nextTick();
    expect(wrapper.findComponent(MSelect).exists()).toBe(true);
  });
});
