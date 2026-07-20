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
  defineFormConfig: (cfg: any) => cfg,
  MContainer: defineComponent({
    name: 'MContainer',
    props: ['config', 'model', 'lastValues', 'isCompare', 'size', 'disabled'],
    emits: ['change', 'addDiffCount'],
    setup() {
      return () => h('div', { class: 'm-container' });
    },
  }),
}));

vi.mock('@editor/fields/StyleSetter/components/Box.vue', () => ({
  default: defineComponent({
    name: 'StyleBox',
    props: ['model', 'lastValues', 'isCompare', 'size', 'disabled'],
    emits: ['change'],
    setup() {
      return () => h('div', { class: 'fake-box' });
    },
  }),
}));

vi.mock('@editor/fields/StyleSetter/components/Border.vue', () => ({
  default: defineComponent({
    name: 'StyleBorder',
    props: ['model', 'lastValues', 'isCompare', 'size', 'disabled'],
    emits: ['change', 'addDiffCount'],
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

  test.each([
    ['Background', Background],
    ['BorderPro', BorderPro],
    ['Font', Font],
    ['Layout', Layout],
    ['Transform', Transform],
  ])('%s 透传 lastValues/isCompare 给 MContainer', (_name, comp) => {
    const wrapper = mount(comp as any, {
      props: {
        values: { color: 'red' },
        lastValues: { color: 'blue' },
        isCompare: true,
      },
    });
    const container = wrapper.findComponent({ name: 'MContainer' });
    expect(container.props('lastValues')).toEqual({ color: 'blue' });
    expect(container.props('isCompare')).toBe(true);
  });

  test.each([
    ['Background', Background],
    ['BorderPro', BorderPro],
    ['Font', Font],
    ['Layout', Layout],
    ['Transform', Transform],
  ])('%s 冒泡 MContainer 的 addDiffCount 事件', (_name, comp) => {
    const wrapper = mount(comp as any, { props: { values: {} } });
    const container = wrapper.findComponent({ name: 'MContainer' });
    container.vm.$emit('addDiffCount');
    expect(wrapper.emitted('addDiffCount')).toBeTruthy();
    expect(wrapper.emitted('addDiffCount')?.length).toBe(1);
  });

  test('Layout 透传 lastValues/isCompare 给 Box', () => {
    const wrapper = mount(Layout, {
      props: {
        values: { position: 'static' } as any,
        lastValues: { position: 'static' } as any,
        isCompare: true,
      },
    });
    const box = wrapper.findComponent({ name: 'StyleBox' });
    expect(box.props('lastValues')).toEqual({ position: 'static' });
    expect(box.props('isCompare')).toBe(true);
  });

  test('BorderPro 透传 lastValues/isCompare 给 Border 子组件，并冒泡其 addDiffCount', () => {
    const wrapper = mount(BorderPro, {
      props: {
        values: { borderRadius: '4px' } as any,
        lastValues: { borderRadius: '2px' } as any,
        isCompare: true,
      },
    });
    const border = wrapper.findComponent({ name: 'StyleBorder' });
    expect(border.props('lastValues')).toEqual({ borderRadius: '2px' });
    expect(border.props('isCompare')).toBe(true);

    border.vm.$emit('addDiffCount');
    expect(wrapper.emitted('addDiffCount')).toBeTruthy();
  });
});
