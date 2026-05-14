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

const mountForm = (config: any[], initValues: any = {}, props: any = {}) =>
  mount(MForm, {
    global: { plugins: [ElementPlus as any, MagicForm as any] },
    props: { config, initValues, ...props },
  });

describe('Step container', () => {
  test('step 渲染并显示当前 step 子项', async () => {
    const wrapper = mountForm(
      [
        {
          type: 'step',
          stepActive: 1,
          items: [
            {
              title: 'Step 1',
              name: 's1',
              items: [{ name: 'text', type: 'text', text: 'text' }],
            },
            {
              title: 'Step 2',
              name: 's2',
              items: [{ name: 'text2', type: 'text', text: 'text' }],
            },
          ],
        },
      ],
      { s1: { text: 'a' }, s2: { text: 'b' } },
      { stepActive: 1 },
    );
    await nextTick();
    expect(wrapper.text()).toContain('Step 1');
    expect(wrapper.text()).toContain('Step 2');
  });
});
