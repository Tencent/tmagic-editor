/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import Breadcrumb from '@editor/layouts/workspace/Breadcrumb.vue';

const editorService = {
  get: vi.fn(),
  select: vi.fn().mockResolvedValue(undefined),
};

const stage = {
  select: vi.fn(),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ editorService }),
}));

vi.mock('@tmagic/utils', () => ({
  getNodePath: (id: string, _items: any[]) => {
    if (id === 'n1') return [{ id: 'r', name: 'root' }];
    if (id === 'long')
      return [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
        { id: 'c', name: 'C' },
        { id: 'd', name: 'D' },
        { id: 'e', name: 'E' },
      ];
    return [];
  },
}));

vi.mock('@tmagic/design', () => ({
  TMagicTooltip: defineComponent({
    name: 'FakeTooltip',
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-tooltip' }, slots.default?.());
    },
  }),
  TMagicButton: defineComponent({
    name: 'FakeButton',
    inheritAttrs: false,
    props: ['disabled'],
    emits: ['click'],
    setup(props, { slots, emit, attrs }) {
      return () =>
        h(
          'button',
          {
            ...attrs,
            class: ['fake-btn', (attrs as any).class].filter(Boolean).join(' '),
            disabled: props.disabled,
            onClick: () => emit('click'),
          },
          slots.default?.(),
        );
    },
  }),
}));

class FakeResizeObserver {
  public static instances: FakeResizeObserver[] = [];
  public cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
    FakeResizeObserver.instances.push(this);
  }
  public observe() {}
  public disconnect() {}
}
(globalThis as any).ResizeObserver = FakeResizeObserver;

beforeEach(() => {
  vi.clearAllMocks();
  FakeResizeObserver.instances = [];
  editorService.get.mockImplementation((k: string) => {
    if (k === 'node') return { id: 'n1' };
    if (k === 'nodes') return [{ id: 'n1' }];
    if (k === 'root') return { items: [] };
    if (k === 'stage') return stage;
    return null;
  });
});

describe('Breadcrumb.vue', () => {
  test('单选时渲染面包屑', async () => {
    const wrapper = mount(Breadcrumb, { attachTo: document.body });
    await nextTick();
    expect(wrapper.find('.m-editor-breadcrumb').exists()).toBe(true);
    expect(wrapper.text()).toContain('root');
  });

  test('多选时不渲染', async () => {
    editorService.get.mockImplementation((k: string) => {
      if (k === 'nodes') return [{ id: 'a' }, { id: 'b' }];
      return null;
    });
    const wrapper = mount(Breadcrumb);
    expect(wrapper.find('.m-editor-breadcrumb').exists()).toBe(false);
  });

  test('点击 item 调用 select', async () => {
    const wrapper = mount(Breadcrumb, { attachTo: document.body });
    await nextTick();
    const btn = wrapper.find('button');
    await btn.trigger('click');
    expect(editorService.select).toHaveBeenCalled();
    expect(stage.select).toHaveBeenCalled();
  });

  test('折叠路径 (>3 时折叠)', async () => {
    editorService.get.mockImplementation((k: string) => {
      if (k === 'node') return { id: 'long' };
      if (k === 'nodes') return [{ id: 'long' }];
      if (k === 'root') return { items: [] };
      return null;
    });
    const wrapper = mount(Breadcrumb, { attachTo: document.body });
    await nextTick();
    const container = wrapper.find('.m-editor-breadcrumb').element as HTMLElement;
    const parent = container.parentElement;
    if (parent) {
      Object.defineProperty(parent, 'clientWidth', { configurable: true, value: 50 });
    }
    Object.defineProperty(container, 'scrollWidth', { configurable: true, value: 500 });
    FakeResizeObserver.instances.forEach((i) => i.cb([] as any, {} as any));
    await nextTick();
    await nextTick();
    expect(wrapper.text()).toContain('...');
  });
});
