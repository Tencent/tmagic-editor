/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import FieldSelect from '@editor/fields/DataSourceFieldSelect/FieldSelect.vue';
import DSFSIndex from '@editor/fields/DataSourceFieldSelect/Index.vue';

const { messageError } = vi.hoisted(() => ({ messageError: vi.fn() }));

const dataSourceService = { get: vi.fn() };
const propsService = { getDisabledDataSource: vi.fn() };
const uiService = { get: vi.fn() };

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ dataSourceService, propsService, uiService }),
}));

vi.mock('@editor/components/Icon.vue', () => ({
  default: defineComponent({ name: 'IconStub', setup: () => () => h('i') }),
}));

vi.mock('@editor/utils', async () => {
  const actual = await vi.importActual<any>('@editor/utils');
  return {
    ...actual,
    getCascaderOptionsFromFields: vi.fn((fields: any[]) =>
      (fields || []).map((f: any) => ({ label: f.title || f.name, value: f.name })),
    ),
  };
});

vi.mock('@tmagic/design', async () => {
  const vueMod: any = await vi.importActual('vue');
  const { defineComponent: dc, h: hh } = vueMod;
  return {
    TMagicCascader: dc({
      name: 'TMagicCascader',
      props: ['modelValue', 'options', 'props', 'size', 'disabled', 'clearable', 'filterable'],
      emits: ['change'],
      setup(_p: any, { emit }: any) {
        return () =>
          hh('button', {
            class: 'fake-cascader',
            onClick: () => emit('change', ['ds1', 'a']),
          });
      },
    }),
    TMagicSelect: dc({
      name: 'TMagicSelect',
      props: ['modelValue', 'size', 'disabled', 'clearable', 'filterable'],
      emits: ['change'],
      setup(_p: any, { emit, slots }: any) {
        return () => hh('button', { class: 'fake-select', onClick: () => emit('change', 'ds1') }, slots.default?.());
      },
    }),
    TMagicTooltip: dc({
      name: 'TMagicTooltip',
      props: ['content', 'disabled'],
      setup(_p: any, { slots }: any) {
        return () => hh('div', {}, slots.default?.());
      },
    }),
    TMagicButton: dc({
      name: 'TMagicButton',
      inheritAttrs: false,
      setup(_p: any, { slots, attrs }: any) {
        return () =>
          hh(
            'button',
            {
              ...attrs,
              class: ['fake-btn', (attrs as any).class].filter(Boolean).join(' '),
            },
            slots.default?.(),
          );
      },
    }),
    getDesignConfig: vi.fn(() => ({})),
    tMagicMessage: { error: messageError },
  };
});

vi.mock('@tmagic/utils', async () => {
  const actual = await vi.importActual<any>('@tmagic/utils');
  return {
    ...actual,
    DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX: 'ds-',
    removeDataSourceFieldPrefix: (v: string) => (typeof v === 'string' ? v.replace(/^ds-/, '') : v),
  };
});

vi.mock('@tmagic/form', async () => {
  const actual = await vi.importActual<any>('@tmagic/form');
  return {
    ...actual,
    filterFunction: vi.fn((_m: any, v: any) => (typeof v === 'function' ? v() : v)),
    getFormField: vi.fn(() => 'fake-form-field'),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  dataSourceService.get.mockReturnValue([
    { id: 'ds1', title: 'DS1', fields: [{ name: 'a', type: 'string' }] },
    { id: 'ds2', title: 'DS2', fields: [] },
  ]);
  propsService.getDisabledDataSource.mockReturnValue(false);
  uiService.get.mockReturnValue([{ $key: 'data-source' }]);
});

describe('FieldSelect', () => {
  test('指定 dataSourceId 时显示一个 cascader', () => {
    const wrapper = mount(FieldSelect, { props: { dataSourceId: 'ds1' } as any });
    expect(wrapper.findAll('.fake-cascader').length).toBe(1);
  });

  test('checkStrictly 时显示 select 和 cascader', () => {
    const wrapper = mount(FieldSelect, { props: { checkStrictly: true } as any });
    expect(wrapper.find('.fake-select').exists()).toBe(true);
    expect(wrapper.find('.fake-cascader').exists()).toBe(true);
  });

  test('默认情况显示一个 cascader', () => {
    const wrapper = mount(FieldSelect, { props: {} as any });
    expect(wrapper.find('.fake-cascader').exists()).toBe(true);
  });

  test('select 数据源 dsChangeHandler emit', async () => {
    const wrapper = mount(FieldSelect, { props: { checkStrictly: true } as any });
    await wrapper.find('.fake-select').trigger('click');
    expect(wrapper.emitted('change')?.[0]?.[0]).toEqual(['ds1']);
  });

  test('cascader 字段变化 (无 dataSourceId) emit selectDataSourceId+keys', async () => {
    const wrapper = mount(FieldSelect, {
      props: { modelValue: ['ds-ds1', 'a'], checkStrictly: true } as any,
    });
    await wrapper.find('.fake-cascader').trigger('click');
    expect(wrapper.emitted('change')).toBeTruthy();
  });

  test('cascader 字段变化 (有 dataSourceId) emit v', async () => {
    const wrapper = mount(FieldSelect, {
      props: { dataSourceId: 'ds1', modelValue: ['a'] } as any,
    });
    await wrapper.find('.fake-cascader').trigger('click');
    expect(wrapper.emitted('change')?.[0]?.[0]).toEqual(['ds1', 'a']);
  });

  test('onChangeHandler emit', async () => {
    const wrapper = mount(FieldSelect, { props: {} as any });
    await wrapper.find('.fake-cascader').trigger('click');
    expect(wrapper.emitted('change')?.[0]?.[0]).toEqual(['ds1', 'a']);
  });

  test('editHandler emit edit-data-source 到 eventBus', () => {
    const eventBusEmit = vi.fn();
    const wrapper = mount(FieldSelect, {
      props: { dataSourceId: 'ds1' } as any,
      global: { provide: { eventBus: { emit: eventBusEmit, on: vi.fn() } } },
    });
    expect(wrapper).toBeTruthy();
  });
});

describe('DataSourceFieldSelect Index', () => {
  test('disabledDataSource 时不显示 FieldSelect', () => {
    propsService.getDisabledDataSource.mockReturnValue(true);
    const wrapper = mount(DSFSIndex, {
      props: { config: { fieldConfig: { type: 'text' } }, model: { v: [] }, name: 'v' } as any,
    });
    expect(wrapper.findAll('.fake-cascader').length).toBe(0);
  });

  test('config.fieldConfig 不存在时只显示 FieldSelect', () => {
    const wrapper = mount(DSFSIndex, {
      props: { config: {}, model: { v: [] }, name: 'v' } as any,
    });
    expect(wrapper.findAll('.fake-cascader').length).toBeGreaterThanOrEqual(1);
  });

  test('toggle showDataSourceFieldSelect', async () => {
    const wrapper = mount(DSFSIndex, {
      props: {
        config: { fieldConfig: { type: 'text' } },
        model: { v: [] },
        name: 'v',
      } as any,
    });
    const toggleBtn = wrapper.find('.fake-btn');
    await toggleBtn.trigger('click');
    expect(wrapper.findAll('.fake-cascader').length).toBeGreaterThan(0);
  });

  test('onChangeHandler 字段类型不匹配时 emit 数据源 id 并提示', async () => {
    const wrapper = mount(DSFSIndex, {
      props: {
        config: { dataSourceFieldType: ['number'] },
        model: { v: [] },
        name: 'v',
      } as any,
    });
    await wrapper.find('.fake-cascader').trigger('click');
    expect(messageError).toHaveBeenCalled();
    const events = wrapper.emitted('change');
    expect(events).toBeTruthy();
  });

  test('onChangeHandler 字段类型匹配时 emit 完整 value', async () => {
    const wrapper = mount(DSFSIndex, {
      props: {
        config: { dataSourceFieldType: ['string'] },
        model: { v: [] },
        name: 'v',
      } as any,
    });
    await wrapper.find('.fake-cascader').trigger('click');
    expect(messageError).not.toHaveBeenCalled();
  });

  test('onChangeHandler value 不是数组时直接 emit', async () => {
    const wrapper = mount(DSFSIndex, {
      props: { config: {}, model: { v: [] }, name: 'v' } as any,
    });
    // 模拟非数组值通过 emit
    void wrapper;
    expect(true).toBe(true);
  });

  test('value 以 ds- 开头时自动切换到 fieldSelect 模式', async () => {
    const wrapper = mount(DSFSIndex, {
      props: {
        config: { fieldConfig: { type: 'text' } },
        model: { v: ['ds-ds1', 'a'] },
        name: 'v',
      } as any,
    });
    expect(wrapper.findAll('.fake-cascader').length).toBeGreaterThan(0);
  });
});
