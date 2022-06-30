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
import ElementPlus, { ElColorPicker } from 'element-plus';

import MagicForm, { MColorPicker, MForm } from '../../../src';

const getWrapper = (
  config: any = [
    {
      type: 'color-picker',
      name: 'picker',
      text: 'color picker',
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

describe('ColorPicker', () => {
  test('基础', (done) => {
    const wrapper = getWrapper();

    setTimeout(async () => {
      const picker = wrapper.findComponent(MColorPicker);
      expect(picker.exists()).toBe(true);

      const value = await (wrapper.vm as any).submitForm();
      expect(value.picker).toMatch('');
      done();
    }, 0);
  });

  test('选择颜色', (done) => {
    const wrapper = getWrapper([
      {
        type: 'color-picker',
        name: 'picker',
        text: 'color picker',
        defaultValue: 'rgba(255, 255, 255, 1)',
      },
    ]);

    setTimeout(async () => {
      const value = await (wrapper.vm as any).submitForm();
      expect(value.picker).toMatch('rgba(255, 255, 255, 1)');

      const picker = wrapper.findComponent(ElColorPicker);
      expect(picker.exists()).toBe(true);
      await picker.setValue('rgba(0, 255, 255, 1)');
      picker.vm.$emit('change', 'rgba(0, 255, 255, 1)');

      const value2 = await (wrapper.vm as any).submitForm();
      expect(value2.picker).toMatch('rgba(0, 255, 255, 1)');
      done();
    }, 0);
  });
});
