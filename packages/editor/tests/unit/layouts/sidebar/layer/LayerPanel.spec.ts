/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import LayerPanel from '@editor/layouts/sidebar/layer/LayerPanel.vue';

const editorService = { get: vi.fn() };
vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ editorService }),
}));

const nodeStatusMap: Map<any, any> = new Map([
  ['p1', { expand: true }],
  ['n1', { expand: true }],
]);
vi.mock('@editor/layouts/sidebar/layer/use-node-status', () => ({
  useNodeStatus: () => ({ nodeStatusMap: { value: nodeStatusMap } }),
}));

vi.mock('@editor/layouts/sidebar/layer/use-keybinding', () => ({
  useKeybinding: () => ({ isCtrlKeyDown: { value: false } }),
}));

vi.mock('@editor/layouts/sidebar/layer/use-drag', () => ({
  useDrag: () => ({
    handleDragStart: vi.fn(),
    handleDragEnd: vi.fn(),
    handleDragLeave: vi.fn(),
    handleDragOver: vi.fn(),
  }),
}));

const nodeDblclickHandler = vi.fn();
vi.mock('@editor/layouts/sidebar/layer/use-click', () => ({
  useClick: () => ({
    nodeClickHandler: vi.fn(),
    nodeDblclickHandler,
    nodeContentMenuHandler: vi.fn(),
    highlightHandler: vi.fn(),
  }),
}));

vi.mock('@editor/hooks/use-filter', () => ({
  useFilter: () => ({ filterTextChangeHandler: vi.fn() }),
}));

vi.mock('@editor/components/SearchInput.vue', () => ({
  default: defineComponent({
    name: 'SearchInput',
    emits: ['search'],
    setup() {
      return () => h('input', { class: 'fake-search' });
    },
  }),
}));

vi.mock('@editor/components/Tree.vue', () => ({
  default: defineComponent({
    name: 'TreeStub',
    props: ['data', 'nodeStatusMap', 'indent', 'nextLevelIndentIncrement', 'isExpandable'],
    emits: [
      'node-dragover',
      'node-dragstart',
      'node-dragleave',
      'node-dragend',
      'node-contextmenu',
      'node-mouseenter',
      'node-click',
      'node-dblclick',
    ],
    setup(_p, { emit, slots }) {
      return () =>
        h('div', { class: 'fake-tree' }, [
          h('button', {
            class: 'dblclick-btn',
            onClick: () => emit('node-dblclick', new MouseEvent('dblclick'), { id: 'a' }),
          }),
          slots['tree-node-label']?.({ data: { id: 'a', name: 'A', type: 'node' } }),
          slots['tree-node-tool']?.({ data: { id: 'a', type: 'node' } }),
        ]);
    },
  }),
}));

vi.mock('@editor/layouts/sidebar/layer/LayerNodeContent.vue', () => ({
  default: defineComponent({
    name: 'LayerNodeContent',
    props: ['data'],
    setup() {
      return () => h('div', { class: 'fake-node-content' });
    },
  }),
}));

vi.mock('@editor/layouts/sidebar/layer/LayerMenu.vue', () => ({
  default: defineComponent({
    name: 'LayerMenu',
    props: ['layerContentMenu', 'customContentMenu'],
    emits: ['collapse-all'],
    setup(_p, { expose, emit }) {
      expose({ show: vi.fn() });
      return () => h('button', { class: 'collapse-all-btn', onClick: () => emit('collapse-all') });
    },
  }),
}));

vi.mock('@editor/layouts/sidebar/layer/LayerNodeTool.vue', () => ({
  default: defineComponent({
    name: 'LayerNodeTool',
    props: ['data'],
    setup() {
      return () => h('div', { class: 'fake-node-tool' });
    },
  }),
}));

vi.mock('@tmagic/design', () => ({
  TMagicScrollbar: defineComponent({
    name: 'TMagicScrollbar',
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-scrollbar' }, slots.default?.());
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  editorService.get.mockReturnValue({ id: 'p1', items: [{ id: 'n1' }] });
  nodeStatusMap.clear();
  nodeStatusMap.set('p1', { expand: true });
  nodeStatusMap.set('n1', { expand: true });
});

describe('LayerPanel', () => {
  test('渲染 Tree 与 LayerMenu', () => {
    const wrapper = mount(LayerPanel, {
      props: { layerContentMenu: [], customContentMenu: (m: any) => m } as any,
    });
    expect(wrapper.findComponent({ name: 'TreeStub' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'LayerMenu' }).exists()).toBe(true);
  });

  test('tree-node-label 默认渲染 LayerNodeContent', () => {
    const wrapper = mount(LayerPanel, {
      props: { layerContentMenu: [], customContentMenu: (m: any) => m } as any,
    });
    expect(wrapper.find('.fake-node-content').exists()).toBe(true);
  });

  test('page 为空时不渲染 Tree', () => {
    editorService.get.mockReturnValue(null);
    const wrapper = mount(LayerPanel, {
      props: { layerContentMenu: [], customContentMenu: (m: any) => m } as any,
    });
    expect(wrapper.findComponent({ name: 'TreeStub' }).exists()).toBe(false);
  });

  test('双击 emit node-dblclick', async () => {
    const wrapper = mount(LayerPanel, {
      props: { layerContentMenu: [], customContentMenu: (m: any) => m } as any,
    });
    await wrapper.find('.dblclick-btn').trigger('click');
    expect(nodeDblclickHandler).toHaveBeenCalled();
    expect(wrapper.emitted('node-dblclick')).toBeTruthy();
  });

  test('beforeNodeDblclick 返回 false 时阻止', async () => {
    const wrapper = mount(LayerPanel, {
      props: {
        layerContentMenu: [],
        customContentMenu: (m: any) => m,
        beforeNodeDblclick: async () => false,
      } as any,
    });
    await wrapper.find('.dblclick-btn').trigger('click');
    await new Promise((r) => setTimeout(r, 0));
    expect(nodeDblclickHandler).not.toHaveBeenCalled();
    expect(wrapper.emitted('node-dblclick')).toBeFalsy();
  });

  test('collapse-all 折叠所有节点 (除 page)', async () => {
    mount(LayerPanel, {
      attachTo: document.body,
      props: { layerContentMenu: [], customContentMenu: (m: any) => m } as any,
    });
    const btn = document.body.querySelector('.collapse-all-btn') as HTMLElement;
    btn.click();
    expect(nodeStatusMap.get('p1').expand).toBe(true);
    expect(nodeStatusMap.get('n1').expand).toBe(false);
  });
});
