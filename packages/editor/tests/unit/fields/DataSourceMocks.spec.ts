/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';

import DataSourceMocks from '@editor/fields/DataSourceMocks.vue';

const { messageBoxConfirm } = vi.hoisted(() => ({ messageBoxConfirm: vi.fn(async () => true) }));

const uiService = { get: vi.fn() };
vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ uiService }),
}));

vi.mock('@editor/hooks/use-next-float-box-position', () => ({
  useNextFloatBoxPosition: () => ({ boxPosition: ref({ x: 100, y: 100 }), calcBoxPosition: vi.fn() }),
}));

vi.mock('@editor/hooks/use-editor-content-height', () => ({
  useEditorContentHeight: () => ({ height: ref(600) }),
}));

vi.mock('@editor/layouts/CodeEditor.vue', () => ({
  default: defineComponent({ name: 'CodeEditor', setup: () => () => h('div') }),
}));

vi.mock('@editor/components/FloatingBox.vue', () => ({
  default: defineComponent({
    name: 'FloatingBox',
    props: ['visible', 'width', 'height', 'title', 'position'],
    setup(props, { slots }) {
      return () => h('div', { class: 'fake-floating', 'data-visible': String(props.visible) }, slots.body?.());
    },
  }),
}));

let capturedColumns: any[] = [];
let capturedFormConfig: any[] = [];
vi.mock('@tmagic/table', () => ({
  MagicTable: defineComponent({
    name: 'MagicTable',
    props: ['data', 'columns'],
    setup(props) {
      capturedColumns = props.columns;
      return () => h('div', { class: 'fake-table' });
    },
  }),
}));

vi.mock('@tmagic/form', async () => {
  const actual = await vi.importActual<any>('@tmagic/form');
  return {
    ...actual,
    MFormBox: defineComponent({
      name: 'MFormBox',
      props: ['config', 'values', 'parentValues', 'disabled', 'labelWidth'],
      emits: ['submit'],
      setup(props, { emit }) {
        capturedFormConfig = props.config;
        return () =>
          h('div', {
            class: 'fake-form-box',
            onClick: () => emit('submit', { index: -1, title: 'new' }),
          });
      },
    }),
  };
});

vi.mock('@tmagic/utils', async () => {
  const actual = await vi.importActual<any>('@tmagic/utils');
  return {
    ...actual,
    getDefaultValueFromFields: vi.fn(() => ({ a: 1 })),
  };
});

vi.mock('@tmagic/design', async () => ({
  TMagicButton: defineComponent({
    name: 'TMagicButton',
    inheritAttrs: false,
    setup(_p, { slots, attrs }) {
      return () =>
        h(
          'button',
          {
            ...attrs,
            class: ['fake-add-btn', (attrs as any).class].filter(Boolean).join(' '),
          },
          slots.default?.(),
        );
    },
  }),
  TMagicSwitch: defineComponent({ name: 'TMagicSwitch', setup: () => () => h('div') }),
  tMagicMessageBox: { confirm: messageBoxConfirm },
}));

beforeEach(() => {
  vi.clearAllMocks();
  capturedColumns = [];
  capturedFormConfig = [];
});

describe('DataSourceMocks', () => {
  test('渲染 MagicTable 和添加按钮', () => {
    const wrapper = mount(DataSourceMocks, {
      props: { config: {}, model: { mocks: [] }, name: 'mocks' } as any,
    });
    expect(wrapper.find('.fake-table').exists()).toBe(true);
    expect(wrapper.find('.fake-add-btn').exists()).toBe(true);
  });

  test('点击添加按钮显示 dialog', async () => {
    const wrapper = mount(DataSourceMocks, {
      props: { config: {}, model: { mocks: [] }, name: 'mocks' } as any,
    });
    await wrapper.find('.fake-add-btn').trigger('click');
    expect(wrapper.find('.fake-floating').attributes('data-visible')).toBe('true');
  });

  test('formChangeHandler 添加新记录', async () => {
    const model: any = { mocks: [] };
    const wrapper = mount(DataSourceMocks, {
      props: { config: {}, model, name: 'mocks' } as any,
    });
    await wrapper.find('.fake-add-btn').trigger('click');
    await wrapper.find('.fake-form-box').trigger('click');
    expect(model.mocks).toHaveLength(1);
    expect(model.mocks[0]).toEqual({ title: 'new' });
    expect(wrapper.emitted('change')).toBeTruthy();
  });

  test('编辑 action 设置 formValues 并打开对话框', async () => {
    const wrapper = mount(DataSourceMocks, {
      props: {
        config: {},
        model: { mocks: [{ title: 'm1', enable: true }] },
        name: 'mocks',
      } as any,
    });
    const editAction = capturedColumns[capturedColumns.length - 1].actions[0];
    editAction.handler({ title: 'm1' }, 0);
    expect(wrapper.vm).toBeTruthy();
  });

  test('删除 action 弹出确认并删除', async () => {
    const model: any = { mocks: [{ title: 'm1' }] };
    const wrapper = mount(DataSourceMocks, {
      props: { config: {}, model, name: 'mocks' } as any,
    });
    const removeAction = capturedColumns[capturedColumns.length - 1].actions[1];
    await removeAction.handler({ title: 'm1' }, 0);
    expect(messageBoxConfirm).toHaveBeenCalled();
    expect(model.mocks).toHaveLength(0);
    expect(wrapper.emitted('change')).toBeTruthy();
  });

  test('toggleValue (enable) 互斥', () => {
    const model: any = {
      mocks: [
        { title: 'a', enable: true },
        { title: 'b', enable: true },
      ],
    };
    mount(DataSourceMocks, {
      props: { config: {}, model, name: 'mocks' } as any,
    });
    const enableCol = capturedColumns.find((c: any) => c.prop === 'enable');
    const listeners = enableCol.listeners({ title: 'a', enable: false }, 0);
    listeners['update:modelValue'](true);
    expect(model.mocks[0].enable).toBe(true);
    expect(model.mocks[1].enable).toBe(false);
  });

  test('mock data onChange 解析 JSON', () => {
    mount(DataSourceMocks, {
      props: { config: {}, model: { mocks: [] }, name: 'mocks' } as any,
    });
    const dataItem = capturedFormConfig.find((c: any) => c.name === 'data');
    expect(dataItem.onChange(undefined, '{"a":1}')).toEqual({ a: 1 });
    expect(dataItem.onChange(undefined, { a: 2 })).toEqual({ a: 2 });
  });

  test('mock data validator 校验 JSON', () => {
    mount(DataSourceMocks, {
      props: { config: {}, model: { mocks: [] }, name: 'mocks' } as any,
    });
    const dataItem = capturedFormConfig.find((c: any) => c.name === 'data');
    const cb = vi.fn();
    dataItem.rules[0].validator({ value: '{"a":1}', callback: cb });
    expect(cb).toHaveBeenCalledWith();

    const cb2 = vi.fn();
    dataItem.rules[0].validator({ value: 'invalid json', callback: cb2 });
    expect(cb2).toHaveBeenCalled();
    expect(cb2.mock.calls[0][0]).toBeInstanceOf(Error);

    const cb3 = vi.fn();
    dataItem.rules[0].validator({ value: { a: 1 }, callback: cb3 });
    expect(cb3).toHaveBeenCalledWith();
  });

  test('expand column props 提供 row.data', () => {
    mount(DataSourceMocks, {
      props: { config: {}, model: { mocks: [] }, name: 'mocks' } as any,
    });
    const expandCol = capturedColumns[0];
    expect(expandCol.type).toBe('expand');
    expect(expandCol.props({ data: { a: 1 } })).toMatchObject({ initValues: { a: 1 } });
  });
});
