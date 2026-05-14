/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import DataSourceList from '@editor/layouts/sidebar/data-source/DataSourceList.vue';

const editorService = {
  get: vi.fn(),
  select: vi.fn(),
};
const dataSourceService = {
  get: vi.fn(),
};
const depService = {
  getTargets: vi.fn(() => ({})),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ editorService, dataSourceService, depService }),
}));

vi.mock('@editor/hooks/use-node-status', () => ({
  useNodeStatus: () => ({ nodeStatusMap: { value: new Map() } }),
}));

vi.mock('@editor/hooks/use-filter', () => ({
  useFilter: () => ({ filterTextChangeHandler: vi.fn() }),
}));

vi.mock('@tmagic/core', async () => {
  const actual = await vi.importActual<any>('@tmagic/core');
  return {
    ...actual,
    DepTargetType: {
      DATA_SOURCE: 'data-source',
      DATA_SOURCE_METHOD: 'data-source-method',
      DATA_SOURCE_COND: 'data-source-cond',
    },
  };
});

vi.mock('@editor/components/Tree.vue', () => ({
  default: defineComponent({
    name: 'TreeStub',
    props: ['data', 'nodeStatusMap', 'indent', 'nextLevelIndentIncrement'],
    emits: ['node-click', 'node-contextmenu'],
    setup(_p, { emit, slots }) {
      return () =>
        h('div', { class: 'fake-tree' }, [
          h('button', {
            class: 'click-btn',
            onClick: () => emit('node-click', new MouseEvent('click'), { type: 'node', key: 'cmp1' }),
          }),
          h('button', {
            class: 'menu-btn',
            onClick: () => emit('node-contextmenu', new MouseEvent('contextmenu'), { type: 'ds', id: 'd1' }),
          }),
          slots['tree-node-label']?.({ data: { type: 'ds', name: 'D1' } }),
          slots['tree-node-tool']?.({ data: { type: 'ds', name: 'D1', key: 'd1' } }),
        ]);
    },
  }),
}));

vi.mock('@editor/components/Icon.vue', () => ({
  default: defineComponent({
    name: 'EditorIcon',
    props: ['icon'],
    emits: ['click'],
    setup(_p, { emit }) {
      return () => h('i', { class: 'edit-icon', onClick: (e: Event) => emit('click', e) });
    },
  }),
}));

vi.mock('@tmagic/design', () => ({
  TMagicTooltip: defineComponent({
    name: 'TMagicTooltip',
    props: ['content', 'placement', 'effect'],
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-tooltip' }, slots.default?.());
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  dataSourceService.get.mockImplementation((k: string) => {
    if (k === 'editable') return true;
    if (k === 'dataSources') return [{ id: 'd1', title: 'D1', methods: [] }];
    return null;
  });
  editorService.get.mockImplementation((k: string) => {
    if (k === 'root') return { items: [{ id: 'p1', name: 'page1' }] };
    if (k === 'stage') return { select: vi.fn() };
    return null;
  });
});

describe('DataSourceList', () => {
  test('渲染 Tree 与节点工具', () => {
    const wrapper = mount(DataSourceList);
    expect(wrapper.findComponent({ name: 'TreeStub' }).exists()).toBe(true);
    expect(wrapper.findAll('.edit-icon').length).toBeGreaterThan(0);
  });

  test('点击 Tree 节点选中组件', async () => {
    const stageSelect = vi.fn();
    editorService.get.mockImplementation((k: string) => {
      if (k === 'root') return { items: [{ id: 'p1', name: 'page1' }] };
      if (k === 'stage') return { select: stageSelect };
      return null;
    });
    const wrapper = mount(DataSourceList);
    await wrapper.find('.click-btn').trigger('click');
    expect(editorService.select).toHaveBeenCalledWith('cmp1');
    expect(stageSelect).toHaveBeenCalledWith('cmp1');
  });

  test('右键 Tree 节点 emit node-contextmenu', async () => {
    const wrapper = mount(DataSourceList);
    await wrapper.find('.menu-btn').trigger('click');
    expect(wrapper.emitted('node-contextmenu')).toBeTruthy();
  });

  test('点击编辑图标 emit edit', async () => {
    const wrapper = mount(DataSourceList);
    const icons = wrapper.findAll('.edit-icon');
    await icons[0].trigger('click');
    expect(wrapper.emitted('edit')?.[0]?.[0]).toBe('d1');
  });

  test('点击删除图标 emit remove (editable=true)', async () => {
    const wrapper = mount(DataSourceList);
    const icons = wrapper.findAll('.edit-icon');
    await icons[1].trigger('click');
    expect(wrapper.emitted('remove')?.[0]?.[0]).toBe('d1');
  });

  test('editable=false 时不显示删除图标', () => {
    dataSourceService.get.mockImplementation((k: string) => {
      if (k === 'editable') return false;
      if (k === 'dataSources') return [{ id: 'd1', title: 'D1' }];
      return null;
    });
    const wrapper = mount(DataSourceList);
    expect(wrapper.findAll('.edit-icon').length).toBe(1);
  });

  test('list 计算: dataSources 为空时为空数组', () => {
    dataSourceService.get.mockImplementation((k: string) => {
      if (k === 'editable') return true;
      if (k === 'dataSources') return [];
      return null;
    });
    const wrapper = mount(DataSourceList);
    expect(wrapper.findComponent({ name: 'TreeStub' }).props('data').length).toBe(0);
  });
});
