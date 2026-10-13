/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';

import MagicForm, { MForm, MTimerange } from '@form/index';

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

  test('valueFormat 为 X 时区间收成秒数字', async () => {
    const wrapper = mountForm([{ name: 'tr', type: 'timerange', text: 'tr', valueFormat: 'X' }], {
      tr: [1626507420, 1626593820],
    });

    await nextTick();

    wrapper.findComponent({ name: 'TMTimePicker' }).vm.$emit('change', ['1626507420', '1626593820']);
    await nextTick();

    expect((wrapper.vm as any).values.tr).toEqual([1626507420, 1626593820]);
  });

  test('valueFormat 为 X 且 names 时分别写入秒数字', async () => {
    const wrapper = mountForm([{ type: 'timerange', text: 'tr', names: ['start', 'end'], valueFormat: 'X' }], {
      start: 1626507420,
      end: 1626593820,
    });

    await nextTick();

    wrapper.findComponent({ name: 'TMTimePicker' }).vm.$emit('change', ['1626507420', '1626593820']);
    await nextTick();

    expect((wrapper.vm as any).values.start).toBe(1626507420);
    expect((wrapper.vm as any).values.end).toBe(1626593820);
  });
});
