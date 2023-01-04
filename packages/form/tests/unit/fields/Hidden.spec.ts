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
import MagicForm, { MForm, MHidden } from '@form/index';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';

const getWrapper = (
  config: any = [
    {
      text: 'hidden',
      type: 'hidden',
      name: 'hidden',
    },
  ],
  initValues: any = {
    hidden: 'hidden',
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

describe('Hidden', () => {
  test('基础', async () => {
    const wrapper = getWrapper();

    await nextTick();

    const hidden = wrapper.findComponent(MHidden);
    expect(hidden.exists()).toBe(true);

    const value = await (wrapper.vm as any).submitForm();
    expect(value.hidden).toMatch('hidden');
  });

  test('未设置name', async () => {
    const wrapper = getWrapper([
      {
        type: 'hidden',
        text: 'hidden',
        defaultValue: 'hidden',
      },
    ]);

    await nextTick();

    const hidden = wrapper.findComponent(MHidden);
    expect(hidden.exists()).toBe(true);

    const value = await (wrapper.vm as any).submitForm();
    expect(value.hidden).toBeUndefined();
  });
});
