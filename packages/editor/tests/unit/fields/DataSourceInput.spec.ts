/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import DataSourceInput from '@editor/fields/DataSourceInput.vue';

const { inputRef, acFocus, lastFetchSuggestions } = vi.hoisted(() => {
  const inputRefState = { input: null as any };
  return {
    inputRef: inputRefState,
    acFocus: vi.fn(),
    lastFetchSuggestions: { value: null as any },
  };
});

const dataSourceService = {
  get: vi.fn(),
};
const propsService = {
  getDisabledDataSource: vi.fn(),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ dataSourceService, propsService }),
}));

vi.mock('@editor/utils/data-source', () => ({
  getDisplayField: vi.fn((_dss: any, value: string) => {
    if (!value) return [];
    return [{ value, type: 'text' }];
  }),
}));

vi.mock('@editor/components/Icon.vue', () => ({
  default: defineComponent({ name: 'IconStub', setup: () => () => h('i') }),
}));

vi.mock('@tmagic/design', async () => {
  const vueMod: any = await vi.importActual('vue');
  const { defineComponent: dc, h: hh } = vueMod;
  const ac = dc({
    name: 'FakeAutocomplete',
    props: ['fetchSuggestions', 'triggerOnFocus', 'clearable', 'disabled', 'size', 'modelValue'],
    emits: ['blur', 'input', 'select', 'update:modelValue'],
    setup(props: any, { emit, expose, slots }: any) {
      expose({
        focus: acFocus,
        inputRef,
      });
      lastFetchSuggestions.value = props.fetchSuggestions;
      return () => {
        lastFetchSuggestions.value = props.fetchSuggestions;
        return hh('div', { class: 'fake-autocomplete' }, [
          hh('input', {
            class: 'fake-input',
            onBlur: () => emit('blur'),
            onInput: (e: any) => emit('input', e.target.value),
          }),
          hh('button', {
            class: 'select-btn',
            onClick: () => emit('select', { value: 'ds1', type: 'dataSource' }),
          }),
          hh('button', {
            class: 'select-field-btn',
            onClick: () => emit('select', { value: 'a', type: 'field' }),
          }),
          // 模拟部分实现会以 undefined 触发默认插槽参数
          slots.default?.(),
          slots.suffix?.(),
        ]);
      };
    },
  });
  return {
    TMagicInput: dc({
      name: 'TMagicInput',
      props: ['modelValue', 'disabled', 'size', 'clearable'],
      emits: ['change', 'update:modelValue'],
      setup(_p: any, { emit }: any) {
        return () =>
          hh('input', {
            class: 'fake-tmagic-input',
            onChange: (e: any) => emit('change', e.target.value),
          });
      },
    }),
    TMagicAutocomplete: ac,
    TMagicTag: dc({
      name: 'TMagicTag',
      setup(_p: any, { slots }: any) {
        return () => hh('span', { class: 'fake-tag' }, slots.default?.());
      },
    }),
    getDesignConfig: vi.fn((k: string) => {
      if (k === 'adapterType') return 'element-plus';
      if (k === 'components') {
        return {
          autocomplete: {
            component: ac,
            props: (p: any) => p,
          },
        };
      }
      return undefined;
    }),
  };
});

vi.mock('@tmagic/utils', async () => {
  const actual = await vi.importActual<any>('@tmagic/utils');
  return {
    ...actual,
    getKeysArray: vi.fn((s: string) => s.split('.').filter(Boolean)),
    isNumber: (v: any) => /^\d+$/.test(String(v)),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  inputRef.input = null;
  lastFetchSuggestions.value = null;
  dataSourceService.get.mockReturnValue([
    { id: 'ds1', title: 'DS1', fields: [{ name: 'a', title: 'A' }] },
    { id: 'ds2', title: 'DS2', fields: [] },
  ]);
  propsService.getDisabledDataSource.mockReturnValue(false);
});

const triggerSearch = (q: string) =>
  new Promise<any[]>((resolve) => {
    lastFetchSuggestions.value?.(q, resolve);
  });

const mountIt = (modelValue = '', disabled = false) =>
  mount(DataSourceInput, {
    props: {
      config: {},
      model: { v: modelValue },
      name: 'v',
      disabled,
      size: 'default',
    } as any,
  });

describe('DataSourceInput', () => {
  test('disabledDataSource 时只渲染 TMagicInput', () => {
    propsService.getDisabledDataSource.mockReturnValue(true);
    const wrapper = mountIt();
    expect(wrapper.find('.fake-tmagic-input').exists()).toBe(true);
  });

  test('disabledDataSource 时 change 触发 emit', async () => {
    propsService.getDisabledDataSource.mockReturnValue(true);
    const wrapper = mountIt();
    await wrapper.find('.fake-tmagic-input').trigger('change');
    expect(wrapper.emitted('change')).toBeTruthy();
  });

  test('禁用时直接渲染 autocomplete', () => {
    const wrapper = mountIt('text-value', true);
    expect(wrapper.find('.fake-autocomplete').exists()).toBe(true);
  });

  test('autocomplete 默认插槽参数为 undefined 时不应报错', () => {
    expect(() => mountIt('text-value', true)).not.toThrow();
  });

  test('未 focus 时显示文本视图', () => {
    const wrapper = mountIt('hello');
    expect(wrapper.find('.tmagic-data-source-input-text').exists()).toBe(true);
  });

  test('mouseup 触发 isFocused -> 显示 autocomplete', async () => {
    const wrapper = mountIt('hello');
    await wrapper.find('.tmagic-data-source-input-text').trigger('mouseup');
    await nextTick();
    expect(wrapper.find('.fake-autocomplete').exists()).toBe(true);
    expect(acFocus).toHaveBeenCalled();
  });

  test('blur 触发 change emit', async () => {
    const wrapper = mountIt('hello');
    await wrapper.find('.tmagic-data-source-input-text').trigger('mouseup');
    await nextTick();
    await wrapper.find('.fake-input').trigger('blur');
    expect(wrapper.emitted('change')).toBeTruthy();
  });

  test('select 数据源时拼接 ${id}', async () => {
    inputRef.input = { selectionStart: 2, setSelectionRange: vi.fn() };
    const wrapper = mountIt('${');
    await wrapper.find('.tmagic-data-source-input-text').trigger('mouseup');
    await nextTick();
    await wrapper.find('.select-btn').trigger('click');
    await nextTick();
    expect(wrapper.emitted('change')).toBeTruthy();
  });

  test('select 字段时拼接', async () => {
    inputRef.input = { selectionStart: 5, setSelectionRange: vi.fn() };
    const wrapper = mountIt('${ds1.');
    await wrapper.find('.tmagic-data-source-input-text').trigger('mouseup');
    await nextTick();
    await wrapper.find('.select-field-btn').trigger('click');
    await nextTick();
    expect(wrapper.emitted('change')).toBeTruthy();
  });

  test('querySearch 输入 ${ 时返回所有数据源', async () => {
    inputRef.input = { selectionStart: 2, setSelectionRange: vi.fn() };
    const wrapper = mountIt('hello');
    await wrapper.find('.tmagic-data-source-input-text').trigger('mouseup');
    await nextTick();
    const result = await triggerSearch('${');
    expect(result.length).toBe(2);
    expect(result[0].value).toBe('ds1');
  });

  test('querySearch 输入 ${ds 时按名字过滤数据源', async () => {
    inputRef.input = { selectionStart: 4, setSelectionRange: vi.fn() };
    const wrapper = mountIt('hello');
    await wrapper.find('.tmagic-data-source-input-text').trigger('mouseup');
    await nextTick();
    const result = await triggerSearch('${ds');
    expect(result.length).toBe(2);
  });

  test('querySearch 输入 ${ds1. 时返回字段', async () => {
    inputRef.input = { selectionStart: 6, setSelectionRange: vi.fn() };
    const wrapper = mountIt('hello');
    await wrapper.find('.tmagic-data-source-input-text').trigger('mouseup');
    await nextTick();
    const result = await triggerSearch('${ds1.');
    expect(result.length).toBe(1);
    expect(result[0].value).toBe('a');
  });

  test('querySearch 输入 ${ds1.a 时按字段名过滤', async () => {
    inputRef.input = { selectionStart: 7, setSelectionRange: vi.fn() };
    const wrapper = mountIt('hello');
    await wrapper.find('.tmagic-data-source-input-text').trigger('mouseup');
    await nextTick();
    const result = await triggerSearch('${ds1.a');
    expect(result.length).toBe(1);
  });

  test('querySearch 输入未知数据源时返回空字段', async () => {
    inputRef.input = { selectionStart: 7, setSelectionRange: vi.fn() };
    const wrapper = mountIt('hello');
    await wrapper.find('.tmagic-data-source-input-text').trigger('mouseup');
    await nextTick();
    const result = await triggerSearch('${none.');
    expect(result.length).toBe(0);
  });

  test('inputHandler 清空 inputText', async () => {
    inputRef.input = { selectionStart: 0, setSelectionRange: vi.fn() };
    const wrapper = mountIt('aa');
    await wrapper.find('.tmagic-data-source-input-text').trigger('mouseup');
    await nextTick();
    const input = wrapper.find('.fake-input');
    (input.element as HTMLInputElement).value = '';
    await input.trigger('input');
  });

  test('select dataSource 不在 ${ 之后时调整 startText', async () => {
    inputRef.input = { selectionStart: 5, setSelectionRange: vi.fn() };
    const wrapper = mountIt('hello');
    await wrapper.find('.tmagic-data-source-input-text').trigger('mouseup');
    await nextTick();
    await wrapper.find('.select-btn').trigger('click');
    await nextTick();
    expect(wrapper.emitted('change')).toBeTruthy();
  });
});
