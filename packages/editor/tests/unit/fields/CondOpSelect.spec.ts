/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import CondOpSelect from '@editor/fields/CondOpSelect.vue';
import { getFieldType } from '@editor/utils';

const dataSourceService = {
  getDataSourceById: vi.fn(),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ dataSourceService }),
}));

vi.mock('@editor/utils', async () => {
  const actual = await vi.importActual<any>('@editor/utils');
  return {
    ...actual,
    getFieldType: vi.fn(),
    arrayOptions: [{ text: 'in', value: 'in' }],
    eqOptions: [{ text: 'eq', value: 'eq' }],
    numberOptions: [{ text: 'gt', value: 'gt' }],
  };
});

vi.mock('@tmagic/design', () => ({
  TMagicSelect: defineComponent({
    name: 'TMagicSelect',
    props: ['modelValue', 'clearable', 'filterable', 'size', 'disabled'],
    emits: ['change'],
    setup(_p, { emit, slots }) {
      return () =>
        h(
          'select',
          {
            onChange: (e: Event) => emit('change', (e.target as HTMLSelectElement).value),
          },
          slots.default?.(),
        );
    },
  }),
  getDesignConfig: vi.fn(() => ({})),
}));

const baseProps = (extra: any = {}) => ({
  config: { type: 'cond-op-select', parentFields: [] },
  name: 'op',
  model: { field: ['ds1', 'a'], op: '' },
  disabled: false,
  size: 'default',
  ...extra,
});

describe('CondOpSelect', () => {
  test('array 类型展示 arrayOptions', () => {
    (getFieldType as any).mockReturnValue('array');
    const wrapper = mount(CondOpSelect, { props: baseProps() as any });
    expect(wrapper.findAll('option, .tmagic-design-option, [label]').length).toBeGreaterThan(0);
  });

  test('boolean/null 类型展示 是/不是', () => {
    (getFieldType as any).mockReturnValue('boolean');
    const wrapper = mount(CondOpSelect, { props: baseProps() as any });
    expect(wrapper.html()).toContain('label="是"');
  });

  test('number 类型 options 包含 eq+number', () => {
    (getFieldType as any).mockReturnValue('number');
    const wrapper = mount(CondOpSelect, { props: baseProps() as any });
    const html = wrapper.html();
    expect(html).toContain('label="eq"');
    expect(html).toContain('label="gt"');
  });

  test('string 类型 options 包含 array+eq', () => {
    (getFieldType as any).mockReturnValue('string');
    const wrapper = mount(CondOpSelect, { props: baseProps() as any });
    const html = wrapper.html();
    expect(html).toContain('label="in"');
    expect(html).toContain('label="eq"');
  });

  test('其他类型展示 array+eq+number', () => {
    (getFieldType as any).mockReturnValue('any');
    const wrapper = mount(CondOpSelect, { props: baseProps() as any });
    const html = wrapper.html();
    expect(html).toContain('label="in"');
    expect(html).toContain('label="eq"');
    expect(html).toContain('label="gt"');
  });

  test('change 事件 emit', async () => {
    (getFieldType as any).mockReturnValue('string');
    const wrapper = mount(CondOpSelect, { props: baseProps() as any });
    await wrapper.findComponent({ name: 'TMagicSelect' }).vm.$emit('change', 'eq');
    expect(wrapper.emitted('change')?.[0]?.[0]).toBe('eq');
  });
});
