/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import MagicForm, { MForm, MTimerange } from '@form/index';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';

const mountForm = (config: any[], initValues: any) =>
  mount(MForm, {
    global: { plugins: [ElementPlus as any, MagicForm as any] },
    props: { config, initValues },
  });

describe('Timerange', () => {
  test('单 name 渲染', async () => {
    const wrapper = mountForm([{ name: 'tr', type: 'timerange', text: 'tr' }], { tr: ['08:00:00', '20:00:00'] });
    await nextTick();
    expect(wrapper.findComponent(MTimerange).exists()).toBe(true);
  });

  test('双 names 渲染', async () => {
    const wrapper = mountForm([{ name: 'tr', type: 'timerange', text: 'tr', names: ['start', 'end'] }], {
      start: '08:00:00',
      end: '20:00:00',
    });
    await nextTick();
    expect(wrapper.findComponent(MTimerange).exists()).toBe(true);
  });
});
