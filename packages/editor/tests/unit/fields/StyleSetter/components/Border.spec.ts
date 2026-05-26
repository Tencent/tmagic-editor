/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import Border from '@editor/fields/StyleSetter/components/Border.vue';

vi.mock('@tmagic/form', () => ({
  defineFormItem: (cfg: any) => cfg,
  MContainer: defineComponent({
    name: 'MContainer',
    props: ['config', 'model', 'lastValues', 'isCompare', 'size', 'disabled'],
    emits: ['change', 'addDiffCount'],
    setup(_props, { expose }) {
      expose({ trigger: () => null });
      return () => h('div', { class: 'm-container' });
    },
  }),
}));

describe('StyleSetter Border', () => {
  test('点击 direction 图标更新 active 状态', async () => {
    const wrapper = mount(Border, { props: { model: {} } });
    const top = wrapper.find('.border-icon-top');
    await top.trigger('click');
    expect(top.classes()).toContain('active');
    const center = wrapper.find('.border-icon-container-row:nth-child(2) .border-icon:nth-child(2)');
    await center.trigger('click');
    expect(top.classes()).not.toContain('active');
  });

  test('change 事件按 changeRecords 拆分发出', async () => {
    const wrapper = mount(Border, { props: { model: {} } });
    const container = wrapper.findComponent({ name: 'MContainer' });
    container.vm.$emit(
      'change',
      {},
      {
        changeRecords: [
          { value: '1px', propPath: 'borderWidth' },
          { value: 'red', propPath: 'borderColor' },
        ],
      },
    );
    const events = wrapper.emitted('change');
    expect(events?.length).toBe(2);
    expect(events?.[0]).toEqual(['1px', { modifyKey: 'borderWidth' }]);
    expect(events?.[1]).toEqual(['red', { modifyKey: 'borderColor' }]);
  });

  test('selectDirection 切换不同方向都生效', async () => {
    const wrapper = mount(Border, { props: { model: {} } });
    await wrapper.find('.border-icon-bottom').trigger('click');
    expect(wrapper.find('.border-icon-bottom').classes()).toContain('active');
    await wrapper.find('.border-icon-left').trigger('click');
    expect(wrapper.find('.border-icon-left').classes()).toContain('active');
    await wrapper.find('.border-icon-right').trigger('click');
    expect(wrapper.find('.border-icon-right').classes()).toContain('active');
  });

  test('lastValues/isCompare 透传到 MContainer', () => {
    const wrapper = mount(Border, {
      props: {
        model: { borderWidth: '2px' },
        lastValues: { borderWidth: '1px' },
        isCompare: true,
      } as any,
    });
    const container = wrapper.findComponent({ name: 'MContainer' });
    expect(container.props('lastValues')).toEqual({ borderWidth: '1px' });
    expect(container.props('isCompare')).toBe(true);
  });

  test('MContainer 的 addDiffCount 事件向上冒泡', () => {
    const wrapper = mount(Border, { props: { model: {} } });
    const container = wrapper.findComponent({ name: 'MContainer' });
    container.vm.$emit('addDiffCount');
    expect(wrapper.emitted('addDiffCount')).toBeTruthy();
    expect(wrapper.emitted('addDiffCount')?.length).toBe(1);
  });
});
