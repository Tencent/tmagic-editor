/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import ComponentListPanel from '@editor/layouts/sidebar/ComponentListPanel.vue';

const editorService = {
  get: vi.fn(),
  add: vi.fn(),
};
const componentListService = {
  getList: vi.fn(() => [{ title: '基础', items: [{ text: '按钮', type: 'button', icon: '' }] }]),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ editorService, componentListService }),
}));

vi.mock('@tmagic/utils', async () => {
  const actual = await vi.importActual<any>('@tmagic/utils');
  return { ...actual, removeClassNameByClassName: vi.fn() };
});

vi.mock('@tmagic/design', () => ({
  TMagicCollapse: defineComponent({
    name: 'TMagicCollapse',
    setup(_p, { slots }) {
      return () => h('div', slots.default?.());
    },
  }),
  TMagicCollapseItem: defineComponent({
    name: 'TMagicCollapseItem',
    props: ['name'],
    setup(_p, { slots }) {
      return () => h('div', { class: 'collapse-item' }, [slots.title?.(), slots.default?.()]);
    },
  }),
  TMagicScrollbar: defineComponent({
    name: 'TMagicScrollbar',
    setup(_p, { slots }) {
      return () => h('div', slots.default?.());
    },
  }),
  TMagicTooltip: defineComponent({
    name: 'TMagicTooltip',
    props: ['placement', 'content', 'disabled'],
    setup(_p, { slots }) {
      return () => h('div', slots.default?.());
    },
  }),
}));

vi.mock('@editor/components/Icon.vue', () => ({
  default: defineComponent({ name: 'MIcon', props: ['icon'], setup: () => () => h('i') }),
}));

vi.mock('@editor/components/SearchInput.vue', () => ({
  default: defineComponent({
    name: 'SearchInput',
    emits: ['search'],
    setup(_p, { emit }) {
      return () =>
        h('input', {
          class: 'fake-search',
          onInput: (e: Event) => emit('search', (e.target as HTMLInputElement).value),
        });
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  componentListService.getList.mockReturnValue([
    {
      title: '基础',
      items: [
        { text: '按钮', type: 'button' },
        { text: '文本', type: 'text' },
      ],
    },
    { title: '容器', items: [{ text: '行', type: 'row' }] },
  ]);
  editorService.get.mockReturnValue({ renderer: { getDocument: () => null }, delayedMarkContainer: vi.fn() });
});

describe('ComponentListPanel', () => {
  test('渲染分组列表', () => {
    const wrapper = mount(ComponentListPanel);
    expect(wrapper.findAll('.component-item').length).toBe(3);
  });

  test('点击 component-item 调用 editorService.add', async () => {
    const wrapper = mount(ComponentListPanel);
    await wrapper.find('.component-item').trigger('click');
    expect(editorService.add).toHaveBeenCalledWith({ name: '按钮', type: 'button' });
  });

  test('搜索过滤组件', async () => {
    const wrapper = mount(ComponentListPanel);
    await wrapper.find('.fake-search').setValue('按钮');
    expect(wrapper.findAll('.component-item').length).toBe(1);
  });

  test('dragstart 事件设置 dataTransfer', async () => {
    const wrapper = mount(ComponentListPanel);
    const dt = { setData: vi.fn() };
    await wrapper.find('.component-item').trigger('dragstart', { dataTransfer: dt });
    expect(dt.setData).toHaveBeenCalled();
  });

  test('dragend 事件清理 timeout', async () => {
    const wrapper = mount(ComponentListPanel);
    await wrapper.find('.component-item').trigger('dragend');
  });

  test('drag 事件 不同坐标时不会触发 delayedMarkContainer', async () => {
    const stage = { renderer: { getDocument: () => null }, delayedMarkContainer: vi.fn() };
    editorService.get.mockReturnValue(stage);
    const wrapper = mount(ComponentListPanel);
    await wrapper.find('.component-item').trigger('drag', { clientX: 1, clientY: 1 });
    expect(stage.delayedMarkContainer).not.toHaveBeenCalled();
  });

  test('drag 事件 相同坐标时触发 delayedMarkContainer', async () => {
    const stage = { renderer: { getDocument: () => null }, delayedMarkContainer: vi.fn(() => 1) };
    editorService.get.mockReturnValue(stage);
    const wrapper = mount(ComponentListPanel);
    const item = wrapper.find('.component-item');
    await item.trigger('drag', { clientX: 0, clientY: 0 });
    await item.trigger('drag', { clientX: 0, clientY: 0 });
    expect(stage.delayedMarkContainer).toHaveBeenCalled();
  });
});
