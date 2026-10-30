/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { computed, type ComputedRef, defineComponent, h, inject, nextTick, provide, ref } from 'vue';
import { mount } from '@vue/test-utils';

import { FORM_CONTEXT_KEY, type FormContext } from '@tmagic/form';

import Editor from '@editor/Editor.vue';
import { ENABLE_PROPS_FORM_VALIDATE } from '@editor/editorProps';

let injectedFormContext: ComputedRef<FormContext> | undefined;
let injectedEnablePropsFormValidate: ComputedRef<boolean> | undefined;

const { initServiceEventsMock, initServiceStateMock } = vi.hoisted(() => ({
  initServiceEventsMock: vi.fn(),
  initServiceStateMock: vi.fn(),
}));

vi.mock('@editor/initService', () => ({
  initServiceEvents: initServiceEventsMock,
  initServiceState: initServiceStateMock,
}));

vi.mock('@editor/services/sdk-instance', async (importOriginal) => {
  const actual = await importOriginal<any>();
  const modCodeBlock = await (() => ({ default: {} }))();
  const modComponentList = await (() => ({ default: {} }))();
  const modDataSource = await (() => ({ default: {} }))();
  const modDep = await (() => ({ default: {} }))();
  const modEditor = await (async () => {
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
  })();
  const modEvents = await (() => ({ default: {} }))();
  const modHistory = await (() => ({ default: {} }))();
  const modProps = await (() => ({ default: {} }))();
  const modStorage = await (() => ({ default: {}, Protocol: {} }))();
  return {
    ...actual,
    codeBlockService: modCodeBlock.default,
    componentListService: modComponentList.default,
    dataSourceService: modDataSource.default,
    depService: modDep.default,
    editorService: modEditor.default,
    eventsService: modEvents.default,
    historyService: modHistory.default,
    propsService: modProps.default,
    storageService: modStorage.default,
    Protocol: modStorage.Protocol,
  };
});

const { stageStub } = vi.hoisted(() => ({ stageStub: { name: 'stage-instance' } }));
// 用响应式 ref 承载 stage，模拟真实 editorService 的 reactive state，
// 这样 formContext 的 computed 才会在 stage 变化时失效重算

vi.mock('@editor/services/keybinding', () => ({
  default: { register: vi.fn(), registerEl: vi.fn() },
}));

vi.mock('@editor/services/stageOverlay', () => ({
  default: { set: vi.fn() },
}));

vi.mock('@editor/services/ui', () => ({ default: {} }));
vi.mock('@editor/utils/keybinding-config', () => ({ default: {}, KeyBindingContainerKey: { STAGE: 'stage' } }));

vi.mock('@editor/layouts/Framework.vue', () => ({
  default: defineComponent({
    name: 'FakeFramework',
    props: ['disabledPageFragment', 'pageBarSortOptions', 'pageFilterFunction'],
    setup(_p, { slots }) {
      return () =>
        h('div', { class: 'fake-framework' }, [
          slots['content-before']?.(),
          slots['src-code']?.(),
          slots.empty?.(),
          slots['content-after']?.(),
          slots['page-bar']?.(),
          slots['page-bar-add-button']?.(),
          slots['page-bar-title']?.({ page: { id: 'p' } }),
          slots['page-bar-popover']?.({ page: { id: 'p' } }),
          slots['page-list-popover']?.({ list: [] }),
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
    setup(_p, { emit, slots }) {
      return () =>
        h(
          'div',
          {
            class: 'fake-sidebar',
            onClick: () => emit('layer-node-dblclick', new MouseEvent('dblclick'), { id: 'a' }),
          },
          [
            slots['layer-panel-header']?.(),
            slots['layer-node-content']?.({ data: { id: 'a' } }),
            slots['layer-node-label']?.({ data: { id: 'a' } }),
            slots['layer-node-tool']?.({ data: { id: 'a' } }),
            slots['component-list-panel-header']?.(),
            slots['component-list']?.({ componentGroupList: [] }),
            slots['component-list-item']?.({ component: { type: 'x' } }),
            slots['code-block-panel-header']?.(),
            slots['code-block-panel-tool']?.({ id: 'c', data: {} }),
            slots['code-block-panel-search']?.(),
            slots['data-source-panel-tool']?.({ data: {} }),
            slots['data-source-panel-search']?.(),
          ],
        );
    },
  }),
}));

vi.mock('@editor/layouts/workspace/Workspace.vue', () => ({
  default: defineComponent({
    name: 'FakeWorkspace',
    setup:
      (_p, { slots }) =>
      () =>
        h('div', { class: 'fake-workspace' }, [
          slots['stage-top']?.(),
          slots.stage?.(),
          slots['workspace-content']?.(),
        ]),
  }),
}));

vi.mock('@editor/layouts/props-panel/PropsPanel.vue', () => ({
  default: defineComponent({
    name: 'PropsPanel',
    emits: ['mounted', 'unmounted', 'submit-error', 'form-error'],
    setup(_p, { emit, slots }) {
      injectedFormContext = inject(FORM_CONTEXT_KEY, undefined);
      injectedEnablePropsFormValidate = inject(
        ENABLE_PROPS_FORM_VALIDATE,
        computed(() => false),
      );
      return () =>
        h('div', { class: 'fake-props-panel' }, [
          slots['props-panel-header']?.(),
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
  injectedEnablePropsFormValidate = undefined;
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

  test('beforeDropComponent 透传到 stageOptions', async () => {
    const beforeDropComponent = vi.fn();
    const stageOverlayMod = (await import('@editor/services/stageOverlay')) as any;
    mount(Editor, { props: { beforeDropComponent } as any });
    await nextTick();
    const stageOptions = stageOverlayMod.default.set.mock.calls.find((c: any[]) => c[0] === 'stageOptions')?.[1];
    expect(stageOptions.beforeDropComponent).toBe(beforeDropComponent);
  });

  test('beforeAppendComponent 透传到 stageOptions', async () => {
    const beforeAppendComponent = vi.fn();
    const stageOverlayMod = (await import('@editor/services/stageOverlay')) as any;
    mount(Editor, { props: { beforeAppendComponent } as any });
    await nextTick();
    const stageOptions = stageOverlayMod.default.set.mock.calls.find((c: any[]) => c[0] === 'stageOptions')?.[1];
    expect(stageOptions.beforeAppendComponent).toBe(beforeAppendComponent);
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

  test('合并宿主在外层 provide 的 FORM_CONTEXT_KEY，不遮蔽其业务字段', async () => {
    const hostComponent = defineComponent({
      setup: () => {
        provide(
          FORM_CONTEXT_KEY,
          computed(() => ({ username: 'tester', editor: { editorCore: {} } }) as unknown as FormContext),
        );
        return () => h(Editor, {} as any);
      },
    });

    mount(hostComponent);
    await nextTick();

    const context = injectedFormContext!.value as any;
    expect(context.username).toBe('tester');
    expect(context.editor.editorCore).toBeDefined();
    // 编辑器自己的字段优先级更高，仍然兜底
    expect(context.services.editorService).toBeDefined();
    expect(context.stage).toBe(stageStub);
  });

  test('宿主上下文的 accessor 保持读时求值', async () => {
    const counter = ref(0);
    const hostComponent = defineComponent({
      setup: () => {
        provide(
          FORM_CONTEXT_KEY,
          computed(
            () =>
              ({
                get buildVersion() {
                  return counter.value;
                },
              }) as unknown as FormContext,
          ),
        );
        return () => h(Editor, {} as any);
      },
    });

    mount(hostComponent);
    await nextTick();

    expect((injectedFormContext!.value as any).buildVersion).toBe(0);
    counter.value = 7;
    expect((injectedFormContext!.value as any).buildVersion).toBe(7);
  });

  test('stage 走 computed 读时求值，切换画布后能读到新实例', async () => {
    const editorServiceMod = (await import('@editor/services/sdk-instance')) as any;
    mount(Editor, { props: {} as any });
    await nextTick();

    expect((injectedFormContext!.value as any).stage).toBe(stageStub);

    const nextStage = { name: 'next-stage' };
    editorServiceMod.editorService.__setStage(nextStage);
    expect((injectedFormContext!.value as any).stage).toBe(nextStage);
    editorServiceMod.editorService.__setStage(stageStub);
  });

  test('ENABLE_PROPS_FORM_VALIDATE 默认注入 false', async () => {
    mount(Editor, { props: {} as any });
    await nextTick();
    expect(injectedEnablePropsFormValidate?.value).toBe(false);
  });

  test('ENABLE_PROPS_FORM_VALIDATE 走 computed 读时求值，prop 变化后子孙能读到最新值', async () => {
    const wrapper = mount(Editor, { props: { enablePropsFormValidate: false } as any });
    await nextTick();
    expect(injectedEnablePropsFormValidate?.value).toBe(false);

    await wrapper.setProps({ enablePropsFormValidate: true });
    expect(injectedEnablePropsFormValidate?.value).toBe(true);

    await wrapper.setProps({ enablePropsFormValidate: false });
    expect(injectedEnablePropsFormValidate?.value).toBe(false);
  });

  test('expose services', () => {
    const wrapper = mount(Editor, { props: {} as any });
    expect((wrapper.vm as any).editorService).toBeDefined();
    expect((wrapper.vm as any).propsService).toBeDefined();
  });

  test('所有插槽透传到子布局', () => {
    const names = [
      'content-before',
      'src-code',
      'empty',
      'content-after',
      'page-bar',
      'page-bar-add-button',
      'page-bar-title',
      'page-bar-popover',
      'page-list-popover',
      'layer-panel-header',
      'layer-node-content',
      'layer-node-label',
      'layer-node-tool',
      'component-list-panel-header',
      'component-list',
      'component-list-item',
      'code-block-panel-header',
      'code-block-panel-tool',
      'code-block-panel-search',
      'data-source-panel-tool',
      'data-source-panel-search',
      'stage-top',
      'stage',
      'workspace-content',
      'props-panel-header',
    ];
    const slots = Object.fromEntries(names.map((n) => [n, `<i class="slot-${n}"></i>`]));
    const wrapper = mount(Editor, { props: {} as any, slots });
    for (const n of names) {
      expect(wrapper.find(`.slot-${n}`).exists(), n).toBe(true);
    }
  });

  test('传入 isLargeStageContainer 与 theme', () => {
    const wrapper = mount(Editor, { props: { isLargeStageContainer: true, theme: 'dark' } as any });
    expect(wrapper.exists()).toBe(true);
  });
});
