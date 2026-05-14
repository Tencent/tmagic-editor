/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import Background from '@editor/fields/StyleSetter/pro/Background.vue';
import BorderPro from '@editor/fields/StyleSetter/pro/Border.vue';
import Font from '@editor/fields/StyleSetter/pro/Font.vue';
import Layout from '@editor/fields/StyleSetter/pro/Layout.vue';
import Transform from '@editor/fields/StyleSetter/pro/Transform.vue';

vi.mock('@tmagic/form', () => ({
  defineFormItem: (cfg: any) => cfg,
  MContainer: defineComponent({
    name: 'MContainer',
    props: ['config', 'model', 'size', 'disabled'],
    emits: ['change'],
    setup() {
      return () => h('div', { class: 'm-container' });
    },
  }),
}));

vi.mock('@editor/fields/StyleSetter/components/Box.vue', () => ({
  default: defineComponent({
    name: 'StyleBox',
    props: ['model', 'size', 'disabled'],
    emits: ['change'],
    setup() {
      return () => h('div', { class: 'fake-box' });
    },
  }),
}));

vi.mock('@editor/fields/StyleSetter/components/Border.vue', () => ({
  default: defineComponent({
    name: 'StyleBorder',
    props: ['model', 'size', 'disabled'],
    emits: ['change'],
    setup() {
      return () => h('div', { class: 'fake-border' });
    },
  }),
}));

vi.mock('@editor/fields/StyleSetter/components/BackgroundPosition.vue', () => ({
  default: defineComponent({
    name: 'BackgroundPosition',
    setup() {
      return () => h('div');
    },
  }),
}));

describe('StyleSetter pro 组件', () => {
  test.each([
    ['Background', Background],
    ['BorderPro', BorderPro],
    ['Font', Font],
    ['Layout', Layout],
    ['Transform', Transform],
  ])('%s 渲染 MContainer 并透传 change', (_name, comp) => {
    const wrapper = mount(comp as any, { props: { values: { display: 'block' } } });
    const container = wrapper.findComponent({ name: 'MContainer' });
    expect(container.exists()).toBe(true);
    container.vm.$emit('change', { color: 'red' }, { modifyKey: 'color' });
    const events = wrapper.emitted('change');
    expect(events?.[0]?.[0]).toEqual({ color: 'red' });
  });

  test('Layout 在 fixed/absolute 时隐藏 Box', () => {
    const wrapper = mount(Layout, { props: { values: { position: 'fixed' } as any } });
    const box = wrapper.find('.fake-box');
    expect((box.element as HTMLElement).style.display).toBe('none');
  });

  test('Layout 非 fixed/absolute 时显示 Box', () => {
    const wrapper = mount(Layout, { props: { values: { position: 'relative' } as any } });
    const box = wrapper.find('.fake-box');
    expect((box.element as HTMLElement).style.display).not.toBe('none');
  });

  test('BorderPro 渲染 Border 子组件', () => {
    const wrapper = mount(BorderPro, { props: { values: {} } });
    expect(wrapper.find('.fake-border').exists()).toBe(true);
  });
});
