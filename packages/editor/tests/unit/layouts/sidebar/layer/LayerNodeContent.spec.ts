/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';
import { mount } from '@vue/test-utils';

import LayerNodeContent from '@editor/layouts/sidebar/layer/LayerNodeContent.vue';

// 用 reactive Map 模拟 editorService 中集中存储的校验错误状态
const invalidNodeIds = reactive(new Map<any, any>());

const editorService = {
  get: vi.fn((k: string) => (k === 'invalidNodeIds' ? invalidNodeIds : null)),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ editorService }),
}));

vi.mock('@editor/components/Icon.vue', () => ({
  default: defineComponent({
    name: 'IconStub',
    props: ['icon'],
    setup() {
      return () => h('i', { class: 'fake-error-icon' });
    },
  }),
}));

vi.mock('@tmagic/design', () => ({
  TMagicTooltip: defineComponent({
    name: 'TMagicTooltip',
    props: ['placement'],
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-tooltip' }, [slots.content?.(), slots.default?.()]);
    },
  }),
}));

describe('LayerNodeContent', () => {
  test('展示 name (id) 文本', () => {
    const wrapper = mount(LayerNodeContent, {
      props: { data: { id: 'n1', name: '文本', type: 'text' } as any },
    });
    expect(wrapper.find('.m-editor-layer-node-label').text()).toBe('文本 (n1)');
  });

  test('无错误时不显示错误图标且不带 is-invalid 样式', () => {
    invalidNodeIds.clear();
    const wrapper = mount(LayerNodeContent, {
      props: { data: { id: 'n1', name: '文本', type: 'text' } as any },
    });
    expect(wrapper.find('.fake-error-icon').exists()).toBe(false);
    expect(wrapper.find('.m-editor-layer-node-content').classes()).not.toContain('is-invalid');
  });

  test('存在错误时标红并显示错误图标', () => {
    invalidNodeIds.clear();
    invalidNodeIds.set('n1', { props: 'name 必填' });
    const wrapper = mount(LayerNodeContent, {
      props: { data: { id: 'n1', name: '文本', type: 'text' } as any },
    });
    expect(wrapper.find('.fake-error-icon').exists()).toBe(true);
    expect(wrapper.find('.m-editor-layer-node-content').classes()).toContain('is-invalid');
  });

  test('tooltip 合并展示 props 与 style 错误（HTML）', () => {
    invalidNodeIds.clear();
    invalidNodeIds.set('n1', { props: 'name 必填', style: 'width 非法' });
    const wrapper = mount(LayerNodeContent, {
      props: { data: { id: 'n1', name: '文本', type: 'text' } as any },
    });
    const tooltip = wrapper.find('.fake-tooltip');
    expect(tooltip.html()).toContain('name 必填');
    expect(tooltip.html()).toContain('width 非法');
  });

  test('错误状态变化时响应式更新', async () => {
    invalidNodeIds.clear();
    const wrapper = mount(LayerNodeContent, {
      props: { data: { id: 'n1', name: '文本', type: 'text' } as any },
    });
    expect(wrapper.find('.fake-error-icon').exists()).toBe(false);

    invalidNodeIds.set('n1', { props: 'name 必填' });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.fake-error-icon').exists()).toBe(true);

    invalidNodeIds.delete('n1');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.fake-error-icon').exists()).toBe(false);
  });
});
