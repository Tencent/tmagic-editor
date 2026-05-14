/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import CodeSelectCol from '@editor/fields/CodeSelectCol.vue';

const codeBlockService = {
  getCodeDsl: vi.fn(() => ({
    c1: { name: 'C1', params: [{ name: 'p1', type: 'text' }] },
    c2: { name: 'C2', params: [] },
  })),
};
const uiService = {
  get: vi.fn(() => [{ $key: 'code-block' }]),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ codeBlockService, uiService }),
}));

vi.mock('@editor/type', async () => {
  const actual = await vi.importActual<any>('@editor/type');
  return { ...actual, SideItemKey: { CODE_BLOCK: 'code-block' } };
});

vi.mock('@tmagic/form', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    filterFunction: (_form: any, fn: any, props: any) => (typeof fn === 'function' ? fn(_form, props) : fn),
    createValues: vi.fn(() => ({ p1: '' })),
    MSelect: defineComponent({
      name: 'MSelect',
      props: ['model', 'name', 'size', 'prop', 'config'],
      emits: ['change'],
      setup() {
        return () => h('select', { class: 'fake-select' });
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
  codeBlockService.getCodeDsl.mockReturnValue({
    c1: { name: 'C1', params: [{ name: 'p1', type: 'text' }] },
    c2: { name: 'C2', params: [] },
  });
  uiService.get.mockReturnValue([{ $key: 'code-block' }]);
});

const baseProps = (extra: any = {}) => ({
  config: { type: 'code-select-col', notEditable: false },
  name: 'codeId',
  prop: 'codeId',
  model: { codeId: 'c1', params: { p1: 'old' } },
  size: 'default',
  disabled: false,
  ...extra,
});

describe('CodeSelectCol', () => {
  test('val 存在时显示编辑按钮', () => {
    const wrapper = mount(CodeSelectCol, { props: baseProps() as any });
    expect(wrapper.find('button').exists()).toBe(true);
  });

  test('val 为空时不显示编辑按钮', () => {
    const wrapper = mount(CodeSelectCol, { props: baseProps({ model: { codeId: '', params: {} } }) as any });
    expect(wrapper.find('button').exists()).toBe(false);
  });

  test('paramsConfig 不为空时渲染 CodeParams', () => {
    const wrapper = mount(CodeSelectCol, { props: baseProps() as any });
    expect(wrapper.find('.fake-params').exists()).toBe(true);
  });

  test('选择无 params 的代码块不渲染 CodeParams', () => {
    const wrapper = mount(CodeSelectCol, { props: baseProps({ model: { codeId: 'c2', params: {} } }) as any });
    expect(wrapper.find('.fake-params').exists()).toBe(false);
  });

  test('onCodeIdChangeHandler emit change 包含 changeRecords', async () => {
    const wrapper = mount(CodeSelectCol, { props: baseProps() as any });
    await wrapper.findComponent({ name: 'MSelect' }).vm.$emit('change', 'c2');
    const evts = wrapper.emitted('change');
    expect(evts?.[0]?.[0]).toBe('c2');
    expect((evts?.[0]?.[1] as any).changeRecords.length).toBe(2);
  });

  test('CodeParams change 事件: 调整 propPath 后 emit', async () => {
    const wrapper = mount(CodeSelectCol, { props: baseProps() as any });
    await wrapper.find('.fake-params').trigger('click');
    const evts = wrapper.emitted('change');
    expect(evts?.[0]?.[0]).toBe('c1');
    expect(((evts?.[0]?.[1] as any).changeRecords[0] as any).propPath).toContain('p1');
  });

  test('编辑按钮 emit edit-code', async () => {
    const eventBus = { emit: vi.fn() };
    const wrapper = mount(CodeSelectCol, {
      props: baseProps() as any,
      global: { provide: { eventBus } },
    });
    await wrapper.find('button').trigger('click');
    expect(eventBus.emit).toHaveBeenCalledWith('edit-code', 'c1');
  });

  test('未启用代码块侧边栏时不显示编辑按钮', () => {
    uiService.get.mockReturnValue([]);
    const wrapper = mount(CodeSelectCol, { props: baseProps() as any });
    expect(wrapper.find('button').exists()).toBe(false);
  });

  test('codeDsl 为空时 selectConfig.options 返回空数组', () => {
    codeBlockService.getCodeDsl.mockReturnValue(null);
    const wrapper = mount(CodeSelectCol, { props: baseProps({ model: { codeId: '', params: {} } }) as any });
    const select = wrapper.findComponent({ name: 'MSelect' });
    expect((select.props('config') as any).options()).toEqual([]);
  });
});
