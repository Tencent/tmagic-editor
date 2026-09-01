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

const mountForm = (config: any[], initValues: any = {}) =>
  mount(MForm, {
    global: { plugins: [ElementPlus as any, MagicForm as any] },
    props: { config, initValues },
  });

describe('Panel container', () => {
  test('panel 渲染并展示子项', async () => {
    const wrapper = mountForm(
      [
        {
          type: 'panel',
          title: 'group',
          items: [{ name: 'text', type: 'text', text: 'text' }],
        },
      ],
      { text: 'hello' },
    );
    await nextTick();
    expect(wrapper.text()).toContain('group');
  });

  test('row 容器渲染', async () => {
    const wrapper = mountForm(
      [
        {
          type: 'row',
          items: [{ name: 'text', type: 'text', text: 'text' }],
        },
      ],
      { text: 'r' },
    );
    await nextTick();
    expect(wrapper.exists()).toBe(true);
  });

  test('fieldset 容器渲染', async () => {
    const wrapper = mountForm(
      [
        {
          type: 'fieldset',
          legend: 'fs',
          items: [{ name: 'text', type: 'text', text: 'text' }],
        },
      ],
      { text: 'fs' },
    );
    await nextTick();
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('legend').text()).toContain('fs');
  });

  test('fieldset legend 支持函数', async () => {
    const wrapper = mountForm(
      [
        {
          type: 'fieldset',
          legend: (mForm: any, { formValue }: any) => `legend-${formValue.text}`,
          items: [{ name: 'text', type: 'text', text: 'text' }],
        },
      ],
      { text: 'fn' },
    );
    await nextTick();
    expect(wrapper.find('legend').text()).toContain('legend-fn');
  });

  test('flex-layout 容器渲染', async () => {
    const wrapper = mountForm(
      [
        {
          type: 'flex-layout',
          items: [{ name: 'text', type: 'text', text: 'text' }],
        },
      ],
      { text: 'fl' },
    );
    await nextTick();
    expect(wrapper.exists()).toBe(true);
  });

  describe('labelPosition 透传', () => {
    const getFormItemLabelPosition = (wrapper: ReturnType<typeof mountForm>, prop: string) => {
      const item = wrapper.findAllComponents({ name: 'TMFormItem' }).find((w) => w.props('prop') === prop);
      return item?.props('labelPosition');
    };

    test('panel 的 labelPosition 透传到子表单项', async () => {
      const wrapper = mountForm(
        [
          {
            type: 'panel',
            title: 'group',
            labelPosition: 'left',
            items: [{ name: 'text', type: 'text', text: 'text' }],
          },
        ],
        { text: 'hello' },
      );
      await nextTick();

      expect(getFormItemLabelPosition(wrapper, 'text')).toBe('left');
    });

    test('fieldset 的 labelPosition 透传到子表单项', async () => {
      const wrapper = mountForm(
        [
          {
            type: 'fieldset',
            legend: 'fs',
            labelPosition: 'left',
            items: [{ name: 'text', type: 'text', text: 'text' }],
          },
        ],
        { text: 'fs' },
      );
      await nextTick();

      expect(getFormItemLabelPosition(wrapper, 'text')).toBe('left');
    });

    test('flex-layout 的 labelPosition 透传到子表单项', async () => {
      const wrapper = mountForm(
        [
          {
            type: 'flex-layout',
            labelPosition: 'left',
            items: [{ name: 'text', type: 'text', text: 'text' }],
          },
        ],
        { text: 'fl' },
      );
      await nextTick();

      expect(getFormItemLabelPosition(wrapper, 'text')).toBe('left');
    });

    test('row 的 labelPosition 透传到子表单项', async () => {
      const wrapper = mountForm(
        [
          {
            type: 'row',
            labelPosition: 'left',
            items: [{ name: 'text', type: 'text', text: 'text' }],
          },
        ],
        { text: 'r' },
      );
      await nextTick();

      expect(getFormItemLabelPosition(wrapper, 'text')).toBe('left');
    });

    test('无 type 的 items 容器把 labelPosition 透传到子项', async () => {
      const wrapper = mountForm(
        [
          {
            labelPosition: 'left',
            items: [{ name: 'text', type: 'text', text: 'text' }],
          },
        ],
        { text: 'x' },
      );
      await nextTick();

      expect(getFormItemLabelPosition(wrapper, 'text')).toBe('left');
    });
  });
});
