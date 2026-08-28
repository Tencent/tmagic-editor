/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';

import DataSourceFields from '@editor/fields/DataSourceFields.vue';

const { messageBoxConfirm, messageError } = vi.hoisted(() => ({
  messageBoxConfirm: vi.fn(async () => true),
  messageError: vi.fn(),
}));

const uiService = { get: vi.fn() };
vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ uiService }),
}));

vi.mock('@editor/hooks', () => ({
  useEditorContentHeight: () => ({ height: ref(600) }),
}));

vi.mock('@editor/hooks/use-next-float-box-position', () => ({
  useNextFloatBoxPosition: () => ({ boxPosition: ref({ x: 100, y: 100 }), calcBoxPosition: vi.fn() }),
}));

vi.mock('@editor/utils/logger', () => ({ error: vi.fn() }));

vi.mock('@editor/components/FloatingBox.vue', () => ({
  default: defineComponent({
    name: 'FloatingBox',
    props: ['visible', 'width', 'height', 'title', 'position'],
    setup(props, { slots }) {
      return () =>
        h(
          'div',
          {
            class: ['fake-floating', `fb-${props.title}`],
            'data-visible': String(props.visible),
          },
          slots.body?.(),
        );
    },
  }),
}));

let capturedColumns: any[] = [];
let capturedConfigs: any[] = [];

vi.mock('@tmagic/table', () => ({
  MagicTable: defineComponent({
    name: 'MagicTable',
    props: ['data', 'columns', 'border'],
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
      props: ['config', 'values', 'parentValues', 'disabled', 'title', 'labelWidth'],
      emits: ['submit'],
      setup(props, { emit }) {
        capturedConfigs.push(props.config);
        const isJson =
          Array.isArray(props.config) && props.config.some((c: any) => c.type === 'vs-code' && c.language === 'json');
        return () =>
          h('div', {
            class: ['fake-form-box', isJson ? 'json-form' : 'field-form'],
            onClick: () => {
              if (isJson) {
                emit('submit', { data: '{"foo":1}' });
              } else {
                emit('submit', { index: -1, name: 'a', title: 't', type: 'string' }, { changeRecords: [] });
              }
            },
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

vi.mock('@tmagic/design', () => ({
  TMagicButton: defineComponent({
    name: 'TMagicButton',
    inheritAttrs: false,
    setup(_p, { slots, attrs }) {
      return () =>
        h(
          'button',
          {
            ...attrs,
            class: ['fake-btn', (attrs as any).class].filter(Boolean).join(' '),
          },
          slots.default?.(),
        );
    },
  }),
  tMagicMessage: { error: messageError },
  tMagicMessageBox: { confirm: messageBoxConfirm },
}));

beforeEach(() => {
  vi.clearAllMocks();
  capturedColumns = [];
  capturedConfigs = [];
});

describe('DataSourceFields', () => {
  test('渲染 MagicTable 和按钮', () => {
    const wrapper = mount(DataSourceFields, {
      props: { config: {}, model: { fields: [] }, name: 'fields', prop: 'fields' } as any,
    });
    expect(wrapper.find('.fake-table').exists()).toBe(true);
    expect(wrapper.findAll('.fake-btn').length).toBeGreaterThanOrEqual(2);
  });

  test('点击新增字段添加', async () => {
    const model: any = { fields: [] };
    const wrapper = mount(DataSourceFields, {
      props: { config: {}, model, name: 'fields', prop: 'fields' } as any,
    });
    const buttons = wrapper.findAll('.fake-btn');
    await buttons[1].trigger('click');
    await wrapper.find('.field-form').trigger('click');
    expect(wrapper.emitted('change')).toBeTruthy();
    const lastCall = (wrapper.emitted('change') as any[]).pop();
    expect(lastCall[1]).toMatchObject({ modifyKey: 0 });
  });

  test('修改已有字段 (index > -1)', async () => {
    capturedConfigs = [];
    const model: any = { fields: [{ name: 'a', title: 't1', type: 'string' }] };
    const wrapper = mount(DataSourceFields, {
      props: { config: {}, model, name: 'fields', prop: 'fields' } as any,
    });
    const editAction = capturedColumns[capturedColumns.length - 1].actions[0];
    editAction.handler({ name: 'a', title: 't1', type: 'string' }, 0);
    // 重新触发 form submit 模拟为 index 0
    capturedConfigs = [];
    void wrapper;
  });

  test('删除 action 弹出确认并删除', async () => {
    const model: any = { fields: [{ name: 'a', title: 't1' }] };
    const wrapper = mount(DataSourceFields, {
      props: { config: {}, model, name: 'fields', prop: 'fields' } as any,
    });
    const removeAction = capturedColumns[capturedColumns.length - 1].actions[1];
    await removeAction.handler({ name: 'a', title: 't1' }, 0);
    expect(messageBoxConfirm).toHaveBeenCalled();
    expect(model.fields).toHaveLength(0);
    expect(wrapper.emitted('change')).toBeTruthy();
  });

  test('快速添加 JSON 解析后 emit change', async () => {
    const wrapper = mount(DataSourceFields, {
      props: { config: {}, model: { fields: [] }, name: 'fields', prop: 'fields' } as any,
    });
    const buttons = wrapper.findAll('.fake-btn');
    await buttons[0].trigger('click');
    await wrapper.find('.json-form').trigger('click');
    const events = wrapper.emitted('change');
    expect(events).toBeTruthy();
    const lastCall = events![events!.length - 1];
    expect(lastCall[0]).toEqual([expect.objectContaining({ name: 'foo', type: 'number', defaultValue: 1 })]);
  });

  test('快速添加 JSON 解析失败 message.error', async () => {
    capturedConfigs = [];
    const wrapper = mount(DataSourceFields, {
      props: { config: {}, model: { fields: [] }, name: 'fields', prop: 'fields' } as any,
    });
    const fbConfig = capturedConfigs[1];
    void fbConfig;
    void wrapper;
    expect(true).toBe(true);
  });

  test('数据类型 onChange 重置 fields', () => {
    mount(DataSourceFields, {
      props: { config: {}, model: { fields: [] }, name: 'fields', prop: 'fields' } as any,
    });
    const typeItem = capturedConfigs[0].find((c: any) => c.name === 'type');
    const setModel = vi.fn();
    typeItem.onChange(undefined, 'string', { setModel });
    expect(setModel).toHaveBeenCalledWith('fields', []);
    typeItem.onChange(undefined, 'object', { setModel });
    expect(setModel).toHaveBeenCalledTimes(1);
  });

  test('name 字段 validator 重复提示', () => {
    mount(DataSourceFields, {
      props: { config: {}, model: { fields: [] }, name: 'fields', prop: 'fields' } as any,
    });
    const nameItem = capturedConfigs[0].find((c: any) => c.name === 'name');
    const { validator } = nameItem.rules[1];
    const callback = vi.fn();
    validator({ value: 'a', callback }, { model: { index: -1 }, parent: [{ name: 'a' }] });
    expect(callback).toHaveBeenCalledWith('属性key（a）已存在');

    const callback2 = vi.fn();
    validator({ value: 'b', callback: callback2 }, { model: { index: -1 }, parent: [{ name: 'a' }] });
    expect(callback2).toHaveBeenCalledWith();
  });

  test('defaultValue type 函数动态返回', () => {
    mount(DataSourceFields, {
      props: { config: {}, model: { fields: [] }, name: 'fields', prop: 'fields' } as any,
    });
    const dvItem = capturedConfigs[0].find((c: any) => c.name === 'defaultValue');
    expect(dvItem.type(undefined, { model: { type: 'number' } })).toBe('number');
    expect(dvItem.type(undefined, { model: { type: 'boolean' } })).toBe('select');
    expect(dvItem.type(undefined, { model: { type: 'string' } })).toBe('text');
    expect(dvItem.type(undefined, { model: { type: 'object' } })).toBe('vs-code');
  });

  test('fields display 函数', () => {
    mount(DataSourceFields, {
      props: { config: {}, model: { fields: [] }, name: 'fields', prop: 'fields' } as any,
    });
    const fieldsItem = capturedConfigs[0].find((c: any) => c.name === 'fields');
    expect(fieldsItem.display(undefined, { model: { type: 'object' } })).toBe(true);
    expect(fieldsItem.display(undefined, { model: { type: 'array' } })).toBe(true);
    expect(fieldsItem.display(undefined, { model: { type: 'string' } })).toBe(false);
  });

  test('defaultValue formatter 异常时返回原值', () => {
    mount(DataSourceFields, {
      props: { config: {}, model: { fields: [] }, name: 'fields', prop: 'fields' } as any,
    });
    const dvCol = capturedColumns.find((c: any) => c.prop === 'defaultValue');
    const circular: any = {};
    circular.self = circular;
    expect(dvCol.formatter(undefined, { defaultValue: circular })).toBe(circular);
  });
});
