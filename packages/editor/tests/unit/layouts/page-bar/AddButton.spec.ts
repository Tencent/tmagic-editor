/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import AddButton from '@editor/layouts/page-bar/AddButton.vue';

const editorService = {
  get: vi.fn(),
  add: vi.fn(),
};

const uiService = {
  get: vi.fn(() => true),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ editorService, uiService }),
}));

vi.mock('@editor/utils/editor', () => ({
  generatePageNameByApp: vi.fn(() => 'page_xxx'),
}));

vi.mock('@tmagic/design', () => ({
  TMagicPopover: defineComponent({
    name: 'FakeTMagicPopover',
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-popover' }, [slots.reference?.(), slots.default?.()]);
    },
  }),
}));

vi.mock('@editor/components/Icon.vue', () => ({
  default: defineComponent({
    name: 'FakeIcon',
    props: ['icon'],
    setup() {
      return () => h('i', { class: 'fake-icon' });
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

beforeEach(() => {
  vi.clearAllMocks();
  uiService.get.mockReturnValue(true);
});

describe('AddButton.vue', () => {
  test('显示按钮渲染并支持新增页面', async () => {
    editorService.get.mockReturnValue({ items: [] });
    const wrapper = mount(AddButton);
    const btns = wrapper.findAll('.tool-btn');
    expect(btns.length).toBe(2);
    await btns[0].trigger('click');
    expect(editorService.add).toHaveBeenCalled();
    const args = editorService.add.mock.calls[0][0];
    expect(args.type).toBe('page');
    expect(args.name).toBe('page_xxx');
  });

  test('点击新增页面片', async () => {
    editorService.get.mockReturnValue({ items: [] });
    const wrapper = mount(AddButton);
    const btns = wrapper.findAll('.tool-btn');
    await btns[1].trigger('click');
    const args = editorService.add.mock.calls[0][0];
    expect(args.type).toBe('page-fragment');
  });

  test('root 不存在抛错且 add 不会被调用', async () => {
    editorService.get.mockReturnValue(null);
    const errorHandler = vi.fn();
    const wrapper = mount(AddButton, {
      global: {
        config: {
          errorHandler,
        },
      },
    });
    await wrapper.findAll('.tool-btn')[0].trigger('click');
    expect(errorHandler).toHaveBeenCalled();
    expect(editorService.add).not.toHaveBeenCalled();
  });

  test('showAddPageButton 为 false 时不渲染按钮', () => {
    uiService.get.mockReturnValue(false);
    const wrapper = mount(AddButton);
    expect(wrapper.find('.tool-btn').exists()).toBe(false);
  });
});
