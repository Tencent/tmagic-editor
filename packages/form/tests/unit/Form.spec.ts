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
import MagicForm, { MForm } from '@form/index';
import { mount } from '@vue/test-utils';
import ElementPlus from 'element-plus';

describe('表单', () => {
  test('初始化', async () => {
    const initValues = {};
    const config = [
      {
        text: 'text',
        type: 'text',
        name: 'text',
      },
    ];
    const wrapper = mount(MForm, {
      global: {
        plugins: [ElementPlus as any, MagicForm as any],
      },
      props: {
        initValues,
        config,
      },
    });

    await nextTick();

    expect(wrapper.text()).toBe('text');
  });
});
