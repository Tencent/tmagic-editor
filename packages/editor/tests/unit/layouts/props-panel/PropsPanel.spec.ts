/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';

import { ENABLE_PROPS_FORM_VALIDATE } from '@editor/editorProps';
import PropsPanel from '@editor/layouts/props-panel/PropsPanel.vue';

const editorService = {
  get: vi.fn(),
  update: vi.fn(),
};
const uiService = { get: vi.fn() };
const propsService = {
  on: vi.fn(),
  off: vi.fn(),
  getPropsConfig: vi.fn(async () => [{ name: 'x' }]),
};
const storageService = {
  getItem: vi.fn(),
  setItem: vi.fn(),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ editorService, uiService, propsService, storageService }),
}));

const showStylePanel = ref(false);
const showStylePanelToggleButton = ref(true);
const toggleStylePanel = vi.fn((v: boolean) => {
  showStylePanel.value = v;
});
vi.mock('@editor/layouts/props-panel/use-style-panel', () => ({
  useStylePanel: () => ({ showStylePanel, showStylePanelToggleButton, toggleStylePanel }),
}));

vi.mock('@editor/utils', async () => {
  const actual = await vi.importActual<any>('@editor/utils');
  return { ...actual, styleTabConfig: { items: [] } };
});

vi.mock('@editor/components/Icon.vue', () => ({
  default: defineComponent({
    name: 'IconStub',
    props: ['icon'],
    setup() {
      return () => h('i', { class: 'fake-icon' });
    },
  }),
}));

vi.mock('@editor/components/Resizer.vue', () => ({
  default: defineComponent({
    name: 'FakeResizer',
    emits: ['change'],
    setup(_p, { emit }) {
      return () =>
        h('div', {
          class: 'fake-resizer',
          onClick: () => emit('change', { deltaX: 50 }),
        });
    },
  }),
}));

const mountedHandlers: any[] = [];
vi.mock('@editor/layouts/props-panel/FormPanel.vue', () => ({
  default: defineComponent({
    name: 'FormPanel',
    props: ['config', 'values', 'disabledShowSrc', 'extendState'],
    emits: ['submit', 'submit-error', 'form-error', 'mounted', 'unmounted'],
    setup(_p, { emit, expose }) {
      mountedHandlers.push(emit);
      expose({ configForm: { formState: { foo: 'bar' } } });
      return () =>
        h('div', { class: 'fake-form-panel' }, [
          h('button', {
            class: 'submit-btn',
            onClick: () =>
              emit(
                'submit',
                { id: 'n1', style: { color: 'red', empty: '' } },
                { changeRecords: [{ propPath: 'style.bg', value: '' }] },
              ),
          }),
          h('button', {
            class: 'submit-with-err-btn',
            onClick: () =>
              emit('submit', { id: 'n1', style: { color: 'red' } }, { changeRecords: [] }, new Error('校验失败详情')),
          }),
          // 模拟 CodeEditor 源码保存：仅传 values，无 eventData、无 error（对应 saveCode 路径）
          h('button', {
            class: 'code-save-btn',
            onClick: () => emit('submit', { id: 'n1', style: { color: 'red' } }),
          }),
          h('button', { class: 'submit-err-btn', onClick: () => emit('submit-error', new Error('e')) }),
          h('button', { class: 'form-err-btn', onClick: () => emit('form-error', new Error('e')) }),
          h('button', { class: 'mounted-btn', onClick: () => emit('mounted', { proxy: true }) }),
          h('button', { class: 'unmounted-btn', onClick: () => emit('unmounted') }),
        ]);
    },
  }),
}));

vi.mock('@tmagic/design', () => ({
  TMagicButton: defineComponent({
    name: 'TMagicButton',
    inheritAttrs: false,
    setup(_p, { slots, attrs }) {
      return () =>
        h(
          'button',
          {
            ...attrs,
            class: ['fake-btn', (attrs as any).class].filter(Boolean).join(' '),
          },
          slots.default?.(),
        );
    },
  }),
}));

vi.mock('@tmagic/utils', async () => {
  const actual = await vi.importActual<any>('@tmagic/utils');
  return { ...actual, setValueByKeyPath: vi.fn() };
});

beforeEach(() => {
  vi.clearAllMocks();
  mountedHandlers.length = 0;
  showStylePanel.value = false;
  showStylePanelToggleButton.value = true;
  storageService.getItem.mockReturnValue(300);
  uiService.get.mockImplementation((k: string) => {
    if (k === 'columnWidth') return { right: 400 };
    return null;
  });
  editorService.get.mockImplementation((k: string) => {
    if (k === 'node') return { id: 'n1', type: 'text' };
    if (k === 'nodes') return [{ id: 'n1' }];
    return null;
  });
});

describe('PropsPanel', () => {
  test('渲染 FormPanel', async () => {
    const wrapper = mount(PropsPanel, { props: {} as any });
    await nextTick();
    expect(wrapper.find('.fake-form-panel').exists()).toBe(true);
  });

  test('init 调用 getPropsConfig', async () => {
    mount(PropsPanel, { props: {} as any });
    await new Promise((r) => setTimeout(r, 0));
    expect(propsService.getPropsConfig).toHaveBeenCalled();
  });

  test('node 为空时清空 config', async () => {
    editorService.get.mockImplementation((k: string) => (k === 'nodes' ? [] : null));
    const wrapper = mount(PropsPanel, { props: {} as any });
    await nextTick();
    void wrapper;
    expect(propsService.getPropsConfig).not.toHaveBeenCalled();
  });

  test('submit 触发 editorService.update', async () => {
    const wrapper = mount(PropsPanel, { props: {} as any });
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.find('.submit-btn').trigger('click');
    expect(editorService.update).toHaveBeenCalled();
    const calledNode = (editorService.update.mock.calls[0] as any)[0];
    expect(calledNode.style.color).toBe('red');
    expect(calledNode.style.empty).toBeUndefined();
  });

  test('未启用 enablePropsFormValidate 时 update 不携带 invalidInfo', async () => {
    const wrapper = mount(PropsPanel, { props: {} as any });
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.find('.submit-with-err-btn').trigger('click');
    const options = (editorService.update.mock.calls[0] as any)[1];
    expect(options.invalidInfo).toBeUndefined();
  });

  test('启用 enablePropsFormValidate 时属性表单校验失败携带 invalidInfo(source=props)', async () => {
    const wrapper = mount(PropsPanel, {
      props: {} as any,
      global: { provide: { [ENABLE_PROPS_FORM_VALIDATE]: true } },
    });
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.find('.submit-with-err-btn').trigger('click');

    const options = (editorService.update.mock.calls[0] as any)[1];
    expect(options.invalidInfo).toEqual({ id: 'n1', source: 'props', error: '校验失败详情' });
  });

  test('启用 enablePropsFormValidate 且校验成功时不携带 invalidInfo（保持错误状态不变）', async () => {
    const wrapper = mount(PropsPanel, {
      props: {} as any,
      global: { provide: { [ENABLE_PROPS_FORM_VALIDATE]: true } },
    });
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.find('.submit-btn').trigger('click');

    const options = (editorService.update.mock.calls[0] as any)[1];
    expect(options.invalidInfo).toBeUndefined();
  });

  test('启用 enablePropsFormValidate 时样式表单提交携带 invalidInfo(source=style)', async () => {
    showStylePanel.value = true;
    const wrapper = mount(PropsPanel, {
      props: {} as any,
      global: { provide: { [ENABLE_PROPS_FORM_VALIDATE]: true } },
    });
    await new Promise((r) => setTimeout(r, 0));
    // 第二个 FormPanel 为样式面板
    const styleSubmitBtns = wrapper.findAll('.submit-with-err-btn');
    expect(styleSubmitBtns.length).toBe(2);
    await styleSubmitBtns[1].trigger('click');

    const options = (editorService.update.mock.calls[0] as any)[1];
    expect(options.invalidInfo.source).toBe('style');
  });

  test('CodeEditor 源码保存不携带 invalidInfo（未经表单校验，不应改动错误状态）', async () => {
    const wrapper = mount(PropsPanel, {
      props: {} as any,
      global: { provide: { [ENABLE_PROPS_FORM_VALIDATE]: true } },
    });
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.find('.code-save-btn').trigger('click');

    const options = (editorService.update.mock.calls[0] as any)[1];
    expect(options.invalidInfo).toBeUndefined();
    // historySource 应为 code
    expect(options.historySource).toBe('code');
  });

  test('mounted 事件 emit', async () => {
    const wrapper = mount(PropsPanel, { props: {} as any });
    await wrapper.find('.mounted-btn').trigger('click');
    expect(wrapper.emitted('mounted')).toBeTruthy();
  });

  test('unmounted 事件 emit', async () => {
    const wrapper = mount(PropsPanel, { props: {} as any });
    await wrapper.find('.unmounted-btn').trigger('click');
    expect(wrapper.emitted('unmounted')).toBeTruthy();
  });

  test('form-error 事件转发', async () => {
    const wrapper = mount(PropsPanel, { props: {} as any });
    await wrapper.find('.form-err-btn').trigger('click');
    expect(wrapper.emitted('form-error')).toBeTruthy();
  });

  test('Resizer change 限制宽度', async () => {
    showStylePanel.value = true;
    const wrapper = mount(PropsPanel, { props: {} as any });
    await nextTick();
    await wrapper.find('.fake-resizer').trigger('click');
    expect(storageService.setItem).toHaveBeenCalled();
  });

  test('点击 toggle 按钮 toggleStylePanel(true)', async () => {
    showStylePanelToggleButton.value = true;
    showStylePanel.value = false;
    const wrapper = mount(PropsPanel, { props: {} as any });
    await nextTick();
    // 直接调用 toggleStylePanel 验证逻辑
    const buttons = wrapper.findAll('.fake-btn');
    expect(buttons.length).toBeGreaterThan(0);
    await buttons[buttons.length - 1].trigger('click');
    expect(toggleStylePanel).toHaveBeenCalledWith(true);
  });

  test('expose getFormState 返回 formState', async () => {
    const wrapper = mount(PropsPanel, { props: {} as any });
    await nextTick();
    expect((wrapper.vm as any).getFormState()).toEqual({ foo: 'bar' });
  });

  test('off propsService 监听 on unmount', async () => {
    const wrapper = mount(PropsPanel, { props: {} as any });
    await nextTick();
    wrapper.unmount();
    expect(propsService.off).toHaveBeenCalledWith('props-configs-change', expect.any(Function));
  });
});
