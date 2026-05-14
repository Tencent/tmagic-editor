/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import StyleSetter from '@editor/fields/StyleSetter/Index.vue';

vi.mock('@tmagic/design', () => ({
  TMagicCollapse: defineComponent({
    name: 'TMagicCollapse',
    props: ['modelValue'],
    setup(_props, { slots }) {
      return () => h('div', { class: 'collapse' }, slots.default?.());
    },
  }),
  TMagicCollapseItem: defineComponent({
    name: 'TMagicCollapseItem',
    props: ['name'],
    setup(_props, { slots }) {
      return () => h('div', { class: 'collapse-item' }, [slots.title?.(), slots.default?.()]);
    },
  }),
}));

vi.mock('@editor/components/Icon.vue', () => ({
  default: defineComponent({ name: 'MIcon', props: ['icon'], setup: () => () => h('i') }),
}));

vi.mock('@editor/fields/StyleSetter/pro/index', () => {
  const make = (name: string) =>
    defineComponent({
      name,
      props: ['values', 'size', 'disabled'],
      emits: ['change'],
      setup(_p, { emit }) {
        return () =>
          h('div', {
            class: name,
            onClick: () => emit('change', { foo: 1 }, { changeRecords: [{ propPath: 'foo', value: 1 }] }),
          });
      },
    });
  return {
    Layout: make('Layout'),
    Position: make('Position'),
    Background: make('Background'),
    Font: make('Font'),
    Border: make('Border'),
    Transform: make('Transform'),
  };
});

describe('StyleSetter Index', () => {
  test('渲染 6 个 collapse-item', () => {
    const wrapper = mount(StyleSetter, {
      props: { model: { style: {} }, name: 'style' } as any,
    });
    expect(wrapper.findAll('.collapse-item').length).toBe(6);
  });

  test('change 时为 propPath 添加 name 前缀', async () => {
    const wrapper = mount(StyleSetter, {
      props: { model: { style: {} }, name: 'style' } as any,
    });
    await wrapper.find('.Layout').trigger('click');
    const events = wrapper.emitted('change');
    expect(events).toBeTruthy();
    expect((events?.[0]?.[1] as any).changeRecords[0].propPath).toBe('style.foo');
  });
});
