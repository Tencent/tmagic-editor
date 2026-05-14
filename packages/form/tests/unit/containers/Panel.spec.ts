/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import MagicForm, { MForm } from '@form/index';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';

const mountForm = (config: any[], initValues: any = {}) =>
  mount(MForm, {
    global: { plugins: [ElementPlus as any, MagicForm as any] },
    props: { config, initValues },
  });

describe('Panel container', () => {
  test('panel 渲染并展示子项', async () => {
    const wrapper = mountForm(
      [
        {
          type: 'panel',
          title: 'group',
          items: [{ name: 'text', type: 'text', text: 'text' }],
        },
      ],
      { text: 'hello' },
    );
    await nextTick();
    expect(wrapper.text()).toContain('group');
  });

  test('row 容器渲染', async () => {
    const wrapper = mountForm(
      [
        {
          type: 'row',
          items: [{ name: 'text', type: 'text', text: 'text' }],
        },
      ],
      { text: 'r' },
    );
    await nextTick();
    expect(wrapper.exists()).toBe(true);
  });

  test('fieldset 容器渲染', async () => {
    const wrapper = mountForm(
      [
        {
          type: 'fieldset',
          legend: 'fs',
          items: [{ name: 'text', type: 'text', text: 'text' }],
        },
      ],
      { text: 'fs' },
    );
    await nextTick();
    expect(wrapper.exists()).toBe(true);
  });

  test('flex-layout 容器渲染', async () => {
    const wrapper = mountForm(
      [
        {
          type: 'flex-layout',
          items: [{ name: 'text', type: 'text', text: 'text' }],
        },
      ],
      { text: 'fl' },
    );
    await nextTick();
    expect(wrapper.exists()).toBe(true);
  });
});
