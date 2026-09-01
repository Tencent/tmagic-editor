/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import MagicForm, { MForm } from '@form/index';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';

const mountForm = (config: any[], initValues: any = {}, extra: any = {}) =>
  mount(MForm, {
    global: { plugins: [ElementPlus as any, MagicForm as any] },
    props: { config, initValues, ...extra },
  });

describe('GroupList container', () => {
  test('空数据时显示暂无数据', async () => {
    const wrapper = mountForm(
      [
        {
          type: 'group-list',
          name: 'list',
          items: [{ name: 'text', type: 'text', text: 'text' }],
        },
      ],
      { list: [] },
    );
    await nextTick();
    expect(wrapper.text()).toContain('暂无数据');
  });

  test('有数据时渲染列表项', async () => {
    const wrapper = mountForm(
      [
        {
          type: 'group-list',
          name: 'list',
          items: [{ name: 'text', type: 'text', text: 'text' }],
        },
      ],
      { list: [{ text: 'a' }, { text: 'b' }] },
    );
    await nextTick();
    expect(wrapper.findAllComponents({ name: 'MFormGroupList' })).toHaveLength(1);
  });

  test('extra 字段渲染 HTML', async () => {
    const wrapper = mountForm(
      [
        {
          type: 'group-list',
          name: 'list',
          extra: '<em>tip</em>',
          items: [{ name: 'text', type: 'text' }],
        },
      ],
      { list: [] },
    );
    await nextTick();
    expect(wrapper.html()).toContain('<em>tip</em>');
  });

  describe('对比模式', () => {
    const compareConfig = [
      {
        type: 'group-list',
        name: 'list',
        copyable: true,
        movable: true,
        items: [{ name: 'text', type: 'text', text: 'text' }],
      },
    ];

    test('非对比模式渲染底部操作栏与复制/移动按钮', async () => {
      const wrapper = mountForm(compareConfig, { list: [{ text: 'a' }, { text: 'b' }] });
      await nextTick();
      expect(wrapper.find('.m-fields-group-list-footer').exists()).toBe(true);
      expect(wrapper.text()).toContain('复制');
      expect(wrapper.text()).toContain('上移');
    });

    test('对比模式隐藏底部操作栏与复制/移动按钮', async () => {
      const wrapper = mountForm(
        compareConfig,
        { list: [{ text: 'a' }, { text: 'b' }] },
        {
          isCompare: true,
          lastValues: { list: [{ text: 'a' }] },
        },
      );
      await nextTick();
      await nextTick();
      expect(wrapper.find('.m-fields-group-list-footer').exists()).toBe(false);
      expect(wrapper.text()).not.toContain('复制');
      expect(wrapper.text()).not.toContain('上移');
      expect(wrapper.text()).not.toContain('下移');
    });
  });

  describe('labelPosition 透传', () => {
    const getFormItemLabelPosition = (wrapper: ReturnType<typeof mountForm>, prop: string) => {
      const item = wrapper.findAllComponents({ name: 'TMFormItem' }).find((w) => w.props('prop') === prop);
      return item?.props('labelPosition');
    };

    test('group-list 的 labelPosition 透传到子表单项', async () => {
      const wrapper = mountForm(
        [
          {
            type: 'group-list',
            name: 'list',
            labelPosition: 'left',
            labelWidth: '80px',
            items: [{ name: 'text', type: 'text', text: 'text' }],
          },
        ],
        { list: [{ text: 'a' }] },
      );
      await nextTick();

      expect(getFormItemLabelPosition(wrapper, 'list.0.text')).toBe('left');
    });

    test('子项自身的 labelPosition 优先于 group-list', async () => {
      const wrapper = mountForm(
        [
          {
            type: 'group-list',
            name: 'list',
            labelPosition: 'left',
            items: [
              { name: 'text', type: 'text', text: 'text' },
              { name: 'title', type: 'text', text: 'title', labelPosition: 'top' },
            ],
          },
        ],
        { list: [{ text: 'a', title: 'b' }] },
      );
      await nextTick();

      expect(getFormItemLabelPosition(wrapper, 'list.0.text')).toBe('left');
      expect(getFormItemLabelPosition(wrapper, 'list.0.title')).toBe('top');
    });
  });
});
