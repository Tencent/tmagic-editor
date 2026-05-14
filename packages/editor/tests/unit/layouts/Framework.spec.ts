/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import Framework from '@editor/layouts/Framework.vue';

const editorService = {
  get: vi.fn(),
  set: vi.fn(),
};
const uiService = {
  get: vi.fn(),
  set: vi.fn(),
};
const storageService = {
  getItem: vi.fn(),
  setItem: vi.fn(),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ editorService, uiService, storageService }),
}));

vi.mock('@editor/utils/config', () => ({
  getEditorConfig: vi.fn(() => (s: string) => JSON.parse(s)),
}));

vi.mock('@editor/components/SplitView.vue', () => ({
  default: defineComponent({
    name: 'SplitView',
    props: ['left', 'right', 'minLeft', 'minRight', 'minCenter', 'width'],
    emits: ['change'],
    setup(_p, { slots, expose, emit }) {
      expose({ updateWidth: vi.fn() });
      return () =>
        h('div', { class: 'fake-split-view' }, [
          slots.left?.(),
          slots.center?.(),
          slots.right?.(),
          h('button', {
            class: 'change-btn',
            onClick: () => emit('change', { left: 100, right: 200, center: 600 }),
          }),
        ]);
    },
  }),
}));

vi.mock('@editor/layouts/CodeEditor.vue', () => ({
  default: defineComponent({
    name: 'CodeEditor',
    props: ['initValues', 'options'],
    emits: ['save'],
    setup(_p, { emit }) {
      return () => h('div', { class: 'fake-code-editor', onClick: () => emit('save', '{"id":"x"}') });
    },
  }),
}));

vi.mock('@editor/layouts/AddPageBox.vue', () => ({
  default: defineComponent({
    name: 'AddPageBox',
    props: ['disabledPageFragment'],
    setup() {
      return () => h('div', { class: 'fake-add-page-box' });
    },
  }),
}));

vi.mock('@editor/layouts/page-bar/PageBar.vue', () => ({
  default: defineComponent({
    name: 'PageBar',
    props: ['disabledPageFragment'],
    setup() {
      return () => h('div', { class: 'fake-page-bar' });
    },
  }),
}));

class FakeResizeObserver {
  cb: any;
  constructor(cb: any) {
    this.cb = cb;
  }
  observe(el: any) {
    this.cb([{ contentRect: { width: 1000, height: 800, left: 0, top: 0 } }], this);
    void el;
  }
  disconnect() {}
}
(globalThis as any).ResizeObserver = FakeResizeObserver;

beforeEach(() => {
  vi.clearAllMocks();
  uiService.get.mockImplementation((k: string) => {
    if (k === 'columnWidth') return { left: 200, center: 600, right: 200 };
    if (k === 'showSrc') return false;
    if (k === 'frameworkRect') return { width: 1000, height: 800 };
    if (k === 'hideSlideBar') return false;
    return null;
  });
  editorService.get.mockImplementation((k: string) => {
    if (k === 'root') return { items: [] };
    if (k === 'page') return { id: 'p1' };
    if (k === 'pageLength') return 1;
    return null;
  });
});

describe('Framework', () => {
  test('渲染 SplitView 与 PageBar', () => {
    const wrapper = mount(Framework, { props: { disabledPageFragment: false } as any });
    expect(wrapper.find('.fake-split-view').exists()).toBe(true);
    expect(wrapper.find('.fake-page-bar').exists()).toBe(true);
  });

  test('page 为空时显示 AddPageBox', () => {
    editorService.get.mockImplementation((k: string) => (k === 'page' ? null : { items: [] }));
    const wrapper = mount(Framework, { props: { disabledPageFragment: false } as any });
    expect(wrapper.find('.fake-add-page-box').exists()).toBe(true);
  });

  test('showSrc 时显示 CodeEditor', () => {
    uiService.get.mockImplementation((k: string) => {
      if (k === 'showSrc') return true;
      if (k === 'columnWidth') return { left: 0, center: 0, right: 0 };
      if (k === 'frameworkRect') return { width: 1000, height: 800 };
      return null;
    });
    const wrapper = mount(Framework, { props: { disabledPageFragment: false } as any });
    expect(wrapper.find('.fake-code-editor').exists()).toBe(true);
  });

  test('CodeEditor save 调用 editorService.set("root")', async () => {
    uiService.get.mockImplementation((k: string) => {
      if (k === 'showSrc') return true;
      if (k === 'columnWidth') return { left: 0, center: 0, right: 0 };
      if (k === 'frameworkRect') return { width: 1000, height: 800 };
      return null;
    });
    const wrapper = mount(Framework, { props: { disabledPageFragment: false } as any });
    await wrapper.find('.fake-code-editor').trigger('click');
    expect(editorService.set).toHaveBeenCalledWith('root', { id: 'x' });
  });

  test('SplitView change 写入 uiService 和 storage', async () => {
    const wrapper = mount(Framework, { props: { disabledPageFragment: false } as any });
    await wrapper.find('.change-btn').trigger('click');
    expect(uiService.set).toHaveBeenCalledWith('columnWidth', { left: 100, right: 200, center: 600 });
    expect(storageService.setItem).toHaveBeenCalled();
  });
});
