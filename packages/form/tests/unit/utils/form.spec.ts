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
import type { FormState } from '@form/index';
import {
  createValues,
  datetimeFormatter,
  display,
  filterFunction,
  getDataByPage,
  getRules,
  initValue,
  sortArray,
  sortChange,
} from '@form/utils/form';

// form state mock 数据
const mForm: FormState = {
  config: [],
  initValues: {},
  parentValues: {},
  values: {},
  lastValues: {},
  isCompare: false,
  $emit: (event: string) => event,
  setField: (prop: string, field: any) => field,
  getField: (prop: string) => prop,
  deleteField: (prop: string) => prop,
  $messageBox: {
    alert: () => Promise.resolve(),
    confirm: () => Promise.resolve(),
    prompt: () => Promise.resolve(),
    close: () => undefined,
  },
  $message: {
    success: () => undefined,
    warning: () => undefined,
    info: () => undefined,
    error: () => undefined,
    closeAll: () => undefined,
  },
};

describe('filterFunction', () => {
  test('config 不为函数', () => {
    expect(filterFunction(mForm, 1, {})).toBe(1);
  });

  test('config 为函数', () => {
    expect(filterFunction(mForm, () => 2, {})).toBe(2);
  });
});

describe('display', () => {
  test('config 不为函数', () => {
    expect(display(mForm, false, {})).toBe(false);
    expect(display(mForm, undefined, {})).toBe(true);
    expect(display(mForm, 0, {})).toBe(true);
    expect(display(mForm, true, {})).toBe(true);
  });

  test('config 为函数', () => {
    expect(display(mForm, () => true, {})).toBe(true);
    expect(display(mForm, () => false, {})).toBe(false);
    expect(display(mForm, () => 1, {})).toBe(1);
  });

  test('config 为 expand', () => {
    expect(display(mForm, 'expand', {})).toBe('expand');
  });
});

describe('getRules', () => {
  test('函数功能', () => {
    // 表单检验规则
    const rules: any = {
      validator: () => 1,
    };
    const props = {
      config: {},
    };
    const newRules: any = getRules(mForm, rules, props);
    expect(newRules[0].validator({} as any, {} as any, {})).toBe(1);
  });
});

describe('initValue', () => {
  test('没有onInitValue', async () => {
    const initValues = {
      a: 1,
      void: [],
      fieldset: {},
      object: {
        o: 'o',
      },
      extensible: {
        e: '3',
        g: 3,
      },
    };
    const config = [
      {
        type: 'text',
        name: 'a',
      },
      {
        type: 'tableSelect',
        name: 'tableSelect',
      },
      {
        type: 'text',
        name: 'b',
      },
      {
        type: 'groupList',
        name: 'groupList',
        items: [
          {
            type: 'text',
            name: 'groupText',
          },
        ],
      },
      {
        name: 'extensible',
        extensible: true,
        items: [
          {
            name: 'e',
          },
        ],
      },
      {
        type: 'fieldset',
        name: 'fieldset',
        items: [
          {
            type: 'text',
            name: 'fieldsetText',
          },
        ],
      },
      {
        items: [
          {
            name: 'f',
          },
          {
            names: ['h', 'i'],
          },
        ],
      },
      {
        name: 'object',
        items: [
          {
            name: 'o',
          },
        ],
      },
    ];
    const values = await initValue(mForm, { initValues, config });

    // text组件
    expect(values.a).toBe(1);
    // text组件
    expect(values.b).toBe('');
    // 数组
    expect(values.groupList).toHaveLength(0);
    expect(typeof values.void).toBe('undefined');
    // 不受form config控制的数据
    expect(values.extensible.e).toBe('3');
    expect(values.extensible.g).toBe(3);
    // 默认组件（text)
    expect(values.f).toBe('');
    // 默认组件（text) names
    expect(values.h).toBe('');
    // 默认组件（text) names
    expect(values.i).toBe('');
    // 可选表格
    expect(values.tableSelect).toBe('');
    expect(values.object.o).toBe('o');
  });

  test('有onInitValue', async () => {
    const initValues = {
      a: 1,
    };
    const config = [
      {
        type: 'text',
        name: 'a',
        onInitValue: () => [],
      },
      {
        type: 'text',
        name: 'b',
      },
    ];
    const values = await initValue(mForm, { initValues, config });
    expect(values).toHaveLength(0);
  });

  test('defaultValue', async () => {
    const initValues = {
      a: 1,
    };
    const config = [
      {
        type: 'text',
        name: 'a',
      },
      {
        type: 'text',
        name: 'b',
        defaultValue: 2,
      },
      {
        type: 'text',
        name: 'c',
        defaultValue: () => 3,
      },
      {
        name: 'd',
        items: [
          {
            type: 'text',
            name: 'd',
            defaultValue: 'undefined',
          },
          {
            name: 'e',
            items: [
              {
                name: 'e',
                type: 'number',
              },
              {
                name: 'f',
                filter: 'number',
              },
              {
                name: 'checkbox',
                type: 'checkbox',
              },
              {
                name: 'switch',
                type: 'switch',
              },
            ],
          },
          {
            name: 'multiple',
            multiple: true,
          },
        ],
      },
    ];
    const values = await initValue(mForm, { initValues, config });

    expect(values.a).toBe(1);
    expect(values.b).toBe(2);
    expect(values.c).toBe(3);
    // 需要为undefined时要设置defaultValue为'undefined'字符串，因为undefined的值会被删除
    expect(typeof values.d.d).toBe('undefined');
    expect(values.d.e.e).toBe(0);
    expect(values.d.e.f).toBe(0);
    // checkbox默认值为false
    expect(values.d.e.checkbox).toBe(false);
    // switch默认值为false
    expect(values.d.e.switch).toBe(false);
    // 多选，数据为数组
    expect(values.d.multiple).toHaveLength(0);
  });

  test('fieldset checkbox', async () => {
    const config = [
      {
        type: 'fieldset',
        name: 'fieldset',
        checkbox: true,
        items: [
          {
            name: 'a',
          },
        ],
      },
    ];
    const initValues = {};

    const values = await initValue(mForm, { initValues, config });
    // fieldset checkbox 为true时会有一个value值表示checkbox是否勾选
    expect(values.fieldset.value).toBe(0);
    expect(values.fieldset.a).toBe('');
  });

  test('table', async () => {
    const config = [
      {
        type: 'table',
        name: 'table',
        items: [
          {
            name: 'a',
          },
        ],
      },
    ];
    const initValues = {
      table: [
        {
          a: 1,
        },
      ],
    };

    const values = await initValue(mForm, { initValues, config });
    expect(values.table).toHaveLength(1);
    expect(values.table[0].a).toBe(1);
  });
});

describe('datetimeFormatter', () => {
  // Date会将时间转为UTC
  const date = new Date('2021-07-17T15:37:00');
  const dateValue = '2021-07-17 15:37:00';
  const defaultValue = '默认值';

  test('v为空且未设置默认时间', () => {
    expect(datetimeFormatter('')).toBe('-');
  });

  test('v是字符串且未设置了默认时间', () => {
    expect(datetimeFormatter('abc', defaultValue)).toMatch(defaultValue);
  });

  test('v是日期字符串', () => {
    expect(datetimeFormatter(date.toISOString(), defaultValue)).toMatch(dateValue);
  });

  test('v是Date对象', () => {
    expect(datetimeFormatter(date)).toMatch(dateValue);
  });

  test('v是UTC字符串', () => {
    expect(datetimeFormatter(date.toUTCString())).toMatch(dateValue);
  });

  test('format是x', () => {
    expect(datetimeFormatter(date.toISOString(), defaultValue, 'timestamp')).toBe(date.getTime());
  });
});

describe('sortArray', () => {
  test('索引相同时不执行任何操作', () => {
    const data = [1, 2, 3, 4, 5];

    expect(sortArray(data, 2, 2)).toEqual(data);
  });

  test('正常交换两个元素的位置', () => {
    const data = [1, 2, 3, 4, 5];

    expect(sortArray(data, 0, 3)).toEqual([4, 1, 2, 3, 5]);
  });

  test('从后往前移动元素', () => {
    const data = [1, 2, 3, 4, 5];

    expect(sortArray(data, 3, 1)).toEqual([1, 3, 4, 2, 5]);
  });

  test('使用sortKey参数重新排序', () => {
    const data = [
      { id: 1, order: 0 },
      { id: 2, order: 1 },
      { id: 3, order: 2 },
      { id: 4, order: 3 },
    ];

    expect(sortArray(data, 0, 2, 'order')).toEqual([
      { id: 3, order: 3 },
      { id: 1, order: 2 },
      { id: 2, order: 1 },
      { id: 4, order: 0 },
    ]);
  });

  test('移动第一个元素到最后', () => {
    const data = [1, 2, 3, 4, 5];

    expect(sortArray(data, 4, 0)).toEqual([2, 3, 4, 5, 1]);
  });

  test('移动最后一个元素到第一个', () => {
    const data = [1, 2, 3, 4, 5];

    expect(sortArray(data, 0, 4)).toEqual([5, 1, 2, 3, 4]);
  });

  test('空数组不执行任何操作', () => {
    const data: any[] = [];

    expect(sortArray(data, 0, 1)).toEqual([]);
  });

  test('只有一个元素的数组不执行任何操作', () => {
    const data = [1];

    expect(sortArray(data, 0, 0)).toEqual([1]);
  });

  test('索引超出范围时正常处理', () => {
    const data = [1, 2, 3];

    // 索引超出范围应该由调用方处理，这里测试函数的行为
    expect(sortArray(data, 5, 1)).toEqual(data);
    expect(sortArray(data, 1, 5)).toEqual(data);
  });

  test('不修改原数组', () => {
    const data = [1, 2, 3, 4, 5];
    const original = [...data];

    sortArray(data, 0, 3);

    expect(data).toEqual(original);
  });

  test('返回的新数组与原数组不是同一引用', () => {
    const data = [1, 2, 3, 4, 5];

    const result = sortArray(data, 0, 3);

    expect(result).not.toBe(data);
  });
});

describe('getDataByPage', () => {
  test('获取第一页数据', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    expect(getDataByPage(data, 0, 3)).toEqual([1, 2, 3]);
  });

  test('获取中间页数据', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    expect(getDataByPage(data, 1, 3)).toEqual([4, 5, 6]);
  });

  test('获取最后一页数据（不足一页）', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    expect(getDataByPage(data, 3, 3)).toEqual([10]);
  });

  test('页码超出范围返回空数组', () => {
    const data = [1, 2, 3, 4, 5];

    expect(getDataByPage(data, 10, 3)).toEqual([]);
  });

  test('空数组返回空数组', () => {
    expect(getDataByPage([], 0, 10)).toEqual([]);
  });

  test('不修改原数组', () => {
    const data = [1, 2, 3, 4, 5];
    const original = [...data];

    getDataByPage(data, 0, 2);

    expect(data).toEqual(original);
  });

  test('默认空数组参数', () => {
    expect(getDataByPage(undefined as any, 0, 10)).toEqual([]);
  });
});

describe('sortChange', () => {
  test('升序排序', () => {
    const data = [{ value: 3 }, { value: 1 }, { value: 2 }];

    sortChange(data, { prop: 'value', order: 'ascending' });

    expect(data).toEqual([{ value: 1 }, { value: 2 }, { value: 3 }]);
  });

  test('降序排序', () => {
    const data = [{ value: 1 }, { value: 3 }, { value: 2 }];

    sortChange(data, { prop: 'value', order: 'descending' });

    expect(data).toEqual([{ value: 3 }, { value: 2 }, { value: 1 }]);
  });

  test('无效的order不进行排序', () => {
    const data = [{ value: 3 }, { value: 1 }, { value: 2 }];
    const original = [{ value: 3 }, { value: 1 }, { value: 2 }];

    sortChange(data, { prop: 'value', order: '' as any });

    expect(data).toEqual(original);
  });

  test('空数组不报错', () => {
    const data: any[] = [];

    expect(() => sortChange(data, { prop: 'value', order: 'ascending' })).not.toThrow();
  });

  test('原地修改数组', () => {
    const data = [{ value: 2 }, { value: 1 }];

    sortChange(data, { prop: 'value', order: 'ascending' });

    expect(data[0].value).toBe(1);
    expect(data[1].value).toBe(2);
  });
});

describe('createValues', () => {
  test('config为空数组返回空对象', () => {
    expect(createValues(mForm, [], {})).toEqual({});
  });

  test('config不是数组返回传入的value', () => {
    const value = { a: 1 };

    expect(createValues(mForm, undefined as any, {}, value)).toEqual(value);
  });

  test('处理简单的text配置', () => {
    const config = [{ type: 'text', name: 'field1' }];
    const initValues = { field1: 'hello' };

    const result = createValues(mForm, config, initValues, {});

    expect(result.field1).toBe('hello');
  });

  test('处理number类型转换', () => {
    const config = [{ type: 'number', name: 'num' }];
    const initValues = { num: '123' };

    const result = createValues(mForm, config, initValues, {});

    expect(result.num).toBe(123);
  });
});
