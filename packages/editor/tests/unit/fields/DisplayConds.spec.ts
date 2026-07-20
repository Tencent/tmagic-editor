/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import DisplayConds from '@editor/fields/DisplayConds.vue';

const dataSourceService = {
  getDataSourceById: vi.fn(),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ dataSourceService }),
}));

const { fieldTypeMock } = vi.hoisted(() => ({
  fieldTypeMock: vi.fn((_ds: any, names: string[]) => {
    const key = names?.[0];
    if (key === 'numField') return 'number';
    if (key === 'boolField') return 'boolean';
    if (key === 'nullField') return 'null';
    return 'string';
  }),
}));

vi.mock('@editor/utils', async () => {
  const actual = await vi.importActual<any>('@editor/utils');
  return {
    ...actual,
    getCascaderOptionsFromFields: vi.fn(() => [{ label: 'f1', value: 'f1' }]),
    getFieldType: fieldTypeMock,
  };
});

let capturedConfig: any = null;
vi.mock('@tmagic/form', async () => {
  const actual = await vi.importActual<any>('@tmagic/form');
  return {
    ...actual,
    filterFunction: vi.fn((_m: any, v: any) => (typeof v === 'function' ? v() : v)),
    MGroupList: defineComponent({
      name: 'MGroupList',
      props: ['config', 'name', 'disabled', 'model', 'lastValues', 'prop', 'size'],
      emits: ['change'],
      setup(props, { emit }) {
        capturedConfig = props.config;
        return () =>
          h('div', {
            class: 'fake-group-list',
            onClick: () => emit('change', [{ field: ['fa'], op: 'eq', value: 'a' }]),
          });
      },
    }),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  capturedConfig = null;
  dataSourceService.getDataSourceById.mockReturnValue({ fields: [{ name: 'a', type: 'string' }] });
});

describe('DisplayConds', () => {
  test('change 事件初始化数组', async () => {
    const model: any = {};
    const wrapper = mount(DisplayConds, {
      props: { config: { titlePrefix: 't', parentFields: [] }, model, name: 'conds' } as any,
    });
    await wrapper.find('.fake-group-list').trigger('click');
    expect(model.conds).toEqual([]);
    expect(wrapper.emitted('change')).toBeTruthy();
  });

  test('parentFields 不为空时使用 cascader', () => {
    mount(DisplayConds, {
      props: {
        config: { titlePrefix: 't', parentFields: ['ds1'] },
        model: {},
        name: 'conds',
      } as any,
    });
    const item = capturedConfig.items[0].items[0];
    expect(item.type).toBe('cascader');
    expect(item.options()).toEqual([{ label: 'f1', value: 'f1' }]);
  });

  test('parentFields 为空时使用 data-source-field-select', () => {
    mount(DisplayConds, {
      props: {
        config: { titlePrefix: 't', parentFields: [] },
        model: {},
        name: 'conds',
      } as any,
    });
    const item = capturedConfig.items[0].items[0];
    expect(item.type).toBe('data-source-field-select');
  });

  test('field / op 单元格开启 typeMatch（枚举校验下沉到单元格）', () => {
    mount(DisplayConds, {
      props: { config: { titlePrefix: 't', parentFields: ['ds1'] }, model: {}, name: 'conds' } as any,
    });
    const cascaderField = capturedConfig.items[0].items[0];
    const opItem = capturedConfig.items[0].items[1];
    expect(cascaderField.rules).toEqual([
      { required: true, trigger: 'blur', message: '请选择字段' },
      { typeMatch: true, trigger: 'change' },
    ]);
    expect(opItem.type).toBe('cond-op-select');
    expect(opItem.rules).toEqual([
      { required: true, trigger: 'blur', message: '请选择条件' },
      { typeMatch: true, trigger: 'change' },
    ]);

    // parentFields 为空时 field 走 data-source-field-select，同样开启 typeMatch
    capturedConfig = null;
    mount(DisplayConds, {
      props: { config: { titlePrefix: 't', parentFields: [] }, model: {}, name: 'conds' } as any,
    });
    const dsField = capturedConfig.items[0].items[0];
    expect(dsField.type).toBe('data-source-field-select');
    expect(dsField.rules).toEqual([
      { required: true, trigger: 'blur', message: '请选择字段' },
      { typeMatch: true, trigger: 'change' },
    ]);
  });

  test('value 字段类型 - number', () => {
    mount(DisplayConds, {
      props: { config: { titlePrefix: 't', parentFields: ['ds1'] }, model: {}, name: 'conds' } as any,
    });
    const valueItem = capturedConfig.items[0].items[2].items[0];
    expect(valueItem.type(undefined, { model: { field: ['numField'] } })).toBe('number');
    expect(valueItem.type(undefined, { model: { field: ['boolField'] } })).toBe('select');
    expect(valueItem.type(undefined, { model: { field: ['nullField'] } })).toBe('display');
    expect(valueItem.type(undefined, { model: { field: ['anyField'] } })).toBe('text');
  });

  test('value display 函数', () => {
    mount(DisplayConds, {
      props: { config: { titlePrefix: 't', parentFields: [] }, model: {}, name: 'conds' } as any,
    });
    const valueItem = capturedConfig.items[0].items[2].items[0];
    expect(valueItem.display(undefined, { model: { op: 'eq' } })).toBe(true);
    expect(valueItem.display(undefined, { model: { op: 'between' } })).toBe(false);
    expect(valueItem.displayText(undefined, { model: { value: null } })).toBe('null');
    expect(valueItem.displayText(undefined, { model: { value: 'a' } })).toBe('a');
  });

  test('range display 函数', () => {
    mount(DisplayConds, {
      props: { config: { titlePrefix: 't', parentFields: [] }, model: {}, name: 'conds' } as any,
    });
    const rangeItem = capturedConfig.items[0].items[2].items[1];
    expect(rangeItem.display(undefined, { model: { op: 'between' } })).toBe(true);
    expect(rangeItem.display(undefined, { model: { op: 'eq' } })).toBe(false);
  });

  test('field onChange 转换 model.value 类型', () => {
    mount(DisplayConds, {
      props: { config: { titlePrefix: 't', parentFields: ['ds1'] }, model: {}, name: 'conds' } as any,
    });
    const item = capturedConfig.items[0].items[0];
    const m1: any = { value: '5' };
    item.onChange(undefined, ['numField'], { model: m1 });
    expect(m1.value).toBe(5);

    const m2: any = { value: '' };
    item.onChange(undefined, ['boolField'], { model: m2 });
    expect(m2.value).toBe(false);

    const m3: any = { value: 'x' };
    item.onChange(undefined, ['nullField'], { model: m3 });
    expect(m3.value).toBe(null);

    const m4: any = { value: 1 };
    item.onChange(undefined, ['strField'], { model: m4 });
    expect(m4.value).toBe('1');
  });

  test('cascader options 没有 ds 时返回空', () => {
    dataSourceService.getDataSourceById.mockReturnValue(null);
    mount(DisplayConds, {
      props: {
        config: { titlePrefix: 't', parentFields: ['ds1'] },
        model: {},
        name: 'conds',
      } as any,
    });
    const item = capturedConfig.items[0].items[0];
    expect(item.options()).toEqual([]);
  });
});
