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
import MagicForm, { MDaterange, MForm } from '@form/index';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';

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
});
