/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import AddPageBox from '@editor/layouts/AddPageBox.vue';

vi.mock('@tmagic/core', async () => {
  const actual = await vi.importActual<any>('@tmagic/core');
  return {
    ...actual,
    NodeType: { PAGE: 'page', PAGE_FRAGMENT: 'page-fragment' },
  };
});

const editorService = {
  get: vi.fn((key: string) => (key === 'root' ? { items: [] } : undefined)),
  add: vi.fn(),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ editorService }),
}));

vi.mock('@editor/utils', () => ({
  generatePageNameByApp: vi.fn(() => 'page_1'),
}));

vi.mock('@editor/components/Icon.vue', () => ({
  default: { name: 'MIcon', props: ['icon'], render: () => null },
}));

describe('AddPageBox', () => {
  test('点击新增页面调用 editorService.add', async () => {
    editorService.get.mockReturnValue({ items: [] });
    const wrapper = mount(AddPageBox, { props: { disabledPageFragment: false } });
    const buttons = wrapper.findAll('.m-editor-empty-button');
    expect(buttons.length).toBe(2);
    await buttons[0].trigger('click');
    expect(editorService.add).toHaveBeenCalledWith({ type: 'page', name: 'page_1', items: [] });
    await buttons[1].trigger('click');
    expect(editorService.add).toHaveBeenCalledWith({
      type: 'page-fragment',
      name: 'page_1',
      items: [],
    });
  });

  test('disabledPageFragment 为 true 时只渲染新增页面', () => {
    const wrapper = mount(AddPageBox, { props: { disabledPageFragment: true } });
    expect(wrapper.findAll('.m-editor-empty-button').length).toBe(1);
  });

  test('root 为空时抛错', async () => {
    editorService.get.mockReturnValue(undefined);
    const wrapper = mount(AddPageBox, { props: { disabledPageFragment: false } });
    const buttons = wrapper.findAll('.m-editor-empty-button');
    await expect(async () => {
      await buttons[0].trigger('click');
    }).rejects.toThrowError('root 不能为空');
  });
});
