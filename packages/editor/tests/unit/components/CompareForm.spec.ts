/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';

import { HookType } from '@tmagic/core';

import CompareForm from '@editor/components/CompareForm.vue';

const propsService = {
  getPropsConfig: vi.fn(async () => [
    {
      type: 'tab',
      items: [{ title: '样式', items: [{ type: 'text', name: 'color', display: false }] }],
    },
    { type: 'text', name: 'name' },
  ]),
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

let capturedShowDiff: ((args: any) => boolean) | undefined;
let capturedFormProps: Record<string, any> = {};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({
    propsService,
    dataSourceService,
    codeBlockService,
    editorService,
  }),
}));

vi.mock('@editor/utils/code-block', () => ({
  getCodeBlockFormConfig: vi.fn(() => [{ type: 'text', name: 'content' }]),
}));

vi.mock('@tmagic/form', () => ({
  MForm: defineComponent({
    name: 'MForm',
    props: ['config', 'initValues', 'lastValues', 'isCompare', 'disabled', 'labelWidth', 'extendState', 'showDiff'],
    setup(props, { expose }) {
      capturedShowDiff = props.showDiff as (args: any) => boolean;
      capturedFormProps = props as Record<string, any>;
      expose({ formState: {} });
      return () => h('div', { class: 'fake-mform' });
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  capturedShowDiff = undefined;
  capturedFormProps = {};
});

describe('CompareForm.vue', () => {
  test('node 类别按 type 加载 props 配置并展示 MForm', async () => {
    const wrapper = mount(CompareForm, {
      props: {
        category: 'node',
        type: 'text',
        value: { id: 'n1', name: 'new' },
        lastValue: { id: 'n1', name: 'old' },
      },
      global: {
        provide: {
          codeOptions: { theme: 'vs-dark' },
        },
      },
    });
    await nextTick();
    await nextTick();

    expect(propsService.getPropsConfig).toHaveBeenCalledWith('text', { node: { id: 'n1', name: 'new' } });
    expect(wrapper.find('.fake-mform').exists()).toBe(true);
    expect(capturedFormProps.initValues).toEqual({ id: 'n1', name: 'new' });
    expect(capturedFormProps.lastValues).toEqual({ id: 'n1', name: 'old' });
  });

  test('node 类别缺少 type 时不渲染 MForm', async () => {
    const wrapper = mount(CompareForm, {
      props: {
        category: 'node',
        value: { id: 'n1' },
      },
    });
    await nextTick();
    expect(wrapper.find('.fake-mform').exists()).toBe(false);
  });

  test('data-source 类别加载数据源表单配置', async () => {
    mount(CompareForm, {
      props: {
        category: 'data-source',
        type: 'http',
        value: { id: 'ds_1', title: 'A' },
        lastValue: { id: 'ds_1', title: 'B' },
      },
    });
    await nextTick();
    await nextTick();
    expect(dataSourceService.getFormConfig).toHaveBeenCalledWith('http');
  });

  test('code-block 类别会把 content 非字符串值 normalize 成字符串', async () => {
    mount(CompareForm, {
      props: {
        category: 'code-block',
        value: { id: 'cb_1', content: { toString: () => 'fn-body' } },
        lastValue: { id: 'cb_1', content: '' },
      },
    });
    await nextTick();
    await nextTick();
    expect(capturedFormProps.initValues.content).toBe('fn-body');
    expect(capturedFormProps.lastValues.content).toBe('');
  });

  test('传入 height 时外层容器启用内部滚动样式', () => {
    const wrapper = mount(CompareForm, {
      props: {
        category: 'node',
        type: 'text',
        value: { id: 'n1' },
        height: '400px',
      },
    });
    const style = wrapper.find('.m-editor-compare-form-wrapper').attributes('style') || '';
    expect(style).toContain('height: 400px');
    expect(style).toContain('overflow: auto');
  });

  test('自定义 loadConfig 可接管配置加载', async () => {
    const loadConfig = vi.fn(async ({ defaultLoadConfig }) => {
      await defaultLoadConfig();
      return [{ type: 'text', name: 'custom' }];
    });
    const wrapper = mount(CompareForm, {
      props: {
        category: 'node',
        type: 'text',
        value: { id: 'n1' },
        loadConfig,
      },
    });
    await nextTick();
    await nextTick();
    await nextTick();
    expect(loadConfig).toHaveBeenCalled();
    expect((wrapper.vm as any).config).toEqual([{ type: 'text', name: 'custom' }]);
  });

  test('showDiff 对 code-select 的空形态视为相等', async () => {
    mount(CompareForm, {
      props: {
        category: 'node',
        type: 'text',
        value: { id: 'n1' },
      },
    });
    await nextTick();
    await nextTick();
    expect(capturedShowDiff).toBeTypeOf('function');
    expect(
      capturedShowDiff!({
        curValue: '',
        lastValue: { hookType: HookType.CODE, hookData: [] },
        config: { type: 'code-select' },
      }),
    ).toBe(false);
    expect(
      capturedShowDiff!({
        curValue: { hookType: HookType.CODE, hookData: [] },
        lastValue: '',
        config: { type: 'code-select' },
      }),
    ).toBe(false);
    expect(
      capturedShowDiff!({
        curValue: 'a',
        lastValue: 'b',
        config: { type: 'code-select' },
      }),
    ).toBe(true);
  });

  test('reload 暴露方法会重新加载配置', async () => {
    const wrapper = mount(CompareForm, {
      props: {
        category: 'data-source',
        type: 'base',
        value: { id: 'ds_1' },
      },
    });
    await nextTick();
    await nextTick();
    dataSourceService.getFormConfig.mockClear();
    await (wrapper.vm as any).reload();
    expect(dataSourceService.getFormConfig).toHaveBeenCalled();
  });

  test('watchEffect 会把 stage / services 写入 MForm.formState', async () => {
    const stage = ref({ select: vi.fn() });
    editorService.get.mockReturnValue(stage.value);
    mount(CompareForm, {
      props: {
        category: 'node',
        type: 'text',
        value: { id: 'n1' },
      },
    });
    await nextTick();
    await nextTick();
    stage.value = { select: vi.fn() };
    await nextTick();
    expect(editorService.get).toHaveBeenCalledWith('stage');
  });
});
