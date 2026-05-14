/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import DataSourceAddButton from '@editor/layouts/sidebar/data-source/DataSourceAddButton.vue';

vi.mock('@tmagic/design', () => ({
  TMagicButton: defineComponent({
    name: 'FakeTMagicButton',
    inheritAttrs: false,
    setup(_p, { slots, attrs }) {
      return () =>
        h(
          'button',
          { ...attrs, class: ['fake-btn', (attrs as any).class].filter(Boolean).join(' ') },
          slots.default?.(),
        );
    },
  }),
  TMagicPopover: defineComponent({
    name: 'FakeTMagicPopover',
    setup(_p, { slots }) {
      return () =>
        h('div', { class: 'fake-popover' }, [
          slots.reference?.(),
          h('div', { class: 'popover-content' }, slots.default?.()),
        ]);
    },
  }),
}));

vi.mock('@editor/components/ToolButton.vue', () => ({
  default: defineComponent({
    name: 'FakeToolButton',
    props: ['data'],
    setup(props) {
      return () =>
        h(
          'button',
          {
            class: 'tool-btn',
            onClick: () => (props.data as any).handler?.(),
          },
          (props.data as any).text,
        );
    },
  }),
}));

describe('DataSourceAddButton.vue', () => {
  test('渲染按钮和数据源类型列表', () => {
    const wrapper = mount(DataSourceAddButton, {
      props: {
        datasourceTypeList: [
          { text: 'Base', type: 'base' },
          { text: 'HTTP', type: 'http' },
        ],
        addButtonText: '新增',
        addButtonConfig: { type: 'primary' } as any,
      },
    });
    expect(wrapper.text()).toContain('新增');
    expect(wrapper.text()).toContain('Base');
    expect(wrapper.text()).toContain('HTTP');
  });

  test('点击工具按钮触发 add 事件', async () => {
    const wrapper = mount(DataSourceAddButton, {
      props: {
        datasourceTypeList: [{ text: 'Base', type: 'base' }],
      },
    });
    await wrapper.findAll('.tool-btn')[0].trigger('click');
    expect(wrapper.emitted('add')?.[0]).toEqual(['base']);
  });

  test('addButtonConfig 与 addButtonText 缺省', () => {
    const wrapper = mount(DataSourceAddButton, {
      props: {
        datasourceTypeList: [],
      } as any,
    });
    expect(wrapper.find('.fake-btn').exists()).toBe(true);
  });
});
