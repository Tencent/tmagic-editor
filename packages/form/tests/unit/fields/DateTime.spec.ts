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
import MagicForm, { MDateTime, MForm } from '@form/index';
import { mount } from '@vue/test-utils';
import ElementPlus, { ElInput } from 'element-plus';

const getWrapper = (
  config: any = [
    {
      text: 'dateTime',
      type: 'datetime',
      name: 'datetime',
    },
  ],
  initValues: any = {
    datetime: new Date('2021/01/01 12:00:00').toISOString(),
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

describe('DateTime', () => {
  test('基础', async () => {
    const wrapper = getWrapper();

    await nextTick();

    const datetime = wrapper.findComponent(MDateTime);
    expect(datetime.exists()).toBe(true);

    const value = await (wrapper.vm as any).submitForm();
    expect(value.datetime).toMatch('2021-01-01 12:00:00');
  });

  test('错误类型初始化初始化', async () => {
    const wrapper = getWrapper(
      [
        {
          text: 'dateTime',
          type: 'datetime',
          name: 'datetime',
        },
      ],
      { datetime: 123 },
    );

    await nextTick();

    const datetime = wrapper.findComponent(MDateTime);
    expect(datetime.exists()).toBe(true);

    const value = await (wrapper.vm as any).submitForm();
    expect(value.datetime).toMatch('');
  });

  test('无效值初始化', async () => {
    const wrapper = getWrapper(
      [
        {
          text: 'dateTime',
          type: 'datetime',
          name: 'datetime',
        },
      ],
      { datetime: 'Invalid Date' },
    );

    await nextTick();

    const datetime = wrapper.findComponent(MDateTime);
    expect(datetime.exists()).toBe(true);

    const value = await (wrapper.vm as any).submitForm();
    expect(value.datetime).toMatch('');
  });
  test('输入日期', async () => {
    const wrapper = getWrapper();

    await nextTick();

    const input = wrapper.find('input');
    await input.setValue('2021/07/28 00:00:00');

    const value = await (wrapper.vm as any).submitForm();
    expect(value.datetime).toMatch('2021-07-28 00:00:00');
  });

  test('清空', async () => {
    const wrapper = getWrapper();

    await nextTick();

    const elInput = wrapper.findComponent(ElInput);
    await elInput.trigger('mouseenter');

    const clear = wrapper.find('.clear-icon');

    expect(clear.exists()).toBe(true);
    await clear.trigger('click');
    expect((wrapper.vm as any).values.datetime).toBeNull();
  });
});
