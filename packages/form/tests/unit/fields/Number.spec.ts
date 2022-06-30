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
import ElementPlus from 'element-plus';

import MagicForm, { MForm, MNumber } from '../../../src';

const getWrapper = (
  config: any = [
    {
      type: 'number',
      name: 'number',
      text: 'number',
    },
  ],
  initValues: any = {
    text: 'number',
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

describe('Number', () => {
  test('基础功能', (done) => {
    const wrapper = getWrapper();
    setTimeout(async () => {
      const num = wrapper.findComponent(MNumber);
      expect(num.exists()).toBe(true);
      const value = await (wrapper.vm as any).submitForm();
      expect(value.number).toBe(0);
      done();
    }, 0);
  });

  test('默认值', (done) => {
    const wrapper = getWrapper([
      {
        text: 'number',
        type: 'number',
        name: 'number',
        defaultValue: 5,
      },
    ]);

    setTimeout(async () => {
      const value = await (wrapper.vm as any).submitForm();
      expect(value.number).toBe(5);
      done();
    }, 0);
  });

  test('增加减少', (done) => {
    const wrapper = getWrapper([
      {
        text: 'number',
        type: 'number',
        name: 'number',
        step: 2,
      },
    ]);

    setTimeout(async () => {
      const increase = wrapper.find('.el-input-number__increase');
      const decrease = wrapper.find('.el-input-number__decrease');
      expect(increase.exists()).toBe(true);
      expect(decrease.exists()).toBe(true);

      await increase.trigger('keydown', {
        key: 'enter',
      });

      expect((wrapper.vm as any).values.number).toBe(2);

      await decrease.trigger('keydown', {
        key: 'enter',
      });

      expect((wrapper.vm as any).values.number).toBe(0);
      done();
    });
  });

  test('最大最小值', (done) => {
    const wrapper = getWrapper([
      {
        text: 'number',
        type: 'number',
        name: 'number',
        min: 0,
        max: 10,
      },
    ]);

    setTimeout(async () => {
      const num = wrapper.findComponent(MNumber);
      const input = num.find('input');
      await input.setValue(100);
      expect((wrapper.vm as any).values.number).toBe(10);
      await input.setValue(-10);
      expect((wrapper.vm as any).values.number).toBe(0);
      done();
    }, 0);
  });
});
