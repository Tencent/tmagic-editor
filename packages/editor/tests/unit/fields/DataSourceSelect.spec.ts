/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import DataSourceSelect from '@editor/fields/DataSourceSelect.vue';

const dataSourceService = {
  get: vi.fn(() => []),
  getDataSourceById: vi.fn(),
};
const uiService = {
  get: vi.fn(() => [{ $key: 'data-source' }]),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ dataSourceService, uiService }),
}));

vi.mock('@editor/type', async () => {
  const actual = await vi.importActual<any>('@editor/type');
  return { ...actual, SideItemKey: { DATA_SOURCE: 'data-source' } };
});

vi.mock('@tmagic/form', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    filterFunction: (_form: any, fn: any, props: any) => (typeof fn === 'function' ? fn(_form, props) : fn),
    MSelect: defineComponent({
      name: 'MSelect',
      props: ['model', 'name', 'size', 'prop', 'disabled', 'config', 'lastValues'],
      emits: ['change'],
      setup(_p, { emit }) {
        return () =>
          h('select', {
            class: 'fake-select',
            onChange: (e: Event) => emit('change', (e.target as HTMLSelectElement).value),
          });
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

beforeEach(() => {
  vi.clearAllMocks();
  uiService.get.mockReturnValue([{ $key: 'data-source' }]);
  dataSourceService.get.mockReturnValue([
    { id: '1', type: 'http', title: 'A' },
    { id: '2', type: 'base', title: 'B' },
  ]);
});

const baseProps = (extra: any = {}) => ({
  config: { type: 'data-source-select', value: 'id', notEditable: false },
  name: 'ds',
  prop: 'ds',
  model: { ds: '' },
  size: 'default',
  ...extra,
});

describe('DataSourceSelect', () => {
  test('val 为空时不显示编辑按钮', () => {
    const wrapper = mount(DataSourceSelect, { props: baseProps() as any });
    expect(wrapper.find('button').exists()).toBe(false);
  });

  test('val 存在时显示编辑按钮', () => {
    const wrapper = mount(DataSourceSelect, { props: baseProps({ model: { ds: '1' } }) as any });
    expect(wrapper.find('button').exists()).toBe(true);
  });

  test('change 事件 emit', async () => {
    const wrapper = mount(DataSourceSelect, { props: baseProps() as any });
    await wrapper.findComponent({ name: 'MSelect' }).vm.$emit('change', '1');
    expect(wrapper.emitted('change')?.[0]?.[0]).toBe('1');
  });

  test('selectConfig 根据 dataSourceType 过滤', () => {
    const wrapper = mount(DataSourceSelect, {
      props: baseProps({ config: { type: 'data-source-select', value: 'id', dataSourceType: 'http' } }) as any,
    });
    const select = wrapper.findComponent({ name: 'MSelect' });
    expect((select.props('config') as any).options.length).toBe(1);
    expect((select.props('config') as any).options[0].value).toBe('1');
  });

  test('selectConfig value=object 时返回对象结构', () => {
    const wrapper = mount(DataSourceSelect, {
      props: baseProps({ config: { type: 'data-source-select', value: 'object' } }) as any,
    });
    const select = wrapper.findComponent({ name: 'MSelect' });
    expect((select.props('config') as any).options[0].value).toEqual({
      isBindDataSource: true,
      dataSourceType: 'http',
      dataSourceId: '1',
    });
  });

  test('editHandler emit edit-data-source', async () => {
    const eventBus = { emit: vi.fn() };
    dataSourceService.getDataSourceById.mockReturnValue({ id: '1' });
    const wrapper = mount(DataSourceSelect, {
      props: baseProps({ model: { ds: '1' } }) as any,
      global: { provide: { eventBus } },
    });
    await wrapper.find('button').trigger('click');
    expect(eventBus.emit).toHaveBeenCalledWith('edit-data-source', '1');
  });

  test('editHandler value=object 时使用 dataSourceId', async () => {
    const eventBus = { emit: vi.fn() };
    dataSourceService.getDataSourceById.mockReturnValue({ id: '1' });
    const wrapper = mount(DataSourceSelect, {
      props: baseProps({ model: { ds: { dataSourceId: '1' } } }) as any,
      global: { provide: { eventBus } },
    });
    await wrapper.find('button').trigger('click');
    expect(eventBus.emit).toHaveBeenCalledWith('edit-data-source', '1');
  });

  test('editHandler 找不到 dataSource 时不触发', async () => {
    const eventBus = { emit: vi.fn() };
    dataSourceService.getDataSourceById.mockReturnValue(null);
    const wrapper = mount(DataSourceSelect, {
      props: baseProps({ model: { ds: '1' } }) as any,
      global: { provide: { eventBus } },
    });
    await wrapper.find('button').trigger('click');
    expect(eventBus.emit).not.toHaveBeenCalled();
  });

  test('未启用 dataSource 侧边栏时不显示编辑按钮', () => {
    uiService.get.mockReturnValue([]);
    const wrapper = mount(DataSourceSelect, { props: baseProps({ model: { ds: '1' } }) as any });
    expect(wrapper.find('button').exists()).toBe(false);
  });
});
