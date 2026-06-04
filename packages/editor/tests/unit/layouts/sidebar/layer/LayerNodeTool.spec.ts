/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import LayerNodeTool from '@editor/layouts/sidebar/layer/LayerNodeTool.vue';

const editorService = {
  update: vi.fn(),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ editorService }),
}));

vi.mock('@tmagic/design', () => ({
  TMagicButton: defineComponent({
    name: 'TMagicButton',
    props: ['type', 'icon', 'title', 'link'],
    emits: ['click'],
    setup(_props, { emit, slots }) {
      return () => h('button', { onClick: (e: Event) => emit('click', e) }, slots.default?.());
    },
  }),
}));

describe('LayerNodeTool', () => {
  test('page 类型不渲染按钮', () => {
    const wrapper = mount(LayerNodeTool, { props: { data: { id: 'p1', type: 'page' } as any } });
    expect(wrapper.find('button').exists()).toBe(false);
  });

  test('点击按钮切换 visible 状态 (true -> false)', async () => {
    const wrapper = mount(LayerNodeTool, {
      props: { data: { id: 'n1', type: 'text', visible: true } as any },
    });
    await wrapper.find('button').trigger('click');
    expect(editorService.update).toHaveBeenCalledWith({ id: 'n1', visible: false }, { historySource: 'tree' });
  });

  test('点击按钮切换 visible 状态 (false -> true)', async () => {
    editorService.update.mockClear();
    const wrapper = mount(LayerNodeTool, {
      props: { data: { id: 'n2', type: 'text', visible: false } as any },
    });
    await wrapper.find('button').trigger('click');
    expect(editorService.update).toHaveBeenCalledWith({ id: 'n2', visible: true }, { historySource: 'tree' });
  });
});
