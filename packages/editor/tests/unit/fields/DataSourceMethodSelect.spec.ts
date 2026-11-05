/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import DataSourceMethodSelect from '@editor/fields/DataSourceMethodSelect.vue';
import { getFieldType } from '@editor/utils';

const dataSourceService = {
  get: vi.fn(() => [
    {
      id: 'ds1',
      type: 'http',
      title: 'DS1',
      methods: [{ name: 'doFetch', params: [{ name: 'p1', type: 'text' }] }],
    },
  ]),
  getDataSourceById: vi.fn(),
  getFormMethod: vi.fn(() => []),
};

const uiService = { get: vi.fn(() => [{ $key: 'data-source' }]), set: vi.fn() };

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ dataSourceService, uiService }),
}));

vi.mock('@editor/utils', async () => {
  const actual = await vi.importActual<any>('@editor/utils');
  return { ...actual, getFieldType: vi.fn(() => 'string') };
});

vi.mock('@tmagic/utils', async () => {
  const actual = await vi.importActual<any>('@tmagic/utils');
  return { ...actual, DATA_SOURCE_SET_DATA_METHOD_NAME: '__set_data__' };
});

vi.mock('@tmagic/form', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    filterFunction: (_form: any, fn: any, props: any) => (typeof fn === 'function' ? fn(_form, props) : fn),
    createValues: vi.fn(() => ({ p1: '' })),
    MCascader: defineComponent({
      name: 'MCascader',
      props: ['model', 'name', 'size', 'prop', 'config', 'disabled'],
      emits: ['change'],
      setup() {
        return () => h('select', { class: 'fake-cascader' });
      },
    }),
  };
});

vi.mock('@tmagic/design', () => ({
  TMagicButton: defineComponent({
    name: 'TMagicButton',
    props: ['size'],
    emits: ['click'],
    setup(_p, { emit, slots }) {
      return () => h('button', { onClick: () => emit('click') }, slots.default?.());
    },
  }),
  TMagicTooltip: defineComponent({
    name: 'TMagicTooltip',
    props: ['content'],
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-tooltip' }, slots.default?.());
    },
  }),
}));

vi.mock('@editor/components/Icon.vue', () => ({
  default: defineComponent({ name: 'MIcon', props: ['icon'], setup: () => () => h('i') }),
}));

vi.mock('@editor/components/CodeParams.vue', () => ({
  default: defineComponent({
    name: 'CodeParams',
    props: ['name', 'model', 'size', 'disabled', 'paramsConfig'],
    emits: ['change'],
    setup(_p, { emit }) {
      return () =>
        h('div', {
          class: 'fake-params',
          onClick: () => emit('change', null, { changeRecords: [{ propPath: 'p1', value: 'x' }] }),
        });
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  uiService.get.mockReturnValue([{ $key: 'data-source' }]);
  dataSourceService.get.mockReturnValue([
    {
      id: 'ds1',
      type: 'http',
      title: 'DS1',
      methods: [{ name: 'doFetch', params: [{ name: 'p1', type: 'text' }] }],
    },
  ]);
});

const baseProps = (extra: any = {}) => ({
  config: { type: 'data-source-method-select', notEditable: false },
  name: 'dataSourceMethod',
  prop: 'dataSourceMethod',
  model: { dataSourceMethod: ['ds1', 'doFetch'], params: {} },
  size: 'default',
  disabled: false,
  ...extra,
});

describe('DataSourceMethodSelect', () => {
  test('val 为自定义方法时显示编辑按钮', () => {
    dataSourceService.getDataSourceById.mockReturnValue({
      id: 'ds1',
      methods: [{ name: 'doFetch' }],
    });
    const wrapper = mount(DataSourceMethodSelect, { props: baseProps() as any });
    expect(wrapper.find('button').exists()).toBe(true);
  });

  test('val 不是自定义方法时不显示编辑按钮', () => {
    dataSourceService.getDataSourceById.mockReturnValue({ id: 'ds1', methods: [{ name: 'other' }] });
    const wrapper = mount(DataSourceMethodSelect, { props: baseProps() as any });
    expect(wrapper.find('button').exists()).toBe(false);
  });

  test('paramsConfig 不为空时渲染 CodeParams', () => {
    dataSourceService.getDataSourceById.mockReturnValue({ id: 'ds1', methods: [{ name: 'doFetch' }] });
    const wrapper = mount(DataSourceMethodSelect, { props: baseProps() as any });
    expect(wrapper.find('.fake-params').exists()).toBe(true);
  });

  test('onChangeHandler emit change 包含 changeRecords', async () => {
    dataSourceService.getDataSourceById.mockReturnValue({ id: 'ds1', methods: [] });
    const wrapper = mount(DataSourceMethodSelect, { props: baseProps() as any });
    await wrapper.findComponent({ name: 'MCascader' }).vm.$emit('change', ['ds1', 'doFetch']);
    const evts = wrapper.emitted('change');
    expect((evts?.[0]?.[1] as any).changeRecords.length).toBe(2);
  });

  test('CodeParams change 调整 propPath 后 emit', async () => {
    dataSourceService.getDataSourceById.mockReturnValue({ id: 'ds1', methods: [{ name: 'doFetch' }] });
    const wrapper = mount(DataSourceMethodSelect, { props: baseProps() as any });
    await wrapper.find('.fake-params').trigger('click');
    const evts = wrapper.emitted('change');
    expect(evts).toBeTruthy();
  });

  test('编辑按钮 emit edit-data-source-method 并切换到数据源 tab', async () => {
    dataSourceService.getDataSourceById.mockReturnValue({ id: 'ds1', methods: [{ name: 'doFetch' }] });
    const eventBus = { emit: vi.fn() };
    const wrapper = mount(DataSourceMethodSelect, {
      props: baseProps() as any,
      global: { provide: { eventBus } },
    });
    await wrapper.find('button').trigger('click');
    expect(uiService.set).toHaveBeenCalledWith('sideBarActiveTabName', 'data-source');
    expect(eventBus.emit).toHaveBeenCalledWith('edit-data-source-method', 'ds1', 'doFetch');
  });

  test('编辑按钮: 找不到 dataSource 时不触发', async () => {
    dataSourceService.getDataSourceById.mockImplementation(() => {
      // First call (isCustomMethod) returns the source so the button renders;
      // subsequent call (editCodeHandler) returns null to ensure early return.
      const fn = dataSourceService.getDataSourceById as any;
      if (fn.mock.calls.length === 1) return { id: 'ds1', methods: [{ name: 'doFetch' }] };
      return null;
    });
    const eventBus = { emit: vi.fn() };
    const wrapper = mount(DataSourceMethodSelect, {
      props: baseProps() as any,
      global: { provide: { eventBus } },
    });
    await wrapper.find('button').trigger('click');
    expect(eventBus.emit).not.toHaveBeenCalled();
  });

  test('cascaderConfig.options 包含数据源', () => {
    dataSourceService.getDataSourceById.mockReturnValue({ id: 'ds1', methods: [{ name: 'doFetch' }] });
    const wrapper = mount(DataSourceMethodSelect, { props: baseProps() as any });
    const cascader = wrapper.findComponent({ name: 'MCascader' });
    const { options } = cascader.props('config') as any;
    expect(options.length).toBe(1);
    expect(options[0].value).toBe('ds1');
    expect(options[0].children.length).toBeGreaterThanOrEqual(2);
  });

  test('设置数据方法返回特殊 paramsConfig', () => {
    dataSourceService.getDataSourceById.mockReturnValue({ id: 'ds1', methods: [{ name: '__set_data__' }] });
    const wrapper = mount(DataSourceMethodSelect, {
      props: baseProps({ model: { dataSourceMethod: ['ds1', '__set_data__'], params: {} } }) as any,
    });
    expect(wrapper.find('.fake-params').exists()).toBe(true);
  });

  test('切换同类型节点后参数字段按新节点的方法重建，不残留旧节点的参数配置', async () => {
    dataSourceService.get.mockReturnValue([
      {
        id: 'ds1',
        type: 'http',
        title: 'DS1',
        methods: [
          { name: 'doFetch', params: [{ name: 'p1', type: 'text' }] },
          { name: 'doSave', params: [{ name: 'p2', type: 'number' }] },
        ],
      },
    ]);
    dataSourceService.getDataSourceById.mockReturnValue({ id: 'ds1', methods: [] });

    const wrapper = mount(DataSourceMethodSelect, {
      props: baseProps({ model: { dataSourceMethod: ['ds1', 'doFetch'], params: {} } }) as any,
    });
    const params = () => wrapper.findComponent({ name: 'CodeParams' }).props('paramsConfig') as any[];
    expect(params()[0].name).toBe('p1');

    // 属性面板复用同一个字段实例，只把 model 换成另一个节点的事件动作
    await wrapper.setProps({ model: { dataSourceMethod: ['ds1', 'doSave'], params: {} } });

    expect(params()[0].name).toBe('p2');
  });

  test('设置数据方法的 data 参数按数据源字段类型切换控件', () => {
    dataSourceService.getDataSourceById.mockReturnValue({ id: 'ds1', methods: [{ name: '__set_data__' }] });
    const wrapper = mount(DataSourceMethodSelect, {
      props: baseProps({ model: { dataSourceMethod: ['ds1', '__set_data__'], params: {} } }) as any,
    });
    const params = wrapper.findComponent({ name: 'CodeParams' }).props('paramsConfig') as any[];
    const dataConfig = params.find((item) => item.name === 'data');

    vi.mocked(getFieldType)
      .mockReturnValueOnce('number')
      .mockReturnValueOnce('string')
      .mockReturnValueOnce('boolean')
      .mockReturnValueOnce('unknown');

    expect(dataConfig.type(null, { model: { field: 'f1' } })).toBe('number');
    expect(dataConfig.type(null, { model: { field: 'f1' } })).toBe('text');
    expect(dataConfig.type(null, { model: { field: 'f1' } })).toBe('switch');
    expect(dataConfig.type(null, { model: { field: 'f1' } })).toBe('vs-code');
  });
});
