/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import ElementPlus, { ElButton } from 'element-plus';

import MagicForm, { FormState, MForm, MFormDialog, MLink } from '@form/index';

const getWrapper = (
  config: any = [
    {
      type: 'link',
      displayText: '链接',
      text: 'link',
      name: 'link',
      href: 'www.google.com',
    },
  ],
  initValues: any = {
    text: 'link',
  },
) =>
  mount(MForm, {
    global: {
      plugins: [ElementPlus as any, MagicForm as any],
    },
    props: {
      initValues,
      config,
    },
  });

describe('Link', () => {
  test('基础', async () => {
    const wrapper = getWrapper();

    await nextTick();

    const link = wrapper.findComponent(MLink);
    expect(link.exists()).toBe(true);
    // displayText 字段配置
    expect(link.text()).toContain('链接');

    const a = wrapper.find('a');
    expect(a.exists()).toBe(true);
    // href 字段配置
    expect(a.element.href).toMatch('www.google.com');
  });

  test('默认文字', async () => {
    const wrapper = getWrapper(
      [
        {
          type: 'link',
          text: 'link',
          name: 'link',
          href: 'www.baidu.com',
        },
      ],
      {
        link: 'www.baidu.com',
      },
    );

    await nextTick();

    const link = wrapper.findComponent(MLink);
    expect(link.exists()).toBe(true);
    // 默认displayText
    expect(link.text()).toContain('跳转');

    const a = wrapper.find('a');
    expect(a.exists()).toBe(true);
    // 渲染出来的 a 元素的 href 属性
    expect(a.element.href).toMatch('www.baidu.com');
  });

  test('displayText为函数', async () => {
    const wrapper = getWrapper([
      {
        type: 'link',
        text: 'link',
        name: 'link',
        href: (model: Record<string, any>) => {
          if (model) {
            return 'www.google.com';
          }
          return 'www.baidu.com';
        },
        displayText: (
          mForm: FormState | undefined,
          data: {
            model: Record<any, any>;
          },
        ) => {
          if (mForm && data) {
            return '谷歌';
          }
          return '百度';
        },
      },
    ]);

    await nextTick();

    const link = wrapper.findComponent(MLink);
    expect(link.exists()).toBe(true);
    expect(link.text()).toContain('谷歌');

    const a = wrapper.find('a');
    expect(a.exists()).toBe(true);
    expect(a.element.href).toMatch('www.google.com');
  });

  test('不可编辑', async () => {
    const wrapper = getWrapper(
      [
        {
          type: 'link',
          text: 'link',
          name: 'link',
          href: 'www.google.com',
          disabled: true,
        },
      ],
      {
        disabled: true,
      },
    );

    await nextTick();

    const link = wrapper.findComponent(MLink);
    expect((link.vm as any).disabled).toBe(true);
    const span = wrapper.find('span');
    expect(span.exists()).toBe(true);
  });

  test('编辑链接', async () => {
    const wrapper = getWrapper([
      {
        type: 'link',
        text: 'link',
        name: 'link',
        href: '',
        disabled: false,
      },
    ]);

    await nextTick();

    const button = wrapper.findComponent(ElButton);
    expect(button.exists()).toBe(true);
    await button.trigger('click');

    const dialog = wrapper.findComponent(MFormDialog);
    expect(dialog.exists()).toBe(true);
    dialog.vm.$emit('submit');
  });

  // Link 的 FormDialog 不透传 context，靠 FORM_CONTEXT_KEY 的 provide/inject 继承
  test('子表单自动继承宿主 context，无需层层透传', async () => {
    const seen: any[] = [];
    const wrapper = mount(MForm, {
      global: {
        plugins: [ElementPlus as any, MagicForm as any],
      },
      props: {
        initValues: { link: {} },
        context: { env: 'prod' },
        config: [
          {
            type: 'link',
            text: 'link',
            name: 'link',
            href: '',
            disabled: false,
            form: [
              {
                type: 'text',
                name: 'inner',
                text: 'inner',
                display: (mForm: any) => {
                  seen.push((mForm as any)?.env);
                  return true;
                },
              },
            ],
          },
        ],
      },
    });

    await nextTick();
    await wrapper.findComponent(ElButton).trigger('click');
    await nextTick();
    await nextTick();

    expect(seen.length).toBeGreaterThan(0);
    // 子表单的 mForm.xxx 读穿到祖先注入的同一份 context
    expect(seen[0]).toBe('prod');
  });
});
