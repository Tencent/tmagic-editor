/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import { ENABLE_PROPS_FORM_VALIDATE } from '@editor/editorProps';
import FormPanel from '@editor/layouts/props-panel/FormPanel.vue';

const editorService = { get: vi.fn() };
const uiService = { get: vi.fn() };

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ editorService, uiService }),
}));

vi.mock('@editor/hooks/use-editor-content-height', () => ({
  useEditorContentHeight: () => ({ height: { value: 600 } }),
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

vi.mock('@editor/layouts/CodeEditor.vue', () => ({
  default: defineComponent({
    name: 'CodeEditor',
    props: ['height', 'initValues', 'options', 'parse'],
    emits: ['save'],
    setup(_p, { emit }) {
      return () =>
        h('div', {
          class: 'fake-code-editor',
          onClick: () => emit('save', { foo: 'bar' }),
        });
    },
  }),
}));

vi.mock('@tmagic/design', () => ({
  TMagicScrollbar: defineComponent({
    name: 'TMagicScrollbar',
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-scrollbar' }, slots.default?.());
    },
  }),
  TMagicButton: defineComponent({
    name: 'TMagicButton',
    inheritAttrs: true,
    setup(_p, { slots }) {
      return () => h('button', { class: 'fake-btn' }, slots.default?.());
    },
  }),
}));

// 可控的 submitForm 实现：默认校验成功，测试可将其改为 reject 以模拟校验失败
let submitFormImpl: () => Promise<any> = async () => ({ a: 1 });
// 可控的静默校验 validateForm 实现：默认返回空字符串（校验通过）
let validateFormImpl: (_options?: any) => Promise<string> = async () => '';

vi.mock('@tmagic/form', async () => {
  const actual = await vi.importActual<any>('@tmagic/form');
  return {
    ...actual,
    // 源码保存后的静默校验走独立的 validateForm（内部新建 MForm 实例），此处 mock 便于断言
    validateForm: vi.fn((options?: any) => validateFormImpl(options)),
    MForm: defineComponent({
      name: 'MForm',
      props: ['config', 'initValues', 'extendState'],
      emits: ['change', 'error'],
      setup(_p, { expose, emit }) {
        const formState = { stage: null as any, services: null as any };
        expose({
          formState,
          submitForm: vi.fn(() => submitFormImpl()),
        });
        return () =>
          h('div', { class: 'fake-mform' }, [
            h('button', {
              class: 'change-btn',
              onClick: () => emit('change', { a: 1 }, { changeRecords: [] }),
            }),
            h('button', { class: 'err-btn', onClick: () => emit('error', new Error('e')) }),
          ]);
      },
    }),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  submitFormImpl = async () => ({ a: 1 });
  validateFormImpl = async () => '';
  uiService.get.mockImplementation((k: string) => (k === 'propsPanelSize' ? 'small' : null));
  editorService.get.mockImplementation((k: string) => (k === 'stage' ? { id: 'stage' } : null));
});

describe('FormPanel', () => {
  test('渲染 MForm', () => {
    const wrapper = mount(FormPanel, { props: { config: [], values: {} } as any });
    expect(wrapper.findComponent({ name: 'MForm' }).exists()).toBe(true);
  });

  test('mounted 事件 emit', async () => {
    const wrapper = mount(FormPanel, { props: { config: [], values: {} } as any });
    await nextTick();
    expect(wrapper.emitted('mounted')).toBeTruthy();
  });

  test('change 事件触发 submit', async () => {
    const wrapper = mount(FormPanel, { props: { config: [], values: {} } as any });
    await wrapper.find('.change-btn').trigger('click');
    await new Promise((r) => setTimeout(r, 0));
    expect(wrapper.emitted('submit')).toBeTruthy();
  });

  test('error 事件触发 form-error', async () => {
    const wrapper = mount(FormPanel, { props: { config: [], values: {} } as any });
    await wrapper.find('.err-btn').trigger('click');
    expect(wrapper.emitted('form-error')).toBeTruthy();
  });

  test('校验失败且未启用 enablePropsFormValidate 时 emit submit-error，不更新节点', async () => {
    submitFormImpl = async () => {
      throw new Error('校验失败');
    };
    const wrapper = mount(FormPanel, { props: { config: [], values: {} } as any });
    await wrapper.find('.change-btn').trigger('click');
    await new Promise((r) => setTimeout(r, 0));

    expect(wrapper.emitted('submit-error')).toBeTruthy();
    expect(wrapper.emitted('submit')).toBeFalsy();
  });

  test('校验失败且启用 enablePropsFormValidate 时仍 emit submit(携带当前值+error)', async () => {
    const err = new Error('校验失败');
    submitFormImpl = async () => {
      throw err;
    };
    const wrapper = mount(FormPanel, {
      props: { config: [], values: {} } as any,
      global: { provide: { [ENABLE_PROPS_FORM_VALIDATE]: true } },
    });
    await wrapper.find('.change-btn').trigger('click');
    await new Promise((r) => setTimeout(r, 0));

    const submitEvents = wrapper.emitted('submit');
    expect(submitEvents).toBeTruthy();
    // 第三个参数为错误对象
    expect(submitEvents?.[0]?.[2]).toBe(err);
    // 第一个参数为 change 携带的当前表单值
    expect(submitEvents?.[0]?.[0]).toEqual({ a: 1 });
    expect(wrapper.emitted('submit-error')).toBeFalsy();
  });

  test('校验成功时 emit submit 且不携带 error', async () => {
    const wrapper = mount(FormPanel, {
      props: { config: [], values: {} } as any,
      global: { provide: { [ENABLE_PROPS_FORM_VALIDATE]: true } },
    });
    await wrapper.find('.change-btn').trigger('click');
    await new Promise((r) => setTimeout(r, 0));

    const submitEvents = wrapper.emitted('submit');
    expect(submitEvents).toBeTruthy();
    expect(submitEvents?.[0]?.[2]).toBeUndefined();
  });

  test('disabledShowSrc 控制源码按钮', () => {
    const wrapper = mount(FormPanel, {
      props: { config: [], values: {}, disabledShowSrc: true } as any,
    });
    expect(wrapper.find('.fake-btn').exists()).toBe(false);
  });

  test('点击源码按钮显示 CodeEditor', async () => {
    const wrapper = mount(FormPanel, { props: { config: [], values: {} } as any });
    await wrapper.find('.fake-btn').trigger('click');
    expect(wrapper.find('.fake-code-editor').exists()).toBe(true);
  });

  test('CodeEditor save 事件触发 submit (使用 codeValueKey)', async () => {
    const wrapper = mount(FormPanel, {
      props: { config: [], values: {}, codeValueKey: 'style' } as any,
    });
    await wrapper.find('.fake-btn').trigger('click');
    await wrapper.find('.fake-code-editor').trigger('click');
    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual({ style: { foo: 'bar' } });
  });

  test('CodeEditor save 事件触发 submit (无 codeValueKey)', async () => {
    const wrapper = mount(FormPanel, { props: { config: [], values: {} } as any });
    await wrapper.find('.fake-btn').trigger('click');
    await wrapper.find('.fake-code-editor').trigger('click');
    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual({ foo: 'bar' });
  });

  test('未启用 enablePropsFormValidate 时源码保存不触发静默校验', async () => {
    const validateSpy = vi.fn(async () => '');
    validateFormImpl = validateSpy;
    const wrapper = mount(FormPanel, { props: { config: [], values: {} } as any });
    await wrapper.find('.fake-btn').trigger('click');
    await wrapper.find('.fake-code-editor').trigger('click');
    await new Promise((r) => setTimeout(r, 0));

    expect(validateSpy).not.toHaveBeenCalled();
    // 仅携带值，不携带 error
    expect(wrapper.emitted('submit')?.[0]).toEqual([{ foo: 'bar' }]);
  });

  test('启用 enablePropsFormValidate 时源码保存通过新建的 MForm 做静默校验（携带 config/initValues）', async () => {
    const validateSpy = vi.fn(async () => '');
    validateFormImpl = validateSpy;
    const wrapper = mount(FormPanel, {
      props: { config: [], values: {}, codeValueKey: 'style' } as any,
      global: { provide: { [ENABLE_PROPS_FORM_VALIDATE]: true } },
    });
    await wrapper.find('.fake-btn').trigger('click');
    await wrapper.find('.fake-code-editor').trigger('click');
    await new Promise((r) => setTimeout(r, 0));

    expect(validateSpy).toHaveBeenCalledTimes(1);
    // 以源码保存后的最新值作为待校验的 initValues
    expect(validateSpy.mock.calls[0][0]).toMatchObject({ initValues: { style: { foo: 'bar' } } });
  });

  test('源码保存时传给 validateForm 的 extendState 注入 services 和 stage', async () => {
    const validateSpy = vi.fn(async () => '');
    validateFormImpl = validateSpy;
    const wrapper = mount(FormPanel, {
      props: { config: [], values: {} } as any,
      global: { provide: { [ENABLE_PROPS_FORM_VALIDATE]: true } },
    });
    await wrapper.find('.fake-btn').trigger('click');
    await wrapper.find('.fake-code-editor').trigger('click');
    await new Promise((r) => setTimeout(r, 0));

    const { extendState } = validateSpy.mock.calls[0][0];
    expect(typeof extendState).toBe('function');
    const result = await extendState({});
    expect(result).toHaveProperty('services');
    expect(result).toHaveProperty('stage');
  });

  test('启用 enablePropsFormValidate 且源码保存静默校验通过时 submit 不携带 error', async () => {
    validateFormImpl = async () => '';
    const wrapper = mount(FormPanel, {
      props: { config: [], values: {} } as any,
      global: { provide: { [ENABLE_PROPS_FORM_VALIDATE]: true } },
    });
    await wrapper.find('.fake-btn').trigger('click');
    await wrapper.find('.fake-code-editor').trigger('click');
    await new Promise((r) => setTimeout(r, 0));

    const submitEvents = wrapper.emitted('submit');
    expect(submitEvents?.[0]?.[0]).toEqual({ foo: 'bar' });
    // eventData 为 undefined（源码保存），error 为 undefined（校验通过）
    expect(submitEvents?.[0]?.[1]).toBeUndefined();
    expect(submitEvents?.[0]?.[2]).toBeUndefined();
  });

  test('启用 enablePropsFormValidate 且源码保存静默校验失败时 submit 携带 error', async () => {
    validateFormImpl = async () => '字段A -> 必填';
    const wrapper = mount(FormPanel, {
      props: { config: [], values: {} } as any,
      global: { provide: { [ENABLE_PROPS_FORM_VALIDATE]: true } },
    });
    await wrapper.find('.fake-btn').trigger('click');
    await wrapper.find('.fake-code-editor').trigger('click');
    await new Promise((r) => setTimeout(r, 0));

    const submitEvents = wrapper.emitted('submit');
    expect(submitEvents?.[0]?.[0]).toEqual({ foo: 'bar' });
    expect(submitEvents?.[0]?.[1]).toBeUndefined();
    expect(submitEvents?.[0]?.[2]).toBeInstanceOf(Error);
    expect((submitEvents?.[0]?.[2] as Error).message).toBe('字段A -> 必填');
  });

  test('启用 enablePropsFormValidate 时静默校验抛异常则退回普通提交', async () => {
    validateFormImpl = async () => {
      throw new Error('validate 异常');
    };
    const wrapper = mount(FormPanel, {
      props: { config: [], values: {} } as any,
      global: { provide: { [ENABLE_PROPS_FORM_VALIDATE]: true } },
    });
    await wrapper.find('.fake-btn').trigger('click');
    await wrapper.find('.fake-code-editor').trigger('click');
    await new Promise((r) => setTimeout(r, 0));

    const submitEvents = wrapper.emitted('submit');
    // 退回到仅携带值的提交
    expect(submitEvents?.[0]).toEqual([{ foo: 'bar' }]);
  });
});
