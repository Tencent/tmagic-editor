/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { mount } from '@vue/test-utils';

import InitialRow from '@editor/layouts/history-list/InitialRow.vue';

describe('InitialRow.vue', () => {
  test('渲染初始项的徽标与描述文案', () => {
    const wrapper = mount(InitialRow, { props: { isCurrent: false } });
    expect(wrapper.find('.m-editor-history-list-initial').exists()).toBe(true);
    expect(wrapper.find('.m-editor-history-list-item-op').text()).toBe('初始');
    expect(wrapper.find('.m-editor-history-list-item-op').classes()).toContain('op-initial');
    expect(wrapper.find('.m-editor-history-list-item-desc').text()).toBe('未修改的初始状态');
  });

  test('isCurrent=true 时附 is-current 类名且不展示「回到」按钮', () => {
    const wrapper = mount(InitialRow, { props: { isCurrent: true } });
    expect(wrapper.find('.m-editor-history-list-initial').classes()).toContain('is-current');
    expect(wrapper.find('.m-editor-history-list-item-goto').exists()).toBe(false);
  });

  test('非当前时点击「回到」按钮触发 goto-initial 事件', async () => {
    const wrapper = mount(InitialRow, { props: { isCurrent: false } });
    await wrapper.find('.m-editor-history-list-item-goto').trigger('click');
    expect(wrapper.emitted('goto-initial')).toBeTruthy();
    expect(wrapper.emitted('goto-initial')).toHaveLength(1);
  });

  test('当前状态点击不触发 goto-initial 事件', async () => {
    const wrapper = mount(InitialRow, { props: { isCurrent: true } });
    await wrapper.find('.m-editor-history-list-initial').trigger('click');
    expect(wrapper.emitted('goto-initial')).toBeFalsy();
  });
});
