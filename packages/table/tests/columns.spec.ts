/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import ActionsColumn from '../src/ActionsColumn.vue';
import ComponentColumn from '../src/ComponentColumn.vue';
import ExpandColumn from '../src/ExpandColumn.vue';
import PopoverColumn from '../src/PopoverColumn.vue';
import TextColumn from '../src/TextColumn.vue';
import { tMagicMessage } from '../test-support/design.mock';

vi.mock('@tmagic/design', async () => {
  const { createDesignMock } = await import('../test-support/design.mock');
  return createDesignMock();
});

vi.mock('@tmagic/form', async () => {
  const { createFormMock } = await import('../test-support/design.mock');
  return createFormMock();
});

describe('TextColumn.vue', () => {
  test('index 列支持分页序号', () => {
    const wrapper = mount(TextColumn, {
      props: {
        config: { type: 'index', pageIndex: 1, pageSize: 10 },
        row: {},
        index: 2,
      },
    });
    expect(wrapper.text()).toBe('13');
  });

  test('index 列无分页时使用 index + 1', () => {
    const wrapper = mount(TextColumn, {
      props: { config: { type: 'index' }, row: {}, index: 4 },
    });
    expect(wrapper.text()).toBe('5');
  });

  test('actionLink / img / link / tip / tag 分支', () => {
    const row = {
      url: 'https://example.com',
      img: 'https://example.com/a.png',
      status: 'ok',
    };

    const link = mount(TextColumn, {
      props: {
        config: { action: 'actionLink', prop: 'url', handler: vi.fn() },
        row,
        index: 0,
      },
    });
    expect(link.find('.tmagic-button-stub').exists()).toBe(true);

    const img = mount(TextColumn, {
      props: { config: { action: 'img', prop: 'img' }, row, index: 0 },
    });
    expect(img.find('img').attributes('src')).toBe(row.img);

    const anchor = mount(TextColumn, {
      props: { config: { action: 'link', prop: 'url' }, row, index: 0 },
    });
    expect(anchor.find('a').attributes('href')).toBe(row.url);

    const tip = mount(TextColumn, {
      props: { config: { action: 'tip', prop: 'url', buttonText: '查看' }, row, index: 0 },
    });
    expect(tip.text()).toContain('查看');

    const tag = mount(TextColumn, {
      props: {
        config: { action: 'tag', prop: 'status', type: (v: string) => (v === 'ok' ? 'success' : 'info') },
        row,
        index: 0,
      },
    });
    expect(tag.find('.tmagic-tag-stub.success').exists()).toBe(true);
  });

  test('编辑态渲染 MForm 并响应 change', async () => {
    const editState: Record<number, any> = { 0: { name: 'old' } };
    const wrapper = mount(TextColumn, {
      props: {
        config: { type: 'text', prop: 'name', editInlineFormConfig: [{ name: 'name', type: 'text' }] },
        editState,
        row: { name: 'old' },
        index: 0,
      },
    });
    expect(wrapper.find('.mform-stub').exists()).toBe(true);
    wrapper.vm.formChangeHandler({}, { changeRecords: [{ propPath: 'name', value: 'new' }] });
    expect(editState[0].name).toBe('new');
  });

  test('默认分支输出 formatter 结果', () => {
    const wrapper = mount(TextColumn, {
      props: { config: { prop: 'name' }, row: { name: 'Tom' }, index: 0 },
    });
    expect(wrapper.text()).toContain('Tom');
  });
});

describe('ActionsColumn.vue', () => {
  const baseProps = () => ({
    columns: [],
    config: {
      actions: [
        {
          type: 'edit',
          text: '编辑',
          display: (row: any) => row.visible !== false,
          disabled: (row: any) => row.locked,
          action: vi.fn(async () => ({ ret: 0 })),
          cancel: vi.fn(),
        },
        {
          text: '删除',
          handler: vi.fn(),
          after: vi.fn(),
          before: vi.fn(),
        },
      ],
    },
    row: { id: 1, visible: true, locked: false },
    index: 0,
    editState: [] as any[],
  });

  test('display / disabled / formatter 辅助函数', () => {
    const wrapper = mount(ActionsColumn, { props: baseProps() });
    expect(wrapper.vm.display(() => false, {})).toBe(false);
    expect(wrapper.vm.display(true, {})).toBe(true);
    expect(wrapper.vm.display(undefined, {})).toBe(true);
    expect(wrapper.vm.disabled(() => true, {})).toBe(true);
    expect(wrapper.vm.disabled(false, {})).toBe(false);
    expect(wrapper.vm.formatter((row: any) => row.id, { id: 2 })).toBe(2);
    expect(wrapper.vm.formatter('静态', {})).toBe('静态');
  });

  test('编辑 / 保存 / 取消流程', async () => {
    const props = baseProps();
    const wrapper = mount(ActionsColumn, { props });
    const editAction = props.config.actions[0];

    await wrapper.vm.actionHandler(editAction, props.row, 0);
    expect(props.editState[0]).toEqual(props.row);

    await wrapper.vm.save(0, props.config);
    expect(tMagicMessage.success).toHaveBeenCalledWith('保存成功');
    expect(wrapper.emitted('after-action')?.[0]).toEqual([{ index: 0 }]);

    props.editState[0] = { id: 1 };
    await wrapper.vm.cancel(0, props.config);
    expect(editAction.cancel).toHaveBeenCalledWith({ index: 0 });
    expect(wrapper.emitted('after-action-cancel')?.[0]).toEqual([{ index: 0 }]);
  });

  test('保存失败时提示错误', async () => {
    const props = baseProps();
    props.config.actions[0].action = vi.fn(async () => ({ ret: 1, msg: '出错' }));
    const wrapper = mount(ActionsColumn, { props });
    props.editState[0] = { id: 1 };
    await wrapper.vm.save(0, props.config);
    expect(tMagicMessage.error).toHaveBeenCalledWith('出错');
  });

  test('非 edit 类型 action 调用 handler', async () => {
    const props = baseProps();
    const wrapper = mount(ActionsColumn, { props });
    const deleteAction = props.config.actions[1];
    await wrapper.vm.actionHandler(deleteAction, props.row, 0);
    expect(deleteAction.before).toHaveBeenCalled();
    expect(deleteAction.handler).toHaveBeenCalledWith(props.row, 0);
    expect(deleteAction.after).toHaveBeenCalled();
  });
});

describe('ComponentColumn.vue', () => {
  const innerComp = defineComponent({
    props: ['label'],
    setup(p) {
      return () => h('span', { class: 'inner' }, p.label);
    },
  });

  test('props / listeners 支持函数与对象', () => {
    const onClick = vi.fn();
    const wrapper = mount(ComponentColumn, {
      props: {
        config: {
          component: innerComp,
          props: (row: any) => ({ label: row.name }),
          listeners: (_row: any, index: number) => ({ click: () => onClick(index) }),
        },
        row: { name: 'Cell' },
        index: 3,
      },
    });
    expect(wrapper.find('.inner').text()).toBe('Cell');
    wrapper.vm.componentListeners({ name: 'Cell' }, 3).click();
    expect(onClick).toHaveBeenCalledWith(3);

    const wrapper2 = mount(ComponentColumn, {
      props: {
        config: { component: innerComp, props: { label: '静态' }, listeners: {} },
        row: {},
        index: 0,
      },
    });
    expect(wrapper2.vm.componentProps({}, 0)).toEqual({ label: '静态' });
    expect(wrapper2.vm.componentListeners({}, 0)).toEqual({});
  });
});

describe('ExpandColumn.vue', () => {
  test('渲染嵌套表格 / 表单 / html / 组件', () => {
    const titleComp = defineComponent({
      props: ['title'],
      setup(p) {
        return () => h('b', p.title);
      },
    });

    const wrapper = mount(ExpandColumn, {
      props: {
        config: {
          table: [{ prop: 'a', label: 'A' }],
          form: [{ name: 'a', type: 'text' }],
          expandContent: (row: any) => `<p>${row.desc}</p>`,
          component: titleComp,
          props: (row: any) => ({ title: row.title }),
          prop: 'children',
        },
        row: { desc: 'detail', title: 'T', children: [{ a: 1 }] },
      },
    });

    expect(wrapper.find('.tmagic-table-stub').exists()).toBe(true);
    expect(wrapper.find('.mform-stub').exists()).toBe(true);
    expect(wrapper.html()).toContain('detail');
    expect(wrapper.find('b').text()).toBe('T');
  });
});

describe('PopoverColumn.vue', () => {
  test('渲染 popover 与嵌套表格', () => {
    const wrapper = mount(PopoverColumn, {
      props: {
        config: {
          text: '查看',
          prop: 'items',
          popover: { tableEmbed: true, trigger: 'click', placement: 'top' },
          table: [{ prop: 'sub', label: '子项' }],
        },
        row: { items: [{ sub: 'x' }] },
        index: 0,
      },
    });
    expect(wrapper.find('.tmagic-popover-stub').exists()).toBe(true);
    expect(wrapper.text()).toContain('查看');
    expect(wrapper.find('.tmagic-table-stub').exists()).toBe(true);
  });
});
