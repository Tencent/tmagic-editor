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

import MagicForm, { MForm, MTime } from '@form/index';

const getWrapper = (
  config: any = [
    {
      type: 'time',
      text: 'time',
      name: 'time',
    },
  ],
  initValues: any = {
    text: 'time',
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

describe('Time', () => {
  test('基础', async () => {
    const wrapper = getWrapper();

    await nextTick();

    const time = wrapper.findComponent(MTime);
    expect(time.exists()).toBe(true);

    const input = wrapper.find('input');
    expect(input.exists()).toBe(true);
    await input.setValue('12:00:00');

    const value = await (wrapper.vm as any).submitForm();
    expect(value.time).toMatch('12:00:00');
  });

  test('valueFormat 为 X 时把秒字符串收成数字', async () => {
    const wrapper = getWrapper([{ type: 'time', text: 'time', name: 'time', valueFormat: 'X' }], { time: 1626507420 });

    await nextTick();

    wrapper.findComponent({ name: 'TMTimePicker' }).vm.$emit('update:modelValue', '1626507421');
    await nextTick();

    expect((wrapper.vm as any).values.time).toBe(1626507421);
  });
});
