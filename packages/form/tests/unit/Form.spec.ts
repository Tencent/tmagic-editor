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
import MagicForm, { createForm, MForm } from '@form/index';
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

  test('changeRecords', async () => {
    const initValues = {};
    const config = [
      {
        text: 'text',
        name: 'text',
      },
      {
        name: 'object',
        items: [
          {
            text: 'text',
            name: 'objectText',
          },
        ],
      },
      {
        items: [
          {
            text: 'text',
            name: 'text1',
          },
        ],
      },

      {
        items: [
          {
            name: 'object',
            items: [
              {
                text: 'text',
                name: 'text1',
              },
            ],
          },
        ],
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

    const inputs = wrapper.findAll('input');

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      input.setValue(i);
    }
    expect(wrapper.vm.changeRecords).toEqual([
      { propPath: 'text', value: '0' },
      { propPath: 'object.objectText', value: '1' },
      { propPath: 'text1', value: '2' },
      { propPath: 'object.text1', value: '3' },
    ]);
    expect(wrapper.vm.values).toEqual({
      text: '0',
      object: {
        objectText: '1',
        text1: '3',
      },
      text1: '2',
    });
  });

  test('onChange setFormValue', async () => {
    const initValues = {};
    const config = createForm([
      {
        text: 'text',
        name: 'text',
        onChange: (vm, value: string, { formValue, setFormValue }: any) => {
          setFormValue('object.objectText', value);
          formValue!.object.objectText2 = value;
        },
      },
      {
        name: 'object',
        items: [
          {
            text: 'text',
            name: 'objectText',
          },
          {
            text: 'text',
            name: 'objectText2',
          },
        ],
      },
    ]);
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

    const input = wrapper.find('input');

    input.setValue('a');

    await nextTick();

    expect(wrapper.vm.changeRecords).toEqual([
      { propPath: 'object.objectText', value: 'a' },
      { propPath: 'object.objectText2', value: 'a' },
      { propPath: 'text', value: 'a' },
    ]);
    expect(wrapper.vm.values).toEqual({
      text: 'a',
      object: {
        objectText: 'a',
        objectText2: 'a',
      },
    });
  });

  test('onChange setModel', async () => {
    const initValues = {};
    const config = createForm([
      {
        name: 'object',
        items: [
          {
            text: 'text',
            name: 'objectText',
            onChange: (vm: any, value: string, { model, setModel }: any) => {
              model.objectText2 = value;
              setModel('objectText3', value);
            },
          },
          {
            text: 'text',
            name: 'objectText2',
          },

          {
            text: 'text',
            name: 'objectText3',
          },
        ],
      },
    ]);
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

    const input = wrapper.find('input');

    input.setValue('a');

    await nextTick();

    expect(wrapper.vm.changeRecords).toEqual([
      { propPath: 'object.objectText2', value: 'a' },
      { propPath: 'object.objectText3', value: 'a' },
      { propPath: 'object.objectText', value: 'a' },
    ]);
    expect(wrapper.vm.values).toEqual({
      object: {
        objectText: 'a',
        objectText2: 'a',
        objectText3: 'a',
      },
    });
  });
});
