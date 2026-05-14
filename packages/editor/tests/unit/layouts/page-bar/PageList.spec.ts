/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import PageList from '@editor/layouts/page-bar/PageList.vue';

const editorService = {
  get: vi.fn(),
  select: vi.fn().mockResolvedValue(undefined),
};

const uiService = {
  get: vi.fn(() => true),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ editorService, uiService }),
}));

vi.mock('@tmagic/design', () => ({
  TMagicIcon: defineComponent({
    name: 'FakeTMagicIcon',
    setup(_p, { slots }) {
      return () => h('i', { class: 'fake-tmagic-icon' }, slots.default?.());
    },
  }),
  TMagicPopover: defineComponent({
    name: 'FakeTMagicPopover',
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-popover' }, [slots.reference?.(), slots.default?.()]);
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
            class: ['tool-btn', (props.data as any).className].filter(Boolean).join(' '),
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

describe('PageList.vue', () => {
  test('展示页面列表', () => {
    editorService.get.mockReturnValue({ id: 'p1' });
    const wrapper = mount(PageList, {
      props: {
        list: [
          { id: 'p1', name: 'Page 1' } as any,
          { id: 'p2', name: 'Page 2', devconfig: { tabName: 'Page2-Tab' } } as any,
        ],
      },
    });
    const btns = wrapper.findAll('.tool-btn');
    expect(btns[0].text()).toBe('Page 1');
    expect(btns[0].classes()).toContain('active');
    expect(btns[1].text()).toBe('Page2-Tab');
    expect(btns[1].classes()).not.toContain('active');
  });

  test('id 缺省 fallback', () => {
    editorService.get.mockReturnValue(null);
    const wrapper = mount(PageList, {
      props: {
        list: [{ id: 'p3' } as any],
      },
    });
    expect(wrapper.find('.tool-btn').text()).toBe('p3');
  });

  test('点击切换页面', async () => {
    editorService.get.mockReturnValue({ id: 'p1' });
    const wrapper = mount(PageList, {
      props: {
        list: [{ id: 'p2', name: 'Page 2' } as any],
      },
    });
    await wrapper.find('.tool-btn').trigger('click');
    expect(editorService.select).toHaveBeenCalledWith('p2');
  });

  test('showPageListButton 为 false 时不渲染', () => {
    uiService.get.mockReturnValue(false);
    const wrapper = mount(PageList, {
      props: { list: [{ id: 'p1' } as any] },
    });
    expect(wrapper.find('.tool-btn').exists()).toBe(false);
  });
});
