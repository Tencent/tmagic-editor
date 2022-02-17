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

import MagicForm, { MForm, MRadioGroup } from '../../../src';

const getWrapper = (
  config: any = [
    {
      text: 'radioGroup',
      type: 'radio-group',
      name: 'radioGroup',
      options: [
        {
          value: 1,
          text: 'one',
        },
        {
          value: 2,
          text: 'two',
        },
      ],
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

describe('RadioGroup', () => {
  it('基础', (done) => {
    const wrapper = getWrapper();

    setTimeout(async () => {
      const radioGroup = wrapper.findComponent(MRadioGroup);
      expect(radioGroup.exists()).toBe(true);

      const value = await (wrapper.vm as any).submitForm();
      expect(value.radioGroup).toMatch('');
      done();
    }, 0);
  });

  it('默认选中', (done) => {
    const wrapper = getWrapper(
      [
        {
          text: 'radioGroup',
          type: 'radio-group',
          name: 'radioGroup',
          options: [
            {
              value: 1,
              text: 'one',
            },
            {
              value: 2,
              text: 'two',
            },
          ],
        },
      ],
      {
        radioGroup: 1,
      },
    );

    setTimeout(async () => {
      const value = await (wrapper.vm as any).submitForm();
      expect(value.radioGroup).toEqual(1);
      done();
    }, 0);
  });

  it('点击选中', (done) => {
    const wrapper = getWrapper(
      [
        {
          text: 'radioGroup',
          type: 'radio-group',
          name: 'radioGroup',
          options: [
            {
              value: 1,
              text: 'one',
            },
            {
              value: 2,
              text: 'two',
            },
          ],
        },
      ],
      {
        radioGroup: 1,
      },
    );

    setTimeout(async () => {
      const options = wrapper.findAll('.el-radio__original');
      expect(options.length).toBe(2);

      await options[1].trigger('click');

      const value = await (wrapper.vm as any).submitForm();
      expect(value.radioGroup).toBe(2);
      done();
    }, 0);
  });
});
