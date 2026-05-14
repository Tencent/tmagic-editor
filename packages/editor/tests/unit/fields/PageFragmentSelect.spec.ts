/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import PageFragmentSelect from '@editor/fields/PageFragmentSelect.vue';

const editorService = {
  get: vi.fn(),
  select: vi.fn(),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ editorService }),
}));

vi.mock('@tmagic/form', () => ({
  MSelect: defineComponent({
    name: 'MSelect',
    props: ['config', 'model', 'name', 'size', 'prop', 'disabled'],
    emits: ['change'],
    setup(_p, { emit }) {
      return () =>
        h('select', {
          class: 'fake-select',
          onChange: (e: Event) => emit('change', (e.target as HTMLSelectElement).value),
        });
    },
  }),
}));

vi.mock('@editor/components/Icon.vue', () => ({
  default: defineComponent({
    name: 'MEditorIcon',
    props: ['icon'],
    emits: ['click'],
    setup(_p, { emit }) {
      return () => h('i', { class: 'fake-icon', onClick: () => emit('click') });
    },
  }),
}));

vi.mock('@tmagic/core', async () => {
  const actual = await vi.importActual<any>('@tmagic/core');
  return { ...actual, NodeType: { PAGE: 'page', PAGE_FRAGMENT: 'page-fragment' } };
});

describe('PageFragmentSelect', () => {
  test('model[name] 不为空时显示编辑图标', () => {
    editorService.get.mockReturnValue({ items: [{ id: 'p1', type: 'page-fragment', name: 'A' }] });
    const wrapper = mount(PageFragmentSelect, {
      props: {
        config: { type: 'page-fragment-select' },
        name: 'pf',
        model: { pf: 'p1' },
        size: 'default',
      } as any,
    });
    expect(wrapper.find('.fake-icon').exists()).toBe(true);
  });

  test('model[name] 为空不显示编辑图标', () => {
    editorService.get.mockReturnValue({ items: [] });
    const wrapper = mount(PageFragmentSelect, {
      props: {
        config: { type: 'page-fragment-select' },
        name: 'pf',
        model: { pf: '' },
        size: 'default',
      } as any,
    });
    expect(wrapper.find('.fake-icon').exists()).toBe(false);
  });

  test('change emit', async () => {
    editorService.get.mockReturnValue({ items: [] });
    const wrapper = mount(PageFragmentSelect, {
      props: {
        config: { type: 'page-fragment-select' },
        name: 'pf',
        model: { pf: '' },
        size: 'default',
      } as any,
    });
    await wrapper.findComponent({ name: 'MSelect' }).vm.$emit('change', 'p2');
    expect(wrapper.emitted('change')?.[0]?.[0]).toBe('p2');
  });

  test('点击编辑图标调用 editorService.select', async () => {
    editorService.get.mockReturnValue({ items: [{ id: 'p1', type: 'page-fragment', name: 'A' }] });
    editorService.select.mockClear();
    const wrapper = mount(PageFragmentSelect, {
      props: {
        config: { type: 'page-fragment-select' },
        name: 'pf',
        model: { pf: 'p1' },
        size: 'default',
      } as any,
    });
    await wrapper.find('.fake-icon').trigger('click');
    expect(editorService.select).toHaveBeenCalledWith('p1');
  });

  test('selectConfig.options 返回 pageList', () => {
    const items = [
      { id: 'p1', type: 'page-fragment', name: 'A', title: 'TitleA' },
      { id: 'p2', type: 'page-fragment', name: 'B', devconfig: { tabName: 'TabB' } },
      { id: 'p3', type: 'page', name: 'normal' },
    ];
    editorService.get.mockReturnValue({ items });
    const wrapper = mount(PageFragmentSelect, {
      props: {
        config: { type: 'page-fragment-select' },
        name: 'pf',
        model: { pf: '' },
        size: 'default',
      } as any,
    });
    const select = wrapper.findComponent({ name: 'MSelect' });
    const options = (select.props('config') as any).options();
    expect(options.length).toBe(2);
    expect(options[0].value).toBe('p1');
    expect(options[1].text).toContain('TabB');
  });

  test('root 为空 options 返回空数组', () => {
    editorService.get.mockReturnValue(undefined);
    const wrapper = mount(PageFragmentSelect, {
      props: {
        config: { type: 'page-fragment-select' },
        name: 'pf',
        model: { pf: '' },
        size: 'default',
      } as any,
    });
    const select = wrapper.findComponent({ name: 'MSelect' });
    expect((select.props('config') as any).options()).toEqual([]);
  });
});
