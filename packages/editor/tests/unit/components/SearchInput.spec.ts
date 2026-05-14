/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import SearchInput from '@editor/components/SearchInput.vue';

vi.mock('@tmagic/design', async () => {
  const actual: any = await vi.importActual('@tmagic/design');
  return {
    ...actual,
    TMagicInput: defineComponent({
      name: 'TMagicInputStub',
      props: ['modelValue'],
      emits: ['input', 'update:modelValue'],
      setup(props, { emit, slots }) {
        return () =>
          h(
            'input',
            {
              value: props.modelValue,
              onInput: (e: any) => {
                emit('update:modelValue', e.target.value);
                emit('input', e.target.value);
              },
            },
            slots.prefix?.(),
          );
      },
    }),
    TMagicIcon: defineComponent({ render: () => h('i') }),
  };
});

describe('SearchInput.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('挂载后渲染输入框', () => {
    const wrapper = mount(SearchInput as any);
    expect(wrapper.find('input').exists()).toBe(true);
  });

  test('输入后 300ms 触发 search 事件', async () => {
    const wrapper = mount(SearchInput as any);
    const input = wrapper.find('input');
    await input.setValue('hello');

    expect(wrapper.emitted('search')).toBeFalsy();

    vi.advanceTimersByTime(300);
    expect(wrapper.emitted('search')).toBeTruthy();
    expect((wrapper.emitted('search') as any[])[0][0]).toBe('hello');
  });

  test('连续输入只触发一次 search', async () => {
    const wrapper = mount(SearchInput as any);
    const input = wrapper.find('input');
    await input.setValue('a');
    vi.advanceTimersByTime(100);
    await input.setValue('ab');
    vi.advanceTimersByTime(300);
    expect(wrapper.emitted('search')?.length).toBe(1);
    expect((wrapper.emitted('search') as any[])[0][0]).toBe('ab');
  });
});
