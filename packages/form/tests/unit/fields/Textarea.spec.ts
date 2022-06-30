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

import MagicForm, { MForm, MTextarea } from '../../../src';

const getWrapper = (
  config: any = [
    {
      type: 'textarea',
      text: 'textarea',
      name: 'textarea',
    },
  ],
  initValues: any = {
    text: 'textarea',
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

describe('Textarea', () => {
  test('基础', (done) => {
    const wrapper = getWrapper();

    setTimeout(async () => {
      const textarea = wrapper.findComponent(MTextarea);
      expect(textarea.exists()).toBe(true);

      const input = wrapper.find('textarea');
      await input.setValue('hello');

      await textarea.trigger('input');
      await textarea.trigger('change');

      const value = await (wrapper.vm as any).submitForm();
      expect(value.textarea).toMatch('hello');
      done();
    }, 0);
  });
});
