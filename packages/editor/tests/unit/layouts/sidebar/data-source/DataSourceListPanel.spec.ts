/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';

import DataSourceListPanel from '@editor/layouts/sidebar/data-source/DataSourceListPanel.vue';

const dataSourceService = {
  get: vi.fn(),
  getFormValue: vi.fn((t: string) => ({ id: 'fv', type: t })),
  remove: vi.fn(),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ dataSourceService }),
}));

const editDialog = ref<any>(null);
const dataSourceValues = ref<any>({});
const dialogTitle = ref('');
const editable = ref(true);
const editHandler = vi.fn();
const submitDataSourceHandler = vi.fn();
vi.mock('@editor/hooks/use-data-source-edit', () => ({
  useDataSourceEdit: () => ({
    editDialog,
    dataSourceValues,
    dialogTitle,
    editable,
    editHandler,
    submitDataSourceHandler,
  }),
}));

const nodeContentMenuHandler = vi.fn();
const contentMenuHideHandler = vi.fn();
const menuData = ref<any[]>([{ type: 'button', text: 'Edit' }]);
vi.mock('@editor/layouts/sidebar/data-source/useContentMenu', () => ({
  useContentMenu: () => ({
    nodeContentMenuHandler,
    menuData,
    contentMenuHideHandler,
  }),
}));

const filterFn = vi.fn();
const dataSourceListNodeStatusMap = new Map<string, any>();
vi.mock('@editor/layouts/sidebar/data-source/DataSourceList.vue', () => ({
  default: defineComponent({
    name: 'DataSourceList',
    props: ['indent', 'nextLevelIndentIncrement'],
    emits: ['edit', 'remove', 'node-contextmenu'],
    setup(_p, { emit, expose }) {
      expose({
        filter: filterFn,
        nodeStatusMap: dataSourceListNodeStatusMap,
      });
      return () =>
        h('div', { class: 'fake-data-source-list' }, [
          h('button', { class: 'edit-btn', onClick: () => emit('edit', 'd1') }),
          h('button', { class: 'remove-btn', onClick: () => emit('remove', 'd1') }),
          h('button', { class: 'ctx-btn', onClick: (e: MouseEvent) => emit('node-contextmenu', e, { id: 'd1' }) }),
        ]);
    },
  }),
}));

const editDialogShow = vi.fn();
vi.mock('@editor/layouts/sidebar/data-source/DataSourceConfigPanel.vue', () => ({
  default: defineComponent({
    name: 'DataSourceConfigPanel',
    props: ['disabled', 'values', 'title'],
    emits: ['submit', 'close'],
    setup(_p, { emit, expose }) {
      expose({ show: editDialogShow });
      return () =>
        h('div', { class: 'fake-config-panel' }, [h('button', { class: 'close-btn', onClick: () => emit('close') })]);
    },
  }),
}));

vi.mock('@editor/layouts/sidebar/data-source/DataSourceAddButton.vue', () => ({
  default: defineComponent({
    name: 'DataSourceAddButton',
    props: ['addButtonText', 'addButtonConfig', 'datasourceTypeList'],
    emits: ['add'],
    setup(_p, { emit }) {
      return () =>
        h('button', {
          class: 'add-btn',
          onClick: () => emit('add', 'http'),
        });
    },
  }),
}));

vi.mock('@editor/components/SearchInput.vue', () => ({
  default: defineComponent({
    name: 'SearchInput',
    emits: ['search'],
    setup(_p, { emit }) {
      return () => h('input', { class: 'fake-search', onInput: () => emit('search', 'a') });
    },
  }),
}));

const contentMenuShow = vi.fn();
vi.mock('@editor/components/ContentMenu.vue', () => ({
  default: defineComponent({
    name: 'ContentMenu',
    props: ['menuData'],
    emits: ['hide'],
    setup(_p, { emit, expose }) {
      expose({ show: contentMenuShow });
      return () =>
        h('div', { class: 'fake-ctx-menu' }, [h('button', { class: 'hide-btn', onClick: () => emit('hide') })]);
    },
  }),
}));

const { messageBoxConfirm } = vi.hoisted(() => ({ messageBoxConfirm: vi.fn(async () => true) }));
vi.mock('@tmagic/design', () => ({
  TMagicScrollbar: defineComponent({
    name: 'TMagicScrollbar',
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-scrollbar' }, slots.default?.());
    },
  }),
  tMagicMessageBox: { confirm: messageBoxConfirm },
}));

const eventBusOn = vi.fn();
const eventBus = { on: eventBusOn, emit: vi.fn() };

beforeEach(() => {
  vi.clearAllMocks();
  dataSourceService.get.mockReturnValue([{ text: 'Custom', type: 'custom' }]);
  dataSourceValues.value = {};
  editable.value = true;
  dataSourceListNodeStatusMap.clear();
  dataSourceListNodeStatusMap.set('d1', { selected: false });
});

const mountIt = (props: any = {}) =>
  mount(DataSourceListPanel, {
    props: { customContentMenu: (m: any) => m, ...props } as any,
    global: { provide: { eventBus } },
    attachTo: document.body,
  });

describe('DataSourceListPanel', () => {
  test('渲染 DataSourceList / SearchInput', () => {
    const wrapper = mountIt();
    expect(wrapper.find('.fake-data-source-list').exists()).toBe(true);
    expect(wrapper.find('.fake-search').exists()).toBe(true);
  });

  test('editable 为 false 时不渲染 AddButton', () => {
    editable.value = false;
    const wrapper = mountIt();
    expect(wrapper.find('.add-btn').exists()).toBe(false);
  });

  test('AddButton 触发 dialog.show 与赋值', async () => {
    editDialog.value = { show: editDialogShow };
    const wrapper = mountIt();
    await wrapper.find('.add-btn').trigger('click');
    expect(editDialogShow).toHaveBeenCalled();
    expect(dialogTitle.value).toContain('HTTP');
    expect(dataSourceValues.value.type).toBe('http');
  });

  test('SearchInput 调用 filter', async () => {
    const wrapper = mountIt();
    await wrapper.find('.fake-search').trigger('input');
    expect(filterFn).toHaveBeenCalledWith('a');
  });

  test('DataSourceList edit/remove/contextmenu', async () => {
    const wrapper = mountIt();
    await wrapper.find('.edit-btn').trigger('click');
    expect(editHandler).toHaveBeenCalledWith('d1');
    await wrapper.find('.remove-btn').trigger('click');
    expect(messageBoxConfirm).toHaveBeenCalled();
    await new Promise((r) => setTimeout(r, 0));
    expect(dataSourceService.remove).toHaveBeenCalledWith('d1', { historySource: 'tree-contextmenu' });
    await wrapper.find('.ctx-btn').trigger('click');
    expect(nodeContentMenuHandler).toHaveBeenCalled();
  });

  test('config-panel close 重置 selected', async () => {
    dataSourceListNodeStatusMap.set('d1', { selected: true });
    const wrapper = mountIt();
    await wrapper.find('.close-btn').trigger('click');
    expect(dataSourceListNodeStatusMap.get('d1').selected).toBe(false);
  });

  test('dataSourceValues 变化时更新 selected', async () => {
    dataSourceListNodeStatusMap.set('d1', { selected: false });
    dataSourceListNodeStatusMap.set('d2', { selected: true });
    mountIt();
    dataSourceValues.value = { id: 'd1' };
    await nextTick();
    expect(dataSourceListNodeStatusMap.get('d1').selected).toBe(true);
    expect(dataSourceListNodeStatusMap.get('d2').selected).toBe(false);
  });

  test('注册 eventBus.on', () => {
    mountIt();
    const events = eventBusOn.mock.calls.map((c: any[]) => c[0]);
    expect(events).toContain('edit-data-source');
    expect(events).toContain('remove-data-source');
  });
});
