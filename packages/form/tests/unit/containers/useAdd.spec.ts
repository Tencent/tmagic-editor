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
import { afterEach, beforeAll, describe, expect, test } from 'vitest';
import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';

import { useAdd } from '@form/containers/table-group-list/useAdd';
import { builtInFields, clearFields, registerBuiltInFields } from '@form/index';

const dateColumn = { type: 'date', name: 'start', text: '开始', valueFormat: 'YYYY-MM-DD' };

const mountAdd = (config: any, model: any) => {
  let added: any;
  let addedEventData: any;
  const comp = defineComponent({
    setup() {
      const { newHandler } = useAdd(
        { name: 'list', model, prop: 'list', config } as any,
        ((event: string, value: any, eventData: any) => {
          if (event === 'change') {
            added = value;
            addedEventData = eventData;
          }
        }) as any,
      );
      return { newHandler };
    },
    template: '<div />',
  });

  const wrapper = mount(comp, {
    global: {
      provide: { mForm: { values: model } },
    },
  });

  return {
    newHandler: (row?: any) => (wrapper.vm as any).newHandler(row),
    getAdded: () => added,
    getAddedEventData: () => addedEventData,
  };
};

beforeAll(() => {
  registerBuiltInFields(builtInFields);
});

afterEach(() => {
  clearFields();
});

describe('useAdd —— 新增行值规整', () => {
  test('enum 路径会对日期列执行 applyMountValueEffects', async () => {
    const model = { list: [] };
    const { newHandler, getAdded } = mountAdd(
      {
        name: 'list',
        items: [dateColumn],
        enum: [{ id: 1, start: '2021/07/17 15:37:00' }],
      },
      model,
    );

    await newHandler();

    expect(getAdded()[0].start).toBe('2021-07-17');
  });

  test('数组行路径（Excel 导入）会对日期列执行 applyMountValueEffects', async () => {
    const model = { list: [] };
    const { newHandler, getAdded } = mountAdd(
      {
        name: 'list',
        items: [dateColumn],
      },
      model,
    );

    await newHandler(['2021/07/17 15:37:00']);

    expect(getAdded()[0].start).toBe('2021-07-17');
  });

  test('model 非数组时按空列表处理，抛出的新值是完整数组', async () => {
    const model: any = {};
    const { newHandler, getAdded, getAddedEventData } = mountAdd(
      {
        name: 'list',
        items: [{ name: 'text', type: 'text' }],
        defaultAdd: { text: 'n' },
      },
      model,
    );

    expect(await newHandler()).toBe(1);
    expect(getAdded()).toHaveLength(1);
    expect(getAdded()[0].text).toBe('n');
    expect(getAddedEventData().changeRecords[0].propPath).toBe('list.0');
  });

  test('只抛 change 不直接改 model，写回交给宿主', async () => {
    const model: any = { list: [{ text: 'a' }] };
    const { newHandler, getAdded, getAddedEventData } = mountAdd(
      {
        name: 'list',
        items: [{ name: 'text', type: 'text' }],
        defaultAdd: { text: 'b' },
      },
      model,
    );

    expect(await newHandler()).toBe(2);
    // 宿主（这里的假 emit）没有写回，model 必须保持原样
    expect(model.list).toEqual([{ text: 'a' }]);
    expect(getAdded()).toHaveLength(2);
    expect(getAddedEventData().changeRecords[0].propPath).toBe('list.1');
  });

  test('beforeAddRow 拦下时不新增也不抛 change', async () => {
    const model: any = { list: [{ text: 'a' }] };
    const { newHandler, getAdded } = mountAdd(
      {
        name: 'list',
        beforeAddRow: () => false,
        items: [{ name: 'text', type: 'text' }],
        defaultAdd: { text: 'b' },
      },
      model,
    );

    expect(await newHandler()).toBeNull();
    expect(getAdded()).toBeUndefined();
    expect(model.list).toEqual([{ text: 'a' }]);
  });
});
