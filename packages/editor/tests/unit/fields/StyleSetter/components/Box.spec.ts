/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { mount } from '@vue/test-utils';

import Box from '@editor/fields/StyleSetter/components/Box.vue';
import Position from '@editor/fields/StyleSetter/components/Position.vue';

describe('StyleSetter Box', () => {
  test('渲染 8 个输入框', () => {
    const wrapper = mount(Box, { props: { model: {} } });
    expect(wrapper.findAll('input').length).toBe(8);
  });

  test('根据 model 显示 margin/padding 值', () => {
    const wrapper = mount(Box, {
      props: {
        model: {
          marginTop: '10',
          marginRight: '20',
          marginBottom: '30',
          marginLeft: '40',
          paddingTop: '1',
          paddingRight: '2',
          paddingBottom: '3',
          paddingLeft: '4',
        },
      },
    });
    const values = wrapper.findAll('input').map((i) => (i.element as HTMLInputElement).value);
    expect(values).toEqual(['10', '20', '30', '40', '1', '2', '3', '4']);
  });

  test('model 变更时输入框值同步更新', async () => {
    const wrapper = mount(Box, {
      props: { model: { marginTop: '10', marginRight: '20' } },
    });
    expect((wrapper.findAll('input')[0].element as HTMLInputElement).value).toBe('10');

    await wrapper.setProps({ model: { marginTop: '50', marginRight: '60' } });
    expect((wrapper.findAll('input')[0].element as HTMLInputElement).value).toBe('50');
    expect((wrapper.findAll('input')[1].element as HTMLInputElement).value).toBe('60');
  });

  test('change 事件携带值与对应字段名', async () => {
    const wrapper = mount(Box, { props: { model: { marginTop: '10' } } });
    const input = wrapper.findAll('input')[0];
    (input.element as HTMLInputElement).value = '20';
    await input.trigger('change');
    const events = wrapper.emitted('change');
    expect(events?.[0]?.[0]).toBe('20');
    expect((events?.[0]?.[1] as any).modifyKey).toBe('marginTop');
  });

  test('disabled 时输入框被禁用', () => {
    const wrapper = mount(Box, { props: { model: {}, disabled: true } });
    const inputs = wrapper.findAll('input');
    inputs.forEach((i) => {
      expect((i.element as HTMLInputElement).disabled).toBe(true);
    });
  });
});

describe('StyleSetter Position', () => {
  test('渲染 4 个输入框', () => {
    const wrapper = mount(Position, { props: { model: {} } });
    expect(wrapper.findAll('input').length).toBe(4);
  });

  test('model 变更时输入框值同步更新', async () => {
    const wrapper = mount(Position, { props: { model: { top: '0', right: '10' } } });
    await wrapper.setProps({ model: { top: '20', right: '30' } });
    expect((wrapper.findAll('input')[0].element as HTMLInputElement).value).toBe('20');
    expect((wrapper.findAll('input')[1].element as HTMLInputElement).value).toBe('30');
  });

  test('change 事件触发并携带 modifyKey', async () => {
    const wrapper = mount(Position, { props: { model: { top: '0' } } });
    const input = wrapper.findAll('input')[1];
    (input.element as HTMLInputElement).value = '5px';
    await input.trigger('change');
    const events = wrapper.emitted('change');
    expect(events?.[0]?.[0]).toBe('5px');
    expect((events?.[0]?.[1] as any).modifyKey).toBe('right');
  });
});
