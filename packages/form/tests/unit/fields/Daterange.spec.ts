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
import ElementPlus from 'element-plus';

import MagicForm, { MDaterange, MForm } from '@form/index';

const getWrapper = (
  config: any = [
    {
      type: 'daterange',
      text: 'daterange',
      names: ['start', 'end'],
    },
  ],
  initValues: any = {},
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

describe('Daterange', () => {
  test('基础', async () => {
    const wrapper = getWrapper();

    await nextTick();

    const daterange = wrapper.findComponent(MDaterange);
    expect(daterange.exists()).toBe(true);

    const value = await (wrapper.vm as any).submitForm();
    expect(value.start).toMatch('');
    expect(value.end).toMatch('');
  });

  test('基础初始化', async () => {
    const wrapper = getWrapper([{ type: 'daterange', text: 'daterange' }], {
      daterange: [new Date('2021-7-30 00:00:00'), new Date('2021-7-30 12:00:00')],
    });

    await nextTick();

    const daterange = wrapper.findComponent(MDaterange);
    expect(daterange.exists()).toBe(true);
  });

  test('valueFormat 为 X 时区间收成秒数字', async () => {
    const wrapper = getWrapper([{ type: 'daterange', text: 'daterange', name: 'range', valueFormat: 'X' }], {
      range: [1626507420, 1626593820],
    });

    await nextTick();

    wrapper.findComponent({ name: 'TMDatePicker' }).vm.$emit('update:modelValue', ['1626507420', '1626593820']);
    await nextTick();

    expect((wrapper.vm as any).values.range).toEqual([1626507420, 1626593820]);
  });

  test('valueFormat 为 X 且 names 时分别写入秒数字', async () => {
    const wrapper = getWrapper([{ type: 'daterange', text: 'daterange', names: ['start', 'end'], valueFormat: 'X' }], {
      start: 1626507420,
      end: 1626593820,
    });

    await nextTick();

    wrapper.findComponent({ name: 'TMDatePicker' }).vm.$emit('update:modelValue', ['1626507420', '1626593820']);
    await nextTick();

    expect((wrapper.vm as any).values.start).toBe(1626507420);
    expect((wrapper.vm as any).values.end).toBe(1626593820);
  });
});
