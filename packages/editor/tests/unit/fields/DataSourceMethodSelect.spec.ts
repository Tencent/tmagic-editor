/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import DataSourceMethodSelect from '@editor/fields/DataSourceMethodSelect.vue';

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

const uiService = { get: vi.fn(() => [{ $key: 'data-source' }]) };

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ dataSourceService, uiService }),
}));

vi.mock('@editor/utils', async () => {
  const actual = await vi.importActual<any>('@editor/utils');
  return { ...actual, getFieldType: vi.fn(() => 'string') };
});

vi.mock('@editor/type', async () => {
  const actual = await vi.importActual<any>('@editor/type');
  return { ...actual, SideItemKey: { DATA_SOURCE: 'data-source' } };
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

  test('编辑按钮 emit edit-data-source', async () => {
    dataSourceService.getDataSourceById.mockReturnValue({ id: 'ds1', methods: [{ name: 'doFetch' }] });
    const eventBus = { emit: vi.fn() };
    const wrapper = mount(DataSourceMethodSelect, {
      props: baseProps() as any,
      global: { provide: { eventBus } },
    });
    await wrapper.find('button').trigger('click');
    expect(eventBus.emit).toHaveBeenCalledWith('edit-data-source', 'ds1');
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
});
