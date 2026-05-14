/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';

import NodeListMenu from '@editor/layouts/workspace/viewer/NodeListMenu.vue';

const stageState: {
  handlers: Record<string, Function[]>;
  renderer: any;
  select: ReturnType<typeof vi.fn>;
  on(name: string, cb: Function): void;
  emit(name: string, ...args: any[]): void;
} = {
  handlers: {},
  renderer: { getElementsFromPoint: vi.fn(() => []) },
  select: vi.fn(),
  on(name: string, cb: Function) {
    (this.handlers[name] = this.handlers[name] || []).push(cb);
  },
  emit(name: string, ...args: any[]) {
    (this.handlers[name] || []).forEach((cb) => cb(...args));
  },
};

const editorState = {
  stage: ref<any>(stageState),
  page: ref<any>({ id: 'p1', items: [] }),
  nodes: ref<any[]>([]),
};

const editorService = {
  get: vi.fn((k: string) => (editorState as any)[k]?.value),
  select: vi.fn(),
};

const nodeStatusMap = ref(new Map<string, any>([['p1', { selected: false }]]));

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ editorService }),
}));

vi.mock('@editor/layouts/sidebar/layer/use-node-status', () => ({
  useNodeStatus: () => ({ nodeStatusMap }),
}));

const filterTextChangeHandler = vi.fn();
vi.mock('@editor/hooks/use-filter', () => ({
  useFilter: () => ({ filterTextChangeHandler }),
}));

vi.mock('@tmagic/utils', () => ({
  getIdFromEl: () => (el: any) => el?.id,
}));

vi.mock('@tmagic/design', () => ({
  TMagicTooltip: defineComponent({
    name: 'FakeTooltip',
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-tooltip' }, slots.default?.());
    },
  }),
}));

vi.mock('@editor/components/FloatingBox.vue', () => ({
  default: defineComponent({
    name: 'FakeFloatingBox',
    props: ['visible', 'title', 'position'],
    emits: ['update:visible'],
    setup(_p, { slots, expose }) {
      expose({ target: { clientHeight: 100 } });
      return () => h('div', { class: 'fake-float-box' }, slots.body?.());
    },
  }),
}));

vi.mock('@editor/components/Tree.vue', () => ({
  default: defineComponent({
    name: 'FakeTree',
    props: ['data', 'nodeStatusMap'],
    emits: ['node-click'],
    setup(_p, { emit }) {
      return () =>
        h('div', {
          class: 'fake-tree',
          onClick: () => emit('node-click', new MouseEvent('click'), { id: 'p1' }),
        });
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  stageState.handlers = {};
  editorState.stage.value = stageState;
  editorState.page.value = { id: 'p1', items: [] };
  editorState.nodes.value = [];
  nodeStatusMap.value = new Map<string, any>([['p1', { selected: false }]]);
});

describe('NodeListMenu.vue', () => {
  test('初始 buttonVisible 为 false 不显示按钮', () => {
    const wrapper = mount(NodeListMenu);
    expect(wrapper.find('.m-editor-stage-float-button').exists()).toBe(false);
  });

  test('stage select 触发后 ids 数大于 3 显示按钮', async () => {
    const wrapper = mount(NodeListMenu);
    await nextTick();
    stageState.renderer.getElementsFromPoint.mockReturnValue([{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]);
    stageState.emit('select', null, new MouseEvent('click'));
    await nextTick();
    expect(wrapper.find('.m-editor-stage-float-button').exists()).toBe(true);
    expect(filterTextChangeHandler).toHaveBeenCalledWith(['a', 'b', 'c', 'd']);
  });

  test('点击按钮显示 FloatingBox 并计算位置', async () => {
    const wrapper = mount(NodeListMenu, { attachTo: document.body });
    await nextTick();
    stageState.renderer.getElementsFromPoint.mockReturnValue([{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]);
    stageState.emit('select', null, new MouseEvent('click'));
    await nextTick();
    const btn = wrapper.find('.m-editor-stage-float-button');
    Object.defineProperty(btn.element, 'getBoundingClientRect', {
      value: () => ({ left: 10, top: 20, width: 50, height: 30 }),
      configurable: true,
    });
    await btn.trigger('click');
    await nextTick();
    await nextTick();
    expect(wrapper.find('.fake-float-box').exists()).toBe(true);
  });

  test('Tree node-click 调用 select', async () => {
    const wrapper = mount(NodeListMenu);
    await nextTick();
    stageState.renderer.getElementsFromPoint.mockReturnValue([{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]);
    stageState.emit('select', null, new MouseEvent('click'));
    await nextTick();
    await wrapper.find('.m-editor-stage-float-button').trigger('click');
    await nextTick();
    await wrapper.find('.fake-tree').trigger('click');
    await nextTick();
    expect(editorService.select).toHaveBeenCalledWith('p1');
    expect(stageState.select).toHaveBeenCalledWith('p1');
  });

  test('nodes 改变时同步 selected 状态', async () => {
    mount(NodeListMenu);
    await nextTick();
    editorState.nodes.value = [{ id: 'p1' }];
    await nextTick();
    expect(nodeStatusMap.value.get('p1').selected).toBe(true);
  });

  test('page 为 null 时 buttonVisible 不渲染', async () => {
    editorState.page.value = null;
    const wrapper = mount(NodeListMenu);
    expect(wrapper.find('.m-editor-stage-float-button').exists()).toBe(false);
    expect(wrapper.find('.fake-float-box').exists()).toBe(false);
  });
});
