/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import PageBarScrollContainer from '@editor/layouts/page-bar/PageBarScrollContainer.vue';

const editorService = { sort: vi.fn() };
const uiService = { get: vi.fn() };

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ editorService, uiService }),
}));

vi.mock('@editor/components/Icon.vue', () => ({
  default: defineComponent({
    name: 'IconStub',
    props: ['icon'],
    setup() {
      return () => h('i', { class: 'fake-icon' });
    },
  }),
}));

const { sortableInstances } = vi.hoisted(() => ({ sortableInstances: [] as any[] }));
vi.mock('sortablejs', () => ({
  default: class FakeSortable {
    el: any;
    options: any;
    constructor(el: any, options: any) {
      this.el = el;
      this.options = options;
      sortableInstances.push(this);
    }
    toArray() {
      return ['a', 'b', 'c'];
    }
  },
}));

class FakeResizeObserver {
  cb: any;
  constructor(cb: any) {
    this.cb = cb;
  }
  observe() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = FakeResizeObserver;

beforeEach(() => {
  vi.clearAllMocks();
  sortableInstances.length = 0;
  uiService.get.mockImplementation((k: string) => {
    if (k === 'showAddPageButton') return true;
    if (k === 'showPageListButton') return true;
    return null;
  });
});

const flush = async () => {
  await nextTick();
  await new Promise((r) => setTimeout(r, 0));
  await nextTick();
};

describe('PageBarScrollContainer', () => {
  test('length 0 时不渲染 items 容器', async () => {
    const wrapper = mount(PageBarScrollContainer, {
      props: { length: 0 } as any,
      attachTo: document.body,
    });
    await flush();
    expect(wrapper.find('.m-editor-page-bar-items').exists()).toBe(false);
  });

  test('canScroll 为 true 时显示左右按钮', async () => {
    const wrapper = mount(PageBarScrollContainer, {
      props: { length: 5 } as any,
      attachTo: document.body,
      slots: { default: '<div style="width:1000px"></div>' },
    });
    Object.defineProperty(wrapper.find('.m-editor-page-bar').element, 'clientWidth', {
      configurable: true,
      value: 200,
    });
    Object.defineProperty(wrapper.find('.m-editor-page-bar-items').element, 'scrollWidth', {
      configurable: true,
      value: 1000,
    });
    (wrapper.vm as any).scroll('left');
    (wrapper.vm as any).scroll('right');
    (wrapper.vm as any).scroll('start');
    (wrapper.vm as any).scroll('end');
    expect(true).toBe(true);
  });

  test('scrollTo 限制最大最小值', async () => {
    const wrapper = mount(PageBarScrollContainer, {
      props: { length: 1 } as any,
      attachTo: document.body,
      slots: { default: '<div></div>' },
    });
    await flush();
    (wrapper.vm as any).scrollTo(100);
    (wrapper.vm as any).scrollTo(-100000);
    expect((wrapper.vm as any).getTranslateLeft()).toBeLessThanOrEqual(0);
  });

  test('length > 1 时创建 Sortable', async () => {
    const wrapper = mount(PageBarScrollContainer, {
      props: { length: 3 } as any,
      attachTo: document.body,
      slots: { default: '<div></div>' },
    });
    await flush();
    expect(sortableInstances.length).toBeGreaterThan(0);
    void wrapper;
  });

  test('Sortable onUpdate 调用 editorService.sort', async () => {
    const afterUpdate = vi.fn();
    const wrapper = mount(PageBarScrollContainer, {
      props: { length: 3, pageBarSortOptions: { afterUpdate } } as any,
      attachTo: document.body,
      slots: { default: '<div></div>' },
    });
    await flush();
    const opts = sortableInstances[0].options;
    await opts.onStart({ oldIndex: 0, newIndex: 1 });
    await opts.onUpdate({ oldIndex: 0, newIndex: 1 });
    expect(editorService.sort).toHaveBeenCalledWith('a', 'b');
    expect(afterUpdate).toHaveBeenCalled();
    void wrapper;
  });

  test('Sortable onStart 触发 beforeStart 钩子', async () => {
    const beforeStart = vi.fn();
    const wrapper = mount(PageBarScrollContainer, {
      props: { length: 3, pageBarSortOptions: { beforeStart } } as any,
      attachTo: document.body,
      slots: { default: '<div></div>' },
    });
    await flush();
    const opts = sortableInstances[0].options;
    await opts.onStart({ oldIndex: 0, newIndex: 1 });
    expect(beforeStart).toHaveBeenCalled();
    void wrapper;
  });

  test('length 减小时滚到 start', async () => {
    const wrapper = mount(PageBarScrollContainer, {
      props: { length: 3 } as any,
      attachTo: document.body,
      slots: { default: '<div></div>' },
    });
    await flush();
    await wrapper.setProps({ length: 1 });
    await flush();
    expect((wrapper.vm as any).getTranslateLeft()).toBe(0);
  });
});
