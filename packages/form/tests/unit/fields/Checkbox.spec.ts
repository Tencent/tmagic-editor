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

import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';

import MagicForm, { MCheckbox, MForm } from '../../../src';

const getWrapper = (
  config: any = [
    {
      text: 'checkbox',
      type: 'checkbox',
      name: 'checkbox',
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

describe('Checkbox', () => {
  it('基础', (done) => {
    const wrapper = getWrapper();

    setTimeout(async () => {
      const checkbox = wrapper.findComponent(MCheckbox);
      expect(checkbox.exists()).toBe(true);

      const value = await (wrapper.vm as any).submitForm();
      expect(value.checkbox).toBe(false);
      done();
    }, 0);
  });

  it('数字默认值', (done) => {
    const wrapper = getWrapper([
      {
        type: 'checkbox',
        name: 'checkbox',
        filter: 'number',
        text: 'cehckbox',
      },
    ]);

    setTimeout(async () => {
      const input = wrapper.find('input');
      expect(input.exists()).toBe(true);
      await input.trigger('click');
      expect((wrapper.vm as any).values.checkbox).toBe(1);
      await input.trigger('click');
      expect((wrapper.vm as any).values.checkbox).toBe(0);
      done();
    }, 0);
  });

  it('点击选中', (done) => {
    const wrapper = getWrapper([
      {
        text: 'checkbox',
        type: 'checkbox',
        name: 'checkbox',
        activeValue: 'clicked',
        inactiveValue: 'unclicked',
        defaultValue: 'clicked',
      },
    ]);

    setTimeout(async () => {
      const input = wrapper.find('input');
      expect(input.exists()).toBe(true);
      const value = await (wrapper.vm as any).submitForm();
      expect(value.checkbox).toMatch('clicked');

      await input.trigger('click');
      expect((wrapper.vm as any).values.checkbox).toMatch('unclicked');
      await input.trigger('click');
      expect((wrapper.vm as any).values.checkbox).toMatch('clicked');
      done();
    }, 0);
  });
});
