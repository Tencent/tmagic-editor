/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import { MForm } from '@tmagic/form';

import { useCompareForm } from '@editor/hooks/use-compare-form';

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
  getFormConfig: vi.fn(() => [{ type: 'tab', items: [{ status: 'fields', items: [] }] }]),
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

let capturedGetCodeBlockArgs: any;

vi.mock('@editor/utils/code-block', () => ({
  getCodeBlockFormConfig: vi.fn((args: any) => {
    capturedGetCodeBlockArgs = args;
    return [{ type: 'text', name: 'content' }];
  }),
}));

vi.mock('@tmagic/form', () => ({
  MForm: defineComponent({
    name: 'MForm',
    setup(_, { expose }) {
      expose({ formState: {} });
      return () => h('div', { class: 'fake-mform' });
    },
  }),
}));

const mountHook = (props: any, provideOptions?: Record<string, any>) => {
  let captured: any;
  const comp = defineComponent({
    setup() {
      captured = useCompareForm(props);
      return () => h(MForm as any, { ref: 'form' });
    },
  });
  const wrapper = mount(comp, { global: { provide: provideOptions } });
  return { captured, wrapper };
};

beforeEach(() => {
  vi.clearAllMocks();
  capturedGetCodeBlockArgs = undefined;
});

describe('useCompareForm', () => {
  test('无 services 时 config 为空数组', async () => {
    const { captured } = mountHook({ category: 'node', type: 'text', value: {} });
    await nextTick();
    await nextTick();
    expect(captured.config.value).toEqual([]);
  });

  test('node 类别加载 props 配置并把「样式」tab display 置为 true', async () => {
    const { captured } = mountHook({ category: 'node', type: 'text', value: { id: 'n1' }, services });
    await nextTick();
    await nextTick();
    expect(propsService.getPropsConfig).toHaveBeenCalledWith('text', { node: { id: 'n1' } });
    const tab = captured.config.value.find((i: any) => i.type === 'tab');
    const stylePane = tab.items.find((p: any) => p.title === '样式');
    expect(stylePane.display).toBe(true);
  });

  test('node 类别缺少 type 时返回空配置', async () => {
    const { captured } = mountHook({ category: 'node', value: { id: 'n1' }, services });
    await nextTick();
    await nextTick();
    expect(propsService.getPropsConfig).not.toHaveBeenCalled();
    expect(captured.config.value).toEqual([]);
  });

  test('data-source 类别默认激活 fields tab', async () => {
    const { captured } = mountHook({ category: 'data-source', type: 'http', value: {}, services });
    await nextTick();
    await nextTick();
    expect(dataSourceService.getFormConfig).toHaveBeenCalledWith('http');
    const tab = captured.config.value.find((i: any) => i.type === 'tab');
    expect(tab.active).toBe('fields');
  });

  test('data-source 未传 type 时默认使用 base', async () => {
    mountHook({ category: 'data-source', value: {}, services });
    await nextTick();
    await nextTick();
    expect(dataSourceService.getFormConfig).toHaveBeenCalledWith('base');
  });

  test('code-block 类别归一化 content 并按 dataSourceType 判定是否数据源代码块', async () => {
    const { captured } = mountHook(
      { category: 'code-block', dataSourceType: 'http', value: { content: { toString: () => 'body' } }, services },
      { codeOptions: { theme: 'vs-dark' } },
    );
    await nextTick();
    await nextTick();
    expect(captured.currentValues.value.content).toBe('body');
    expect(capturedGetCodeBlockArgs.editable).toBe(false);
    expect(capturedGetCodeBlockArgs.isDataSource()).toBe(true);
    expect(capturedGetCodeBlockArgs.dataSourceType()).toBe('http');
    expect(capturedGetCodeBlockArgs.codeOptions).toEqual({ theme: 'vs-dark' });
  });

  test('未传 dataSourceType 时 isDataSource 为 false', async () => {
    mountHook({ category: 'code-block', value: { content: 'x' }, services });
    await nextTick();
    await nextTick();
    expect(capturedGetCodeBlockArgs.isDataSource()).toBe(false);
  });

  test('normalizeCodeBlockValue 处理各种输入', () => {
    const { captured } = mountHook({ category: 'node', type: 'text', value: {}, services });
    expect(captured.normalizeCodeBlockValue(undefined)).toEqual({});
    expect(captured.normalizeCodeBlockValue({ content: 'x' })).toEqual({ content: 'x' });
    expect(captured.normalizeCodeBlockValue({ content: { toString: () => 'y' } }).content).toBe('y');
    const bad = {
      content: {
        toString: () => {
          throw new Error('e');
        },
      },
    };
    expect(captured.normalizeCodeBlockValue(bad).content).toBe('');
  });

  test('currentValues 非 code-block 场景直接返回 value', async () => {
    const { captured } = mountHook({ category: 'node', type: 'text', value: { id: 'n1', name: 'a' }, services });
    await nextTick();
    expect(captured.currentValues.value).toEqual({ id: 'n1', name: 'a' });
  });

  test('wrapperStyle 根据 height 生成', () => {
    const { captured } = mountHook({ category: 'node', type: 'text', value: {}, height: '60vh', services });
    expect(captured.wrapperStyle.value).toEqual({ height: '60vh', overflow: 'auto' });
    const { captured: c2 } = mountHook({ category: 'node', type: 'text', value: {}, services });
    expect(c2.wrapperStyle.value).toBeUndefined();
  });

  test('mergedExtendState 优先使用 baseFormState 并调用 extendState', () => {
    const extendState = vi.fn((s: any) => ({ ...s, x: 1 }));
    const base = { a: 1 } as any;
    const { captured } = mountHook({
      category: 'node',
      type: 'text',
      value: {},
      services,
      extendState,
      baseFormState: base,
    });
    const result = captured.mergedExtendState({ b: 2 });
    expect(extendState).toHaveBeenCalledWith(base);
    expect(result).toEqual({ a: 1, x: 1 });
  });

  test('mergedExtendState 无 extendState 时原样返回 state', () => {
    const { captured } = mountHook({ category: 'node', type: 'text', value: {}, services });
    const state = { a: 1 } as any;
    expect(captured.mergedExtendState(state)).toBe(state);
  });

  test('自定义 loadConfig 可接管配置加载并复用 defaultLoadConfig', async () => {
    const loadConfig = vi.fn(async ({ defaultLoadConfig }: any) => {
      await defaultLoadConfig();
      return [{ type: 'text', name: 'custom' }];
    });
    const { captured } = mountHook({ category: 'node', type: 'text', value: { id: 'n1' }, services, loadConfig });
    await nextTick();
    await nextTick();
    await nextTick();
    expect(loadConfig).toHaveBeenCalled();
    expect(propsService.getPropsConfig).toHaveBeenCalled();
    expect(captured.config.value).toEqual([{ type: 'text', name: 'custom' }]);
  });

  test('reload 会重新加载配置', async () => {
    const { captured } = mountHook({ category: 'data-source', type: 'base', value: {}, services });
    await nextTick();
    await nextTick();
    dataSourceService.getFormConfig.mockClear();
    await captured.loadConfig();
    expect(dataSourceService.getFormConfig).toHaveBeenCalled();
  });

  test('formRef.formState 注入 stage / services', async () => {
    const stage = { select: vi.fn() };
    editorService.get.mockReturnValue(stage);
    const { captured } = mountHook({ category: 'node', type: 'text', value: {}, services });
    await nextTick();
    await nextTick();
    expect(editorService.get).toHaveBeenCalledWith('stage');
    expect(captured.formRef.value.formState.services).toBe(services);
    expect(captured.formRef.value.formState.stage).toBe(stage);
  });
});
