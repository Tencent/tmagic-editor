/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import BackgroundPosition from '@editor/fields/StyleSetter/components/BackgroundPosition.vue';

vi.mock('@tmagic/design', () => ({
  TMagicButton: defineComponent({
    name: 'TMagicButton',
    props: ['link', 'disabled'],
    emits: ['click'],
    setup(_props, { emit, slots }) {
      return () => h('button', { onClick: () => emit('click') }, slots.default?.());
    },
  }),
  TMagicInput: defineComponent({
    name: 'TMagicInput',
    props: ['modelValue', 'placeholder', 'clearable', 'size', 'disabled'],
    emits: ['update:modelValue', 'change'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          value: props.modelValue,
          onChange: (e: Event) => {
            emit('update:modelValue', (e.target as HTMLInputElement).value);
            emit('change', (e.target as HTMLInputElement).value);
          },
        });
    },
  }),
}));

describe('StyleSetter BackgroundPosition', () => {
  test('渲染 9 个预设位置按钮', () => {
    const wrapper = mount(BackgroundPosition, {
      props: { model: { backgroundPosition: '' }, name: 'backgroundPosition' } as any,
    });
    expect(wrapper.findAll('button').length).toBe(9);
  });

  test('点击预设按钮 emit change', async () => {
    const wrapper = mount(BackgroundPosition, {
      props: { model: { backgroundPosition: '' }, name: 'backgroundPosition' } as any,
    });
    await wrapper.findAll('button')[0].trigger('click');
    const evts = wrapper.emitted('change');
    expect(evts?.[0]?.[0]).toBe('left top');
  });

  test('输入框变化触发 change 事件', async () => {
    const wrapper = mount(BackgroundPosition, {
      props: { model: { backgroundPosition: '' }, name: 'backgroundPosition' } as any,
    });
    const input = wrapper.find('input');
    (input.element as HTMLInputElement).value = 'center bottom';
    await input.trigger('change');
    const evts = wrapper.emitted('change');
    expect(evts?.length).toBeGreaterThanOrEqual(1);
  });
});
