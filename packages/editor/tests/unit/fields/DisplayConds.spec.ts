/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import DisplayConds from '@editor/fields/DisplayConds.vue';

// 表单配置由 fields/configs/displayConds.ts 产出（组件与无渲染校验的嵌套配置共用），
// 那里直接用服务单例，因此这里 mock 服务模块本身
const { dataSourceService } = vi.hoisted(() => ({
  dataSourceService: { getDataSourceById: vi.fn() },
}));

vi.mock('@editor/services/dataSource', () => ({ default: dataSourceService }));

const { fieldTypeMock } = vi.hoisted(() => ({
  fieldTypeMock: vi.fn((_ds: any, names: string[]) => {
    const key = names?.[0];
    if (key === 'numField') return 'number';
    if (key === 'boolField') return 'boolean';
    if (key === 'nullField') return 'null';
    return 'string';
  }),
}));

vi.mock('@editor/utils/data-source', async () => {
  const actual = await vi.importActual<any>('@editor/utils/data-source');
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
      props: ['config', 'name', 'disabled', 'model', 'lastValues', 'isCompare', 'prop', 'size'],
      emits: ['change'],
      setup(props, { emit }) {
        capturedConfig = props.config;
        return () =>
          h(
            'div',
            {
              class: 'fake-group-list m-fields-group-list',
              onClick: () => emit('change', [{ field: ['fa'], op: 'eq', value: 'a' }]),
            },
            [h('div', { class: 'group-item m-fields-group-list-item' })],
          );
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
  test('change 事件向上抛出', async () => {
    const wrapper = mount(DisplayConds, {
      props: { config: { titlePrefix: 't', parentFields: [] }, model: { conds: [] }, name: 'conds' } as any,
    });
    await wrapper.find('.fake-group-list').trigger('click');
    expect(wrapper.emitted('change')?.[0]?.[0]).toEqual([{ field: ['fa'], op: 'eq', value: 'a' }]);
  });

  test('外层与内层 cond 都使用 groupList；外层吸底新增由 group-list 接管', () => {
    const wrapper = mount(DisplayConds, {
      props: { config: { titlePrefix: '条件组', parentFields: [] }, model: { conds: [] }, name: 'conds' } as any,
    });
    expect(capturedConfig.type).toBe('groupList');
    expect(capturedConfig.defaultAdd).toEqual({ cond: [] });
    expect(capturedConfig.scrollLastItemIntoView).toBe(true);
    expect(capturedConfig.addButtonConfig.sticky).toBe(true);
    expect(capturedConfig.addButtonConfig.text).toBe('新增条件组');
    expect(capturedConfig.items[0].type).toBe('groupList');
    expect(capturedConfig.items[0].name).toBe('cond');
    expect(capturedConfig.items[0].titlePrefix).toBe('条件');
    expect(capturedConfig.items[0].copyable).toBe(true);
    expect(capturedConfig.items[0].movable).toBe(false);
    expect(capturedConfig.items[0].flat).toBe(true);
    expect(capturedConfig.items[0].scrollLastItemIntoView).toBe(true);
    expect(capturedConfig.items[0].addButtonConfig.sticky).toBe(true);
    expect(capturedConfig.items[0].addButtonConfig.text).toBe('新增条件');
    expect(capturedConfig.items[0].items.every((item: any) => item.span === undefined)).toBe(true);
    expect(wrapper.findComponent({ name: 'MGroupList' }).exists()).toBe(true);
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
    const valueItem = capturedConfig.items[0].items[2];
    expect(valueItem.type(undefined, { model: { field: ['numField'] } })).toBe('number');
    expect(valueItem.type(undefined, { model: { field: ['boolField'] } })).toBe('select');
    expect(valueItem.type(undefined, { model: { field: ['nullField'] } })).toBe('display');
    expect(valueItem.type(undefined, { model: { field: ['anyField'] } })).toBe('text');
  });

  test('value display 函数', () => {
    mount(DisplayConds, {
      props: { config: { titlePrefix: 't', parentFields: [] }, model: {}, name: 'conds' } as any,
    });
    const valueItem = capturedConfig.items[0].items[2];
    expect(valueItem.display(undefined, { model: { op: 'eq' } })).toBe(true);
    expect(valueItem.display(undefined, { model: { op: 'between' } })).toBe(false);
    expect(valueItem.displayText(undefined, { model: { value: null } })).toBe('null');
    expect(valueItem.displayText(undefined, { model: { value: 'a' } })).toBe('a');
  });

  test('range display 函数', () => {
    mount(DisplayConds, {
      props: { config: { titlePrefix: 't', parentFields: [] }, model: {}, name: 'conds' } as any,
    });
    const rangeItem = capturedConfig.items[0].items[3];
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

  test('isCompare 但无 lastValues 时不进入对比', () => {
    const wrapper = mount(DisplayConds, {
      props: {
        config: { titlePrefix: '条件组', parentFields: [] },
        model: { conds: [] },
        name: 'conds',
        isCompare: true,
      } as any,
    });
    expect(wrapper.findComponent({ name: 'MGroupList' }).props('isCompare')).toBe(false);
  });

  test('外层 defaultAdd 为默认条件组', () => {
    mount(DisplayConds, {
      props: {
        config: { titlePrefix: '条件组', parentFields: [] },
        model: { conds: [{ cond: [] }] },
        name: 'conds',
      } as any,
    });
    expect(capturedConfig.defaultAdd).toEqual({ cond: [] });
    expect(capturedConfig.addButtonConfig.text).toBe('新增条件组');
  });

  test('对比模式向内部透传 isCompare', () => {
    const lastValues = { conds: [{ cond: [] }] };
    const wrapper = mount(DisplayConds, {
      props: {
        config: { titlePrefix: '条件组', parentFields: [] },
        model: { conds: [{ cond: [] }] },
        name: 'conds',
        isCompare: true,
        lastValues,
      } as any,
    });
    expect(wrapper.findComponent({ name: 'MGroupList' }).props('isCompare')).toBe(true);
  });
});
