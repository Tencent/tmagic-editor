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
import type { FormState } from '@form/index';
import { datetimeFormatter, display, filterFunction, getRules, initValue } from '@form/utils/form';

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
