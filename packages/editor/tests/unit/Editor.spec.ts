/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { type ComputedRef, defineComponent, h, inject, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import { FORM_CONTEXT_KEY, type FormContext } from '@tmagic/form';

import Editor from '@editor/Editor.vue';

let injectedFormContext: ComputedRef<FormContext> | undefined;

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
const { stageStub } = vi.hoisted(() => ({ stageStub: { name: 'stage-instance' } }));
// 用响应式 ref 承载 stage，模拟真实 editorService 的 reactive state，
// 这样 formContext 的 computed 才会在 stage 变化时失效重算
vi.mock('@editor/services/editor', async () => {
  const { shallowRef } = await import('vue');
  const stage = shallowRef<any>(stageStub);
  return {
    default: {
      get: vi.fn((key: string) => (key === 'stage' ? stage.value : undefined)),
      __setStage: (value: any) => {
        stage.value = value;
      },
    },
  };
});
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
      injectedFormContext = inject(FORM_CONTEXT_KEY, undefined);
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
  injectedFormContext = undefined;
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

  test('provide FORM_CONTEXT_KEY，子孙可拿到 services 与当前 stage', async () => {
    mount(Editor, { props: {} as any });
    await nextTick();

    expect(injectedFormContext).toBeDefined();
    const context = injectedFormContext!.value as any;
    expect(context.services.editorService).toBeDefined();
    expect(context.services.propsService).toBeDefined();
    expect(context.stage).toBe(stageStub);
  });

  test('stage 走 computed 读时求值，切换画布后能读到新实例', async () => {
    const editorServiceMod = (await import('@editor/services/editor')) as any;
    mount(Editor, { props: {} as any });
    await nextTick();

    expect((injectedFormContext!.value as any).stage).toBe(stageStub);

    const nextStage = { name: 'next-stage' };
    editorServiceMod.default.__setStage(nextStage);
    expect((injectedFormContext!.value as any).stage).toBe(nextStage);
    editorServiceMod.default.__setStage(stageStub);
  });

  test('expose services', () => {
    const wrapper = mount(Editor, { props: {} as any });
    expect((wrapper.vm as any).editorService).toBeDefined();
    expect((wrapper.vm as any).propsService).toBeDefined();
  });
});
