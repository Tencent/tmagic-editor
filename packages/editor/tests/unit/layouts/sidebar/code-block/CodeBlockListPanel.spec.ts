/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';

import CodeBlockListPanel from '@editor/layouts/sidebar/code-block/CodeBlockListPanel.vue';

const codeBlockService = {
  getEditStatus: vi.fn(() => true),
};

const editCode = vi.fn();
const deleteCode = vi.fn();
const createCodeBlock = vi.fn();
const submitCodeBlockHandler = vi.fn();
const codeId = ref<string>('');
const codeBlockEditor = ref<any>(null);
const codeConfig = ref<any>(null);

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ codeBlockService }),
}));

vi.mock('@editor/hooks/use-code-block-edit', () => ({
  useCodeBlockEdit: () => ({
    codeId,
    codeBlockEditor,
    codeConfig,
    editCode,
    deleteCode,
    createCodeBlock,
    submitCodeBlockHandler,
  }),
}));

const nodeContentMenuHandler = vi.fn();
const contentMenuHideHandler = vi.fn();
const menuDataState = { items: [{ type: 'button', text: 'a' }] as any[] };

vi.mock('@editor/layouts/sidebar/code-block/useContentMenu', () => ({
  useContentMenu: () => ({
    nodeContentMenuHandler,
    get menuData() {
      return menuDataState.items;
    },
    contentMenuHideHandler,
  }),
}));

const filterFn = vi.fn();
const codeBlockListNodeStatusMap = new Map<string, any>([
  ['c1', { selected: false }],
  ['c2', { selected: false }],
]);
const codeBlockListDeleteCode = vi.fn();

vi.mock('@editor/layouts/sidebar/code-block/CodeBlockList.vue', () => ({
  default: defineComponent({
    name: 'FakeCodeBlockList',
    props: ['customError', 'indent', 'nextLevelIndentIncrement'],
    emits: ['edit', 'remove', 'node-contextmenu'],
    setup(_p, { emit, expose, slots }) {
      expose({
        filter: filterFn,
        nodeStatusMap: codeBlockListNodeStatusMap,
        deleteCode: codeBlockListDeleteCode,
      });
      return () =>
        h('div', { class: 'fake-code-block-list' }, [
          h('button', { class: 'edit-btn', onClick: () => emit('edit', 'c1') }),
          h('button', { class: 'remove-btn', onClick: () => emit('remove', 'c1') }),
          h('button', { class: 'ctx-btn', onClick: (e: MouseEvent) => emit('node-contextmenu', e, { id: 'c1' }) }),
          slots['code-block-panel-tool']?.({ id: 'c1', data: {} }),
        ]);
    },
  }),
}));

vi.mock('@editor/components/CodeBlockEditor.vue', () => ({
  default: defineComponent({
    name: 'FakeCodeBlockEditor',
    props: ['disabled', 'content'],
    emits: ['submit', 'close'],
    setup(_p, { emit }) {
      return () =>
        h('div', {
          class: 'fake-code-block-editor',
          onClick: () => emit('submit'),
          onContextmenu: () => emit('close'),
        });
    },
  }),
}));

vi.mock('@editor/components/ContentMenu.vue', () => ({
  default: defineComponent({
    name: 'FakeContentMenu',
    props: ['menuData'],
    emits: ['hide'],
    setup(_p, { emit }) {
      return () =>
        h('div', {
          class: 'fake-content-menu',
          onClick: () => emit('hide'),
        });
    },
  }),
}));

vi.mock('@editor/components/SearchInput.vue', () => ({
  default: defineComponent({
    name: 'FakeSearchInput',
    emits: ['search'],
    setup(_p, { emit }) {
      return () =>
        h('input', {
          class: 'fake-search-input',
          onChange: (e: any) => emit('search', e.target.value),
        });
    },
  }),
}));

vi.mock('@tmagic/design', () => ({
  TMagicScrollbar: defineComponent({
    name: 'FakeScrollbar',
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-scrollbar' }, slots.default?.());
    },
  }),
  TMagicButton: defineComponent({
    name: 'FakeBtn',
    inheritAttrs: false,
    setup(_p, { slots, attrs }) {
      return () =>
        h(
          'button',
          { ...attrs, class: ['fake-btn', (attrs as any).class].filter(Boolean).join(' ') },
          slots.default?.(),
        );
    },
  }),
}));

const eventBus: {
  handlers: Record<string, Function[]>;
  on(name: string, cb: Function): void;
  emit(name: string, ...args: any[]): void;
} = {
  handlers: {},
  on(name: string, cb: Function) {
    (this.handlers[name] = this.handlers[name] || []).push(cb);
  },
  emit(name: string, ...args: any[]) {
    (this.handlers[name] || []).forEach((cb) => cb(...args));
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  codeBlockService.getEditStatus.mockReturnValue(true);
  codeId.value = '';
  codeConfig.value = null;
  menuDataState.items = [{ type: 'button', text: 'a' }];
  eventBus.handlers = {};
  codeBlockListNodeStatusMap.forEach((v) => (v.selected = false));
});

const factory = (custom?: any) =>
  mount(CodeBlockListPanel, {
    attachTo: document.body,
    props: {
      customContentMenu: ((m: any) => m) as any,
      ...custom,
    } as any,
    global: {
      provide: { eventBus },
    },
  });

describe('CodeBlockListPanel.vue', () => {
  test('渲染搜索 / 新增按钮 / 列表', () => {
    const wrapper = factory();
    expect(wrapper.find('.fake-search-input').exists()).toBe(true);
    expect(wrapper.find('.create-code-button').exists()).toBe(true);
    expect(wrapper.find('.fake-code-block-list').exists()).toBe(true);
  });

  test('editable 为 false 时不渲染新增按钮', () => {
    codeBlockService.getEditStatus.mockReturnValue(false);
    const wrapper = factory();
    expect(wrapper.find('.create-code-button').exists()).toBe(false);
  });

  test('SearchInput search 触发列表 filter', async () => {
    const wrapper = factory();
    const input = wrapper.find('.fake-search-input');
    (input.element as HTMLInputElement).value = 'kw';
    await input.trigger('change');
    expect(filterFn).toHaveBeenCalledWith('kw');
  });

  test('点击新增按钮调用 createCodeBlock', async () => {
    const wrapper = factory();
    const btns = wrapper.findAll('.fake-btn');
    const createBtn = btns.find((b) => b.text() === '新增');
    expect(createBtn).toBeTruthy();
    await createBtn!.trigger('click');
    expect(createCodeBlock).toHaveBeenCalled();
  });

  test('CodeBlockList edit/remove/contextmenu 事件', async () => {
    const wrapper = factory();
    await wrapper.find('.edit-btn').trigger('click');
    expect(editCode).toHaveBeenCalledWith('c1');
    await wrapper.find('.remove-btn').trigger('click');
    expect(deleteCode).toHaveBeenCalledWith('c1');
    await wrapper.find('.ctx-btn').trigger('click');
    expect(nodeContentMenuHandler).toHaveBeenCalled();
  });

  test('codeConfig 有值时渲染编辑器', async () => {
    const wrapper = factory();
    codeConfig.value = { name: 'cfg', content: '' };
    await nextTick();
    expect(wrapper.find('.fake-code-block-editor').exists()).toBe(true);
    await wrapper.find('.fake-code-block-editor').trigger('click');
    expect(submitCodeBlockHandler).toHaveBeenCalled();
  });

  test('编辑器 close 事件清空 selected', async () => {
    codeBlockListNodeStatusMap.get('c1').selected = true;
    const wrapper = factory();
    codeConfig.value = { name: 'cfg', content: '' };
    await nextTick();
    await wrapper.find('.fake-code-block-editor').trigger('contextmenu');
    expect(codeBlockListNodeStatusMap.get('c1').selected).toBe(false);
  });

  test('codeId 改变时切换选中状态', async () => {
    factory();
    codeId.value = 'c2';
    await nextTick();
    expect(codeBlockListNodeStatusMap.get('c1').selected).toBe(false);
    expect(codeBlockListNodeStatusMap.get('c2').selected).toBe(true);
  });

  test('eventBus.edit-code 触发 editCode', () => {
    factory();
    eventBus.emit('edit-code', 'cx');
    expect(editCode).toHaveBeenCalledWith('cx');
  });

  test('ContentMenu hide 触发 contentMenuHideHandler', async () => {
    document.body.innerHTML = '';
    factory();
    await nextTick();
    const menu = document.body.querySelector('.fake-content-menu') as HTMLElement;
    expect(menu).toBeTruthy();
    menu.click();
    expect(contentMenuHideHandler).toHaveBeenCalled();
  });

  test('menuData 为空时不渲染 ContentMenu', async () => {
    document.body.innerHTML = '';
    menuDataState.items = [];
    factory();
    await nextTick();
    expect(document.body.querySelector('.fake-content-menu')).toBeFalsy();
  });
});
