/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
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
import { mount } from '@vue/test-utils';
import ElementPlus, { ElInput } from 'element-plus';

import MagicForm, { MDate, MForm } from '../../../src';

const getWrapper = (
  config: any = [
    {
      text: 'date',
      type: 'date',
      name: 'date',
    },
  ],
  initValues: any = {
    date: '2021-01-01',
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

describe('Date', () => {
  test('基础', (done) => {
    const wrapper = getWrapper();

    setTimeout(async () => {
      const date = wrapper.findComponent(MDate);
      expect(date.exists()).toBe(true);

      const value = await (wrapper.vm as any).submitForm();
      expect(value.date).toMatch('2021-01-01 00:00:00');
      done();
    }, 0);
  });

  test('输入', (done) => {
    const wrapper = getWrapper();

    setTimeout(async () => {
      const input = wrapper.find('input');

      await input.setValue('2021/07/28');
      await input.trigger('blur');

      const value = await (wrapper.vm as any).submitForm();
      expect(input.element.value).toMatch('2021-07-28');
      expect(value.date).toMatch('2021-07-28');
      done();
    }, 0);
  });

  test('清空', (done) => {
    const wrapper = getWrapper();

    setTimeout(async () => {
      const elInput = wrapper.findComponent(ElInput);
      await elInput.trigger('mouseenter');

      const clear = wrapper.find('.clear-icon');

      expect(clear.exists()).toBe(true);
      await clear.trigger('click');
      expect((wrapper.vm as any).values.date).toBeNull();
      done();
    }, 0);
  });
});
