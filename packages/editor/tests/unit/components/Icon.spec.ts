/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import Icon from '@editor/components/Icon.vue';

describe('Icon.vue', () => {
  test('未传 icon 时渲染默认 Edit 图标', () => {
    const wrapper = mount(Icon as any);
    expect(wrapper.find('.magic-editor-icon').exists()).toBe(true);
  });

  test('icon 为 http 链接时使用 img 标签', () => {
    const wrapper = mount(Icon as any, { props: { icon: 'https://example.com/x.png' } });
    expect(wrapper.find('img').exists()).toBe(true);
    expect(wrapper.find('img').attributes('src')).toBe('https://example.com/x.png');
  });

  test('icon 为相对路径时也使用 img 标签', () => {
    const wrapper = mount(Icon as any, { props: { icon: './local.png' } });
    expect(wrapper.find('img').exists()).toBe(true);
  });

  test('icon 为 ../ 路径时使用 img 标签', () => {
    const wrapper = mount(Icon as any, { props: { icon: '../up.png' } });
    expect(wrapper.find('img').exists()).toBe(true);
  });

  test('icon 为 className 字符串时渲染 i 标签', () => {
    const wrapper = mount(Icon as any, { props: { icon: 'el-icon-edit' } });
    expect(wrapper.find('i').exists()).toBe(true);
    expect(wrapper.find('i').classes()).toContain('el-icon-edit');
  });

  test('icon 为组件时通过 component 渲染', () => {
    const customComp = defineComponent({ render: () => h('span', { class: 'custom-icon' }, 'C') });
    const wrapper = mount(Icon as any, { props: { icon: customComp } });
    expect(wrapper.find('.custom-icon').exists()).toBe(true);
  });
});
