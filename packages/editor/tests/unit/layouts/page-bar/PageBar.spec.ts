/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';

import PageBar from '@editor/layouts/page-bar/PageBar.vue';

const editorState = {
  page: ref<any>({ id: 'p1' }),
  root: ref<any>({
    items: [
      { id: 'p1', type: 'page', name: 'P1' },
      { id: 'p2', type: 'page', name: 'P2' },
    ],
  }),
};
const editorService = {
  get: vi.fn((k: string) => (editorState as any)[k]?.value ?? null),
  select: vi.fn(),
  copy: vi.fn(),
  paste: vi.fn(),
  remove: vi.fn(),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ editorService }),
}));

const containerRef = {
  itemsContainerWidth: ref(800),
  scroll: vi.fn(),
  scrollTo: vi.fn(),
  getTranslateLeft: vi.fn(() => 0),
};

vi.mock('@editor/layouts/page-bar/PageBarScrollContainer.vue', () => ({
  default: defineComponent({
    name: 'FakePageBarScrollContainer',
    props: ['pageBarSortOptions', 'length'],
    setup(_p, { slots, expose }) {
      expose({
        get itemsContainerWidth() {
          return containerRef.itemsContainerWidth.value;
        },
        scroll: containerRef.scroll,
        scrollTo: containerRef.scrollTo,
        getTranslateLeft: containerRef.getTranslateLeft,
      });
      return () => h('div', { class: 'fake-scroll-container' }, [slots.prepend?.(), slots.default?.()]);
    },
  }),
}));

vi.mock('@editor/layouts/page-bar/AddButton.vue', () => ({
  default: defineComponent({
    name: 'FakeAddButton',
    setup() {
      return () => h('div', { class: 'fake-add-btn' });
    },
  }),
}));

vi.mock('@editor/layouts/page-bar/PageList.vue', () => ({
  default: defineComponent({
    name: 'FakePageList',
    props: ['list'],
    setup() {
      return () => h('div', { class: 'fake-page-list' });
    },
  }),
}));

vi.mock('@editor/layouts/page-bar/Search.vue', () => ({
  default: defineComponent({
    name: 'FakeSearch',
    props: ['query'],
    emits: ['update:query'],
    setup(_p, { emit }) {
      return () =>
        h('div', {
          class: 'fake-search',
          onClick: () => emit('update:query', { pageType: ['page'], keyword: 'p1' }),
        });
    },
  }),
}));

vi.mock('@editor/components/ToolButton.vue', () => ({
  default: defineComponent({
    name: 'FakeToolBtn',
    props: ['data'],
    setup(props) {
      return () =>
        h(
          'button',
          {
            class: ['tool-btn', (props.data as any).text === '复制' ? 'copy' : 'remove'].filter(Boolean).join(' '),
            onClick: () => (props.data as any).handler?.(),
          },
          (props.data as any).text,
        );
    },
  }),
}));

vi.mock('@tmagic/design', () => ({
  TMagicIcon: defineComponent({
    name: 'FakeIcon',
    setup(_p, { slots }) {
      return () => h('i', { class: 'fake-icon' }, slots.default?.());
    },
  }),
  TMagicPopover: defineComponent({
    name: 'FakePopover',
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-popover' }, [slots.reference?.(), slots.default?.()]);
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  containerRef.itemsContainerWidth.value = 800;
  containerRef.getTranslateLeft.mockReturnValue(0);
  editorState.page.value = { id: 'p1' };
  editorState.root.value = {
    items: [
      { id: 'p1', type: 'page', name: 'P1' },
      { id: 'p2', type: 'page', name: 'P2' },
    ],
  };
});

const factory = (props: any = {}) =>
  mount(PageBar, {
    attachTo: document.body,
    props: {
      disabledPageFragment: false,
      ...props,
    } as any,
  });

describe('PageBar.vue', () => {
  test('渲染页面列表', () => {
    const wrapper = factory();
    const items = wrapper.findAll('.m-editor-page-bar-item').filter((w) => w.attributes('data-page-id'));
    expect(items.length).toBe(2);
    expect(items[0].classes()).toContain('active');
  });

  test('点击 item 调用 select', async () => {
    const wrapper = factory();
    const items = wrapper.findAll('.m-editor-page-bar-item').filter((w) => w.attributes('data-page-id'));
    await items[1].trigger('click');
    expect(editorService.select).toHaveBeenCalledWith('p2');
  });

  test('复制按钮调用 copy/paste', async () => {
    const wrapper = factory();
    const copyBtn = wrapper.findAll('.copy')[0];
    await copyBtn.trigger('click');
    expect(editorService.copy).toHaveBeenCalled();
    expect(editorService.paste).toHaveBeenCalledWith({ left: 0, top: 0 });
  });

  test('删除按钮调用 remove', async () => {
    const wrapper = factory();
    const removeBtn = wrapper.findAll('.remove')[0];
    await removeBtn.trigger('click');
    expect(editorService.remove).toHaveBeenCalled();
  });

  test('search 改变 query 影响 list', async () => {
    const wrapper = factory();
    await wrapper.find('.fake-search').trigger('click');
    await nextTick();
    const items = wrapper.findAll('.m-editor-page-bar-item').filter((w) => w.attributes('data-page-id'));
    expect(items.length).toBe(1);
    expect(items[0].attributes('data-page-id')).toBe('p1');
  });

  test('过滤函数自定义', async () => {
    const filter = vi.fn(() => false);
    const wrapper = factory({ filterFunction: filter });
    await wrapper.find('.fake-search').trigger('click');
    await nextTick();
    const items = wrapper.findAll('.m-editor-page-bar-item').filter((w) => w.attributes('data-page-id'));
    expect(items.length).toBe(0);
    expect(filter).toHaveBeenCalled();
  });

  test('page 改变滚动到 end (最后一项)', async () => {
    const wrapper = factory();
    await nextTick();
    editorState.page.value = { id: 'p2' };
    await nextTick();
    expect(containerRef.scroll).toHaveBeenCalledWith('end');
    void wrapper;
  });

  test('page 改变滚动到 start (第一项)', async () => {
    editorState.page.value = { id: 'p2' };
    const wrapper = factory();
    await nextTick();
    editorState.page.value = { id: 'p1' };
    await nextTick();
    expect(containerRef.scroll).toHaveBeenCalledWith('start');
    void wrapper;
  });

  test('page 改变滚动到中间项', async () => {
    editorState.root.value = {
      items: [
        { id: 'p1', type: 'page' },
        { id: 'p2', type: 'page' },
        { id: 'p3', type: 'page' },
      ],
    };
    editorState.page.value = { id: 'p1' };
    const wrapper = factory();
    await nextTick();
    const items = wrapper.findAll('.m-editor-page-bar-item').filter((w) => w.attributes('data-page-id'));
    Object.defineProperty(items[0].element, 'getBoundingClientRect', {
      value: () => ({ left: 0, width: 100 }),
      configurable: true,
    });
    Object.defineProperty(items[1].element, 'getBoundingClientRect', {
      value: () => ({ left: 1000, width: 100 }),
      configurable: true,
    });
    Object.defineProperty(items[2].element, 'getBoundingClientRect', {
      value: () => ({ left: 2000, width: 100 }),
      configurable: true,
    });
    editorState.page.value = { id: 'p2' };
    await nextTick();
    expect(containerRef.scrollTo).toHaveBeenCalled();
  });

  test('page 不存在时 watch 直接 return', async () => {
    const wrapper = factory();
    await nextTick();
    containerRef.scroll.mockClear();
    containerRef.scrollTo.mockClear();
    editorState.page.value = null;
    await nextTick();
    expect(containerRef.scroll).not.toHaveBeenCalled();
    expect(containerRef.scrollTo).not.toHaveBeenCalled();
    void wrapper;
  });

  test('itemsContainerWidth 为 0 时 watch 直接 return', async () => {
    containerRef.itemsContainerWidth.value = 0;
    const wrapper = factory();
    await nextTick();
    containerRef.scroll.mockClear();
    containerRef.scrollTo.mockClear();
    editorState.page.value = { id: 'p2' };
    await nextTick();
    expect(containerRef.scroll).not.toHaveBeenCalled();
    expect(containerRef.scrollTo).not.toHaveBeenCalled();
    void wrapper;
  });
});
