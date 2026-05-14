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

describe('GroupList container', () => {
  test('空数据时显示暂无数据', async () => {
    const wrapper = mountForm(
      [
        {
          type: 'group-list',
          name: 'list',
          items: [{ name: 'text', type: 'text', text: 'text' }],
        },
      ],
      { list: [] },
    );
    await nextTick();
    expect(wrapper.text()).toContain('暂无数据');
  });

  test('有数据时渲染列表项', async () => {
    const wrapper = mountForm(
      [
        {
          type: 'group-list',
          name: 'list',
          items: [{ name: 'text', type: 'text', text: 'text' }],
        },
      ],
      { list: [{ text: 'a' }, { text: 'b' }] },
    );
    await nextTick();
    expect(wrapper.findAllComponents({ name: 'MFormGroupList' })).toHaveLength(1);
  });

  test('extra 字段渲染 HTML', async () => {
    const wrapper = mountForm(
      [
        {
          type: 'group-list',
          name: 'list',
          extra: '<em>tip</em>',
          items: [{ name: 'text', type: 'text' }],
        },
      ],
      { list: [] },
    );
    await nextTick();
    expect(wrapper.html()).toContain('<em>tip</em>');
  });
});
