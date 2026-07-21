/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import ViewForm from '@editor/components/ViewForm.vue';

const propsService = {
  getPropsConfig: vi.fn(async () => [{ type: 'text', name: 'name' }]),
};
const dataSourceService = {
  getFormConfig: vi.fn(() => [{ type: 'text', name: 'title' }]),
};
const codeBlockService = {
  getParamsColConfig: vi.fn(() => null),
};
const editorService = {
  get: vi.fn(() => ({ select: vi.fn() })),
};

const services = {
  propsService,
  dataSourceService,
  codeBlockService,
  editorService,
} as any;

let capturedFormProps: Record<string, any> = {};

vi.mock('@editor/utils/code-block', () => ({
  getCodeBlockFormConfig: vi.fn(() => [{ type: 'text', name: 'content' }]),
}));

vi.mock('@tmagic/form', () => ({
  MForm: defineComponent({
    name: 'MForm',
    props: ['config', 'initValues', 'disabled', 'labelWidth', 'extendState', 'size'],
    setup(props, { expose }) {
      capturedFormProps = props as Record<string, any>;
      expose({ formState: {} });
      return () => h('div', { class: 'fake-mform' });
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  capturedFormProps = {};
});

describe('ViewForm.vue', () => {
  test('node 类别按 type 加载配置并渲染 MForm', async () => {
    const wrapper = mount(ViewForm, {
      props: {
        category: 'node',
        type: 'text',
        value: { id: 'n1', name: 'a' },
        services,
      },
    });
    await nextTick();
    await nextTick();
    expect(propsService.getPropsConfig).toHaveBeenCalledWith('text', { node: { id: 'n1', name: 'a' } });
    expect(wrapper.find('.fake-mform').exists()).toBe(true);
    expect(capturedFormProps.initValues).toEqual({ id: 'n1', name: 'a' });
  });

  test('默认 disabled 为 true', async () => {
    mount(ViewForm, {
      props: {
        category: 'node',
        type: 'text',
        value: { id: 'n1' },
        services,
      },
    });
    await nextTick();
    await nextTick();
    expect(capturedFormProps.disabled).toBe(true);
  });

  test('可通过 disabled=false 覆盖为可编辑', async () => {
    mount(ViewForm, {
      props: {
        category: 'node',
        type: 'text',
        value: { id: 'n1' },
        disabled: false,
        services,
      },
    });
    await nextTick();
    await nextTick();
    expect(capturedFormProps.disabled).toBe(false);
  });

  test('size 透传给 MForm', async () => {
    mount(ViewForm, {
      props: {
        category: 'node',
        type: 'text',
        value: { id: 'n1' },
        size: 'small',
        services,
      },
    });
    await nextTick();
    await nextTick();
    expect(capturedFormProps.size).toBe('small');
  });

  test('code-block 类别会把 content 非字符串值 normalize 成字符串', async () => {
    mount(ViewForm, {
      props: {
        category: 'code-block',
        value: { id: 'cb_1', content: { toString: () => 'fn-body' } },
        services,
      },
    });
    await nextTick();
    await nextTick();
    expect(capturedFormProps.initValues.content).toBe('fn-body');
  });

  test('传入 height 时外层容器启用内部滚动样式', () => {
    const wrapper = mount(ViewForm, {
      props: {
        category: 'node',
        type: 'text',
        value: { id: 'n1' },
        height: '400px',
        services,
      },
    });
    const style = wrapper.find('.m-editor-view-form-wrapper').attributes('style') || '';
    expect(style).toContain('height: 400px');
    expect(style).toContain('overflow: auto');
  });

  test('node 类别缺少 type 时不渲染 MForm', async () => {
    const wrapper = mount(ViewForm, {
      props: {
        category: 'node',
        value: { id: 'n1' },
        services,
      },
    });
    await nextTick();
    await nextTick();
    expect(wrapper.find('.fake-mform').exists()).toBe(false);
  });

  test('reload 暴露方法会重新加载配置', async () => {
    const wrapper = mount(ViewForm, {
      props: {
        category: 'data-source',
        type: 'base',
        value: { id: 'ds_1' },
        services,
      },
    });
    await nextTick();
    await nextTick();
    dataSourceService.getFormConfig.mockClear();
    await (wrapper.vm as any).reload();
    expect(dataSourceService.getFormConfig).toHaveBeenCalled();
  });
});
