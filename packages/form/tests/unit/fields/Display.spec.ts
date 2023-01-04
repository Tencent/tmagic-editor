/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2023 THL A29 Limited, a Tencent company.  All rights reserved.
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
import MagicForm, { MDisplay, MForm } from '@form/index';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';

const getWrapper = (
  config: any = [
    {
      text: 'display',
      type: 'display',
      name: 'display',
    },
  ],
  initValues: any = {
    display: 'hello',
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

describe('Display', () => {
  test('基础', async () => {
    const wrapper = getWrapper();

    await nextTick();

    const display = wrapper.findComponent(MDisplay);
    expect(display.exists()).toBe(true);

    const value = await (wrapper.vm as any).submitForm();
    expect(value.display).toMatch('hello');
  });

  test('初始化', async () => {
    const wrapper = getWrapper(
      [
        {
          text: 'display',
          type: 'display',
          name: 'display',
          initValue: 'test',
        },
      ],
      {
        display: 'hello',
      },
    );

    await nextTick();

    const display = wrapper.findComponent(MDisplay);
    expect(display.exists()).toBe(true);

    const value = await (wrapper.vm as any).submitForm();
    expect(value.display).toMatch('test');
  });
});
