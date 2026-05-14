/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import DataSourceMethods from '@editor/fields/DataSourceMethods.vue';

const { messageBoxConfirm, codeBlockEditorShow, codeBlockEditorHide } = vi.hoisted(() => ({
  messageBoxConfirm: vi.fn().mockResolvedValue(true),
  codeBlockEditorShow: vi.fn(),
  codeBlockEditorHide: vi.fn(),
}));

vi.mock('@tmagic/design', () => ({
  TMagicButton: defineComponent({
    name: 'FakeTMagicButton',
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
  tMagicMessageBox: { confirm: messageBoxConfirm },
}));

vi.mock('@tmagic/table', () => ({
  MagicTable: defineComponent({
    name: 'FakeMagicTable',
    props: ['data', 'columns', 'border'],
    setup(props) {
      return () =>
        h('div', { class: 'fake-magic-table' }, [
          h('span', { class: 'data-len' }, String((props.data || []).length)),
          ...(props.columns as any[]).map((c, i) => h('span', { class: `col-${i}` }, c.label)),
        ]);
    },
  }),
}));

vi.mock('@editor/components/CodeBlockEditor.vue', () => ({
  default: defineComponent({
    name: 'FakeCodeBlockEditor',
    props: ['disabled', 'content', 'isDataSource', 'dataSourceType'],
    emits: ['submit'],
    setup(props, { emit, expose }) {
      expose({
        show: codeBlockEditorShow,
        hide: codeBlockEditorHide,
      });
      return () =>
        h(
          'div',
          {
            class: 'fake-code-block-editor',
            onClick: (e: any) => {
              if (e?.detail?.payload) {
                emit('submit', e.detail.payload[0], e.detail.payload[1]);
              }
            },
          },
          JSON.stringify((props as any).content),
        );
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DataSourceMethods.vue', () => {
  test('渲染表格与添加按钮', () => {
    const wrapper = mount(DataSourceMethods, {
      props: {
        name: 'methods',
        prop: 'methods',
        config: { type: 'data-source-methods' } as any,
        model: { methods: [] } as any,
      } as any,
    });
    expect(wrapper.find('.fake-magic-table').exists()).toBe(true);
    expect(wrapper.find('.fake-btn').text()).toBe('添加');
  });

  test('点击添加显示编辑器', async () => {
    const wrapper = mount(DataSourceMethods, {
      props: {
        name: 'methods',
        prop: 'methods',
        config: {} as any,
        model: { methods: [] } as any,
      } as any,
    });
    await wrapper.find('.fake-btn').trigger('click');
    await nextTick();
    expect(wrapper.find('.fake-code-block-editor').exists()).toBe(true);
    await nextTick();
    expect(codeBlockEditorShow).toHaveBeenCalled();
  });

  test('编辑 action - method.content 是 string', async () => {
    const wrapper = mount(DataSourceMethods, {
      props: {
        name: 'methods',
        prop: 'methods',
        config: {} as any,
        model: { methods: [{ name: 'm1', content: 'function () {}' }] } as any,
      } as any,
    });
    const columns = wrapper.findComponent({ name: 'FakeMagicTable' }).props('columns') as any;
    const editAction = columns[columns.length - 1].actions[0];
    editAction.handler({ name: 'm1', content: 'function () {}' }, 0);
    await nextTick();
    await nextTick();
    expect(codeBlockEditorShow).toHaveBeenCalled();
  });

  test('编辑 action - method.content 是函数（toString）', async () => {
    const wrapper = mount(DataSourceMethods, {
      props: {
        name: 'methods',
        prop: 'methods',
        config: {} as any,
        model: { methods: [] } as any,
      } as any,
    });
    const columns = wrapper.findComponent({ name: 'FakeMagicTable' }).props('columns') as any;
    const editAction = columns[columns.length - 1].actions[0];
    const fn = function fakeFn() {
      return 1;
    };
    editAction.handler({ name: 'm1', content: fn }, 0);
    await nextTick();
    await nextTick();
    expect(codeBlockEditorShow).toHaveBeenCalled();
  });

  test('删除 action 调用 confirm 并移除项', async () => {
    const model: any = { methods: [{ name: 'm1' }] };
    const wrapper = mount(DataSourceMethods, {
      props: {
        name: 'methods',
        prop: 'methods',
        config: {} as any,
        model,
      } as any,
    });
    const columns = wrapper.findComponent({ name: 'FakeMagicTable' }).props('columns') as any;
    const delAction = columns[columns.length - 1].actions[1];
    await delAction.handler({ name: 'm1' }, 0);
    await nextTick();
    expect(messageBoxConfirm).toHaveBeenCalled();
    expect(model.methods.length).toBe(0);
    expect(wrapper.emitted('change')?.[0]?.[0]).toEqual([]);
  });

  test('params formatter 返回字符串', () => {
    const wrapper = mount(DataSourceMethods, {
      props: {
        name: 'methods',
        prop: 'methods',
        config: {} as any,
        model: { methods: [] } as any,
      } as any,
    });
    const columns = wrapper.findComponent({ name: 'FakeMagicTable' }).props('columns') as any;
    const paramsCol = columns.find((c: any) => c.prop === 'params');
    expect(paramsCol.formatter([{ name: 'a' }, { name: 'b' }])).toBe('a, b');
    expect(paramsCol.formatter()).toBe('');
  });

  test('submit - editIndex > -1 编辑模式提交', async () => {
    const wrapper = mount(DataSourceMethods, {
      props: {
        name: 'methods',
        prop: 'methods',
        config: {} as any,
        model: { methods: [{ name: 'm1', content: 'fn1' }] } as any,
      } as any,
    });
    const columns = wrapper.findComponent({ name: 'FakeMagicTable' }).props('columns') as any;
    columns[columns.length - 1].actions[0].handler({ name: 'm1', content: 'fn1' }, 0);
    await nextTick();
    await nextTick();
    const editor = wrapper.findComponent({ name: 'FakeCodeBlockEditor' });
    (editor.vm.$emit as any)('submit', { name: 'm1' }, { changeRecords: [{ propPath: 'name', value: 'm1' }] });
    await nextTick();
    const evt = wrapper.emitted('change')?.[0];
    expect(evt?.[1]).toMatchObject({ modifyKey: 0 });
    expect((evt?.[1] as any).changeRecords[0].propPath).toBe('methods.0.name');
    expect(codeBlockEditorHide).toHaveBeenCalled();
  });

  test('submit - 新增模式提交', async () => {
    const wrapper = mount(DataSourceMethods, {
      props: {
        name: 'methods',
        prop: 'methods',
        config: {} as any,
        model: { methods: [{ name: 'a' }] } as any,
      } as any,
    });
    await wrapper.find('.fake-btn').trigger('click');
    await nextTick();
    await nextTick();
    const editor = wrapper.findComponent({ name: 'FakeCodeBlockEditor' });
    (editor.vm.$emit as any)('submit', { name: 'b' }, {});
    await nextTick();
    const evt = wrapper.emitted('change')?.[0];
    expect((evt?.[1] as any).modifyKey).toBe(1);
    expect((evt?.[1] as any).changeRecords[0].propPath).toBe('methods.1');
  });
});
