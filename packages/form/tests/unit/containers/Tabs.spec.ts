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
import ElementPlus, { ElTabs } from 'element-plus';

import MagicForm, { FormConfig, MForm, MTabs } from '@form/index';

const getWrapper = (
  config: FormConfig = [
    {
      type: 'tab',
      items: [
        {
          title: 'tab1',
          items: [
            {
              name: 'text',
              text: 'text',
            },
          ],
        },
      ],
    },
  ],
  initValues: any = {
    text: 'text',
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

describe('Tabs', () => {
  test('基础', async () => {
    const wrapper = getWrapper();

    await nextTick();

    const tabs = wrapper.findComponent(MTabs);
    expect(tabs.exists()).toBe(true);
    const value = await (wrapper.vm as any).submitForm();
    expect(value.text).toBe('text');
  });

  test('tab 的 labelPosition 透传到子表单项', async () => {
    const wrapper = getWrapper([
      {
        type: 'tab',
        items: [
          {
            title: 'tab1',
            labelPosition: 'left',
            items: [{ name: 'text', text: 'text' }],
          },
        ],
      },
    ]);

    await nextTick();

    const item = wrapper.findAllComponents({ name: 'TMFormItem' }).find((w) => w.props('prop') === 'text');
    expect(item?.props('labelPosition')).toBe('left');
  });

  test('dynamic 新增标签页的值被规整', async () => {
    const wrapper = getWrapper(
      [
        {
          type: 'tab',
          name: 'tabs',
          dynamic: true,
          editable: true,
          items: [
            {
              type: 'date',
              name: 'start',
              text: '开始',
              valueFormat: 'YYYY-MM-DD',
              defaultValue: '2021/07/17 15:37:00',
            },
          ],
        },
      ] as any,
      { tabs: [] },
    );

    await nextTick();

    wrapper.findComponent(ElTabs).vm.$emit('tabAdd');
    await nextTick();
    await nextTick();

    expect((wrapper.vm as any).values.tabs[0].start).toBe('2021-07-17');
  });

  test('自定义 onTabAdd 之后新增页的值也被规整', async () => {
    const wrapper = getWrapper(
      [
        {
          type: 'tab',
          name: 'tabs',
          dynamic: true,
          editable: true,
          onTabAdd: (_mForm: any, { model }: any) => {
            model.tabs.push({ start: '2021/07/17 15:37:00' });
          },
          items: [
            {
              type: 'date',
              name: 'start',
              text: '开始',
              valueFormat: 'YYYY-MM-DD',
            },
          ],
        },
      ] as any,
      { tabs: [] },
    );

    await nextTick();

    wrapper.findComponent(ElTabs).vm.$emit('tabAdd');
    await nextTick();
    await nextTick();

    expect((wrapper.vm as any).values.tabs[0].start).toBe('2021-07-17');
  });
});
