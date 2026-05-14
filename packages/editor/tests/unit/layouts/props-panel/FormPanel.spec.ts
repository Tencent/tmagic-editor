/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

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

vi.mock('@tmagic/form', async () => {
  const actual = await vi.importActual<any>('@tmagic/form');
  return {
    ...actual,
    MForm: defineComponent({
      name: 'MForm',
      props: ['config', 'initValues', 'extendState'],
      emits: ['change', 'error'],
      setup(_p, { expose, emit }) {
        const formState = { stage: null as any, services: null as any };
        expose({
          formState,
          submitForm: vi.fn(async () => ({ a: 1 })),
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
});
