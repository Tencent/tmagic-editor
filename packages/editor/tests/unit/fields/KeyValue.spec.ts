/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import KeyValue from '@editor/fields/KeyValue.vue';

vi.mock('@tmagic/design', () => ({
  TMagicInput: defineComponent({
    name: 'TMagicInput',
    props: ['modelValue', 'disabled', 'size', 'placeholder'],
    emits: ['update:modelValue', 'change'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          class: 'fake-input',
          value: props.modelValue,
          placeholder: props.placeholder,
          onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value),
          onChange: (e: Event) => emit('change', (e.target as HTMLInputElement).value),
        });
    },
  }),
  TMagicButton: defineComponent({
    name: 'TMagicButton',
    props: ['type', 'size', 'disabled', 'plain', 'icon', 'circle', 'link'],
    emits: ['click'],
    setup(_p, { emit, slots }) {
      return () => h('button', { onClick: () => emit('click') }, slots.default?.());
    },
  }),
}));

vi.mock('@editor/layouts/CodeEditor.vue', () => ({
  default: defineComponent({
    name: 'MagicCodeEditor',
    props: ['initValues'],
    emits: ['save'],
    setup(_p, { emit }) {
      return () =>
        h('div', {
          class: 'code-editor',
          onClick: () => emit('save', 'function() {}'),
        });
    },
  }),
}));

vi.mock('@editor/icons/CodeIcon.vue', () => ({
  default: defineComponent({ name: 'CodeIcon', setup: () => () => h('i') }),
}));

describe('KeyValue', () => {
  const baseProps = (extra: any = {}) => ({
    config: { advanced: false, type: 'key-value' },
    name: 'kv',
    model: { kv: { foo: 'bar', baz: 'qux' } },
    disabled: false,
    size: 'default',
    ...extra,
  });

  test('渲染初始 records', () => {
    const wrapper = mount(KeyValue, { props: baseProps() as any });
    expect(wrapper.findAll('.m-fields-key-value-item').length).toBe(2);
  });

  test('addHandler 增加一个空 record', async () => {
    const wrapper = mount(KeyValue, { props: baseProps() as any });
    const buttons = wrapper.findAll('button');
    await buttons[buttons.length - 1].trigger('click');
    expect(wrapper.findAll('.m-fields-key-value-item').length).toBe(3);
  });

  test('deleteHandler 删除项并 emit change', async () => {
    const wrapper = mount(KeyValue, { props: baseProps() as any });
    const deleteBtns = wrapper.findAll('.m-fields-key-value-delete');
    await deleteBtns[0].trigger('click');
    expect(wrapper.findAll('.m-fields-key-value-item').length).toBe(1);
    const evts = wrapper.emitted('change');
    expect(evts?.[0]?.[0]).toEqual({ baz: 'qux' });
  });

  test('keyChange / valueChange emit change', async () => {
    const wrapper = mount(KeyValue, { props: baseProps() as any });
    const inputs = wrapper.findAll('input');
    (inputs[0].element as HTMLInputElement).value = 'k1';
    await inputs[0].trigger('input');
    await inputs[0].trigger('change');
    const evts = wrapper.emitted('change');
    expect(evts?.length).toBeGreaterThan(0);
  });

  test('config.advanced 时显示代码编辑切换按钮，可切换 showCode', async () => {
    const wrapper = mount(KeyValue, { props: baseProps({ config: { advanced: true, type: 'key-value' } }) as any });
    const buttons = wrapper.findAll('button');
    const last = buttons[buttons.length - 1];
    await last.trigger('click');
    await nextTick();
    expect(wrapper.find('.code-editor').exists()).toBe(true);
  });

  test('当值为非字符串时自动开启代码模式', () => {
    const wrapper = mount(KeyValue, {
      props: baseProps({
        config: { advanced: true, type: 'key-value' },
        model: { kv: { foo: { x: 1 } } },
      }) as any,
    });
    expect(wrapper.find('.code-editor').exists()).toBe(true);
  });

  test('当值为函数时自动开启代码模式', () => {
    const wrapper = mount(KeyValue, {
      props: baseProps({
        config: { advanced: true, type: 'key-value' },
        model: { kv: () => null },
      }) as any,
    });
    expect(wrapper.find('.code-editor').exists()).toBe(true);
  });

  test('CodeEditor save emit change', async () => {
    const wrapper = mount(KeyValue, {
      props: baseProps({
        config: { advanced: true, type: 'key-value' },
        model: { kv: () => null },
      }) as any,
    });
    await wrapper.find('.code-editor').trigger('click');
    const evts = wrapper.emitted('change');
    expect(evts?.[0]?.[0]).toBe('function() {}');
  });
});
