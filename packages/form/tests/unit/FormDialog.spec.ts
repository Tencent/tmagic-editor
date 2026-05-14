/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import MagicForm, { MFormBox, MFormDialog, MFormDrawer } from '@form/index';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';

describe('FormDialog/FormDrawer/FormBox', () => {
  test('FormDialog 基础渲染', async () => {
    const wrapper = mount(MFormDialog, {
      attachTo: document.body,
      global: {
        plugins: [ElementPlus as any, MagicForm as any],
      },
      props: {
        title: 'dialog-title',
        config: [{ name: 'text', type: 'text', text: 'text' }],
        values: { text: 'hello' },
      },
    });
    await nextTick();
    expect(wrapper.exists()).toBe(true);
    wrapper.unmount();
  });

  test('FormDrawer 基础渲染', async () => {
    const wrapper = mount(MFormDrawer, {
      attachTo: document.body,
      global: {
        plugins: [ElementPlus as any, MagicForm as any],
      },
      props: {
        title: 'drawer',
        config: [{ name: 'text', type: 'text', text: 'text' }],
        values: { text: 'world' },
      },
    });
    await nextTick();
    expect(wrapper.exists()).toBe(true);
    wrapper.unmount();
  });

  test('FormBox 基础渲染', async () => {
    const wrapper = mount(MFormBox, {
      global: {
        plugins: [ElementPlus as any, MagicForm as any],
      },
      props: {
        config: [{ name: 'text', type: 'text', text: 'text' }],
        initValues: { text: 'box' },
      },
    });
    await nextTick();
    expect(wrapper.exists()).toBe(true);
    wrapper.unmount();
  });
});
