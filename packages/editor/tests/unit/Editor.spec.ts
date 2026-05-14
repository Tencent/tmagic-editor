/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import Editor from '@editor/Editor.vue';

const { initServiceEventsMock, initServiceStateMock } = vi.hoisted(() => ({
  initServiceEventsMock: vi.fn(),
  initServiceStateMock: vi.fn(),
}));

vi.mock('@editor/initService', () => ({
  initServiceEvents: initServiceEventsMock,
  initServiceState: initServiceStateMock,
}));

vi.mock('@editor/services/codeBlock', () => ({ default: {} }));
vi.mock('@editor/services/componentList', () => ({ default: {} }));
vi.mock('@editor/services/dataSource', () => ({ default: {} }));
vi.mock('@editor/services/dep', () => ({ default: {} }));
vi.mock('@editor/services/editor', () => ({ default: {} }));
vi.mock('@editor/services/events', () => ({ default: {} }));
vi.mock('@editor/services/history', () => ({ default: {} }));
vi.mock('@editor/services/keybinding', () => ({
  default: { register: vi.fn(), registerEl: vi.fn() },
}));
vi.mock('@editor/services/props', () => ({ default: {} }));
vi.mock('@editor/services/stageOverlay', () => ({
  default: { set: vi.fn() },
}));
vi.mock('@editor/services/storage', () => ({ default: {}, Protocol: {} }));
vi.mock('@editor/services/ui', () => ({ default: {} }));
vi.mock('@editor/utils/keybinding-config', () => ({ default: {}, KeyBindingContainerKey: { STAGE: 'stage' } }));

vi.mock('@editor/layouts/Framework.vue', () => ({
  default: defineComponent({
    name: 'FakeFramework',
    props: ['disabledPageFragment', 'pageBarSortOptions', 'pageFilterFunction'],
    setup(_p, { slots }) {
      return () =>
        h('div', { class: 'fake-framework' }, [
          slots.header?.(),
          slots.nav?.({ editorService: {} }),
          slots.sidebar?.({ editorService: {} }),
          slots.workspace?.({ editorService: {} }),
          slots['props-panel']?.(),
          slots.footer?.(),
        ]);
    },
  }),
}));

vi.mock('@editor/layouts/NavMenu.vue', () => ({
  default: defineComponent({
    name: 'TMagicNavMenu',
    props: ['data'],
    setup() {
      return () => h('div', { class: 'fake-nav-menu' });
    },
  }),
}));

vi.mock('@editor/layouts/sidebar/Sidebar.vue', () => ({
  default: defineComponent({
    name: 'FakeSidebar',
    emits: ['layer-node-dblclick'],
    setup(_p, { emit }) {
      return () =>
        h('div', {
          class: 'fake-sidebar',
          onClick: () => emit('layer-node-dblclick', new MouseEvent('dblclick'), { id: 'a' }),
        });
    },
  }),
}));

vi.mock('@editor/layouts/workspace/Workspace.vue', () => ({
  default: defineComponent({ name: 'FakeWorkspace', setup: () => () => h('div', { class: 'fake-workspace' }) }),
}));

vi.mock('@editor/layouts/props-panel/PropsPanel.vue', () => ({
  default: defineComponent({
    name: 'PropsPanel',
    emits: ['mounted', 'unmounted', 'submit-error', 'form-error'],
    setup(_p, { emit }) {
      return () =>
        h('div', { class: 'fake-props-panel' }, [
          h('button', { class: 'mounted-btn', onClick: () => emit('mounted', { proxy: true }) }),
          h('button', { class: 'unmounted-btn', onClick: () => emit('unmounted') }),
          h('button', { class: 'submit-err', onClick: () => emit('submit-error', new Error('e')) }),
          h('button', { class: 'form-err', onClick: () => emit('form-error', new Error('e')) }),
        ]);
    },
  }),
}));

vi.mock('@editor/layouts/props-panel/FormPanel.vue', () => ({
  default: defineComponent({ name: 'FormPanel', setup: () => () => h('div') }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Editor', () => {
  test('挂载时初始化 services', () => {
    mount(Editor, { props: {} as any });
    expect(initServiceEventsMock).toHaveBeenCalled();
    expect(initServiceStateMock).toHaveBeenCalled();
  });

  test('canDropIn 转发到 stage 含 stage-add/stage-drag 类型', async () => {
    const canDropIn = vi.fn(() => true);
    const stageOverlayMod = (await import('@editor/services/stageOverlay')) as any;
    mount(Editor, { props: { canDropIn } as any });
    await nextTick();
    const stageOptions = stageOverlayMod.default.set.mock.calls.find((c: any[]) => c[0] === 'stageOptions')?.[1];
    expect(stageOptions.canDropIn).toBeDefined();
    stageOptions.canDropIn([], 't1');
    expect(canDropIn).toHaveBeenCalledWith([], 't1', 'stage-add');
    stageOptions.canDropIn(['s1'], 't1');
    expect(canDropIn).toHaveBeenLastCalledWith(['s1'], 't1', 'stage-drag');
  });

  test('未传 canDropIn 时 stageOptions.canDropIn 为 undefined', async () => {
    const stageOverlayMod = (await import('@editor/services/stageOverlay')) as any;
    mount(Editor, { props: {} as any });
    await nextTick();
    const stageOptions = stageOverlayMod.default.set.mock.calls.find((c: any[]) => c[0] === 'stageOptions')?.[1];
    expect(stageOptions.canDropIn).toBeUndefined();
  });

  test('PropsPanel 事件转发', async () => {
    const wrapper = mount(Editor, { props: {} as any });
    await wrapper.find('.mounted-btn').trigger('click');
    expect(wrapper.emitted('props-panel-mounted')).toBeTruthy();
    await wrapper.find('.unmounted-btn').trigger('click');
    expect(wrapper.emitted('props-panel-unmounted')).toBeTruthy();
    await wrapper.find('.submit-err').trigger('click');
    expect(wrapper.emitted('props-submit-error')).toBeTruthy();
    await wrapper.find('.form-err').trigger('click');
    expect(wrapper.emitted('props-form-error')).toBeTruthy();
  });

  test('Sidebar layer-node-dblclick 事件转发', async () => {
    const wrapper = mount(Editor, { props: {} as any });
    await wrapper.find('.fake-sidebar').trigger('click');
    expect(wrapper.emitted('layer-node-dblclick')).toBeTruthy();
  });

  test('expose services', () => {
    const wrapper = mount(Editor, { props: {} as any });
    expect((wrapper.vm as any).editorService).toBeDefined();
    expect((wrapper.vm as any).propsService).toBeDefined();
  });
});
