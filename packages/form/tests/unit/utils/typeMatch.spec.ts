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

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { FormState } from '@form/index';
import { getRules } from '@form/utils/form';
import {
  clearTypeMatchRules,
  createTypeMatchValidator,
  deleteTypeMatchRule,
  getTypeMatchRule,
  registerTypeMatchRule,
  registerTypeMatchRules,
  validateTypeMatch,
} from '@form/utils/typeMatch';

import { setDesignConfig } from '@tmagic/design';

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
  $message: (() => Promise.resolve()) as any,
};

const propsOf = (config: Record<string, any>, model: Record<string, any> = {}) => ({
  config: {
    name: 'field',
    ...config,
  },
  model,
  prop: config.name || config.prop || 'field',
});

describe('validateTypeMatch', () => {
  test('空值直接通过', () => {
    expect(validateTypeMatch(undefined, mForm, propsOf({ type: 'text' }))).toBeUndefined();
    expect(validateTypeMatch(null, mForm, propsOf({ type: 'text' }))).toBeUndefined();
    expect(validateTypeMatch('', mForm, propsOf({ type: 'text' }))).toBeUndefined();
    expect(validateTypeMatch([], mForm, propsOf({ type: 'select', multiple: true }))).toBeUndefined();
  });

  test('config 未配置 name 时跳过校验', () => {
    const noNameProps = { config: { type: 'text' }, model: {} };
    expect(validateTypeMatch(123, mForm, noNameProps)).toBeUndefined();
    expect(validateTypeMatch({ a: 1 }, mForm, { config: { type: 'number' }, model: {} })).toBeUndefined();
    expect(
      validateTypeMatch('bad', mForm, {
        config: { type: 'select', options: [{ text: 'A', value: 'a' }] },
        model: {},
      }),
    ).toBeUndefined();
    expect(validateTypeMatch(123, mForm, { config: undefined, model: {} })).toBeUndefined();
  });

  test('0 / false 不视为空值', () => {
    expect(validateTypeMatch(0, mForm, propsOf({ type: 'number' }))).toBeUndefined();
    expect(validateTypeMatch(false, mForm, propsOf({ type: 'switch' }))).toBeUndefined();
  });

  test('display / hidden 不校验', () => {
    expect(validateTypeMatch(123, mForm, propsOf({ type: 'display' }))).toBeUndefined();
    expect(validateTypeMatch({ a: 1 }, mForm, propsOf({ type: 'hidden' }))).toBeUndefined();
  });

  test('text 期望 string，允许 number', () => {
    expect(validateTypeMatch('ok', mForm, propsOf({ type: 'text' }))).toBeUndefined();
    expect(validateTypeMatch(1, mForm, propsOf({ type: 'text' }))).toBeUndefined();
    expect(validateTypeMatch(0, mForm, propsOf({ type: 'text' }))).toBeUndefined();
    expect(validateTypeMatch(NaN, mForm, propsOf({ type: 'text' }))).toBe(
      'NaN 类型应为字符串\n\n请参考以下示例值："文本内容"',
    );
    expect(validateTypeMatch({ a: 1 }, mForm, propsOf({ type: 'text' }))).toBe(
      '[object Object] 类型应为字符串\n\n请参考以下示例值："文本内容"',
    );
    expect(validateTypeMatch(true, mForm, propsOf({ type: 'text' }), '自定义错误')).toBe('自定义错误');
  });

  test('text filter=number 时期望 number', () => {
    expect(validateTypeMatch(1, mForm, propsOf({ type: 'text', filter: 'number' }))).toBeUndefined();
    expect(validateTypeMatch(0, mForm, propsOf({ type: 'text', filter: 'number' }))).toBeUndefined();
    expect(validateTypeMatch('1', mForm, propsOf({ type: 'text', filter: 'number' }))).toBe(
      '1 类型应为数字\n\n请参考以下示例值：123',
    );
    expect(validateTypeMatch(NaN, mForm, propsOf({ type: 'textarea', filter: 'number' }))).toBe(
      'NaN 类型应为数字\n\n请参考以下示例值：123',
    );
  });

  test('text 自定义 filter 函数时跳过内置类型校验', () => {
    expect(validateTypeMatch({ a: 1 }, mForm, propsOf({ type: 'text', filter: () => ({ a: 1 }) }))).toBeUndefined();
  });

  test('number 期望 number', () => {
    expect(validateTypeMatch(1, mForm, propsOf({ type: 'number' }))).toBeUndefined();
    expect(validateTypeMatch('1', mForm, propsOf({ type: 'number' }))).toBe('1 类型应为数字\n\n请参考以下示例值：123');
    expect(validateTypeMatch(NaN, mForm, propsOf({ type: 'number' }))).toBe(
      'NaN 类型应为数字\n\n请参考以下示例值：123',
    );
  });

  test('date / time / datetime 按 valueFormat（Day.js format）校验', () => {
    // 默认 date: YYYY/MM/DD
    expect(validateTypeMatch('2020/01/01', mForm, propsOf({ type: 'date' }))).toBeUndefined();
    expect(validateTypeMatch('2020-01-01', mForm, propsOf({ type: 'date' }))).toMatch(
      /^值格式应为 YYYY\/MM\/DD\n\n请参考以下示例值："\d{4}\/\d{2}\/\d{2}"$/,
    );
    expect(validateTypeMatch(new Date(), mForm, propsOf({ type: 'datetime' }))).toMatch(
      /^值格式应为 YYYY\/MM\/DD HH:mm:ss\n\n请参考以下示例值："\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}"$/,
    );
    expect(validateTypeMatch(1710000000000, mForm, propsOf({ type: 'time' }))).toMatch(
      /^值格式应为 HH:mm:ss\n\n请参考以下示例值："\d{2}:\d{2}:\d{2}"$/,
    );
    expect(validateTypeMatch('12:30:00', mForm, propsOf({ type: 'time' }))).toBeUndefined();

    // 自定义格式
    expect(
      validateTypeMatch('2020-01-25', mForm, propsOf({ type: 'date', valueFormat: 'YYYY-MM-DD' })),
    ).toBeUndefined();
    expect(
      validateTypeMatch('25/01/2019', mForm, propsOf({ type: 'date', valueFormat: 'DD/MM/YYYY' })),
    ).toBeUndefined();

    // timestamp / x → number
    expect(
      validateTypeMatch(1710000000000, mForm, propsOf({ type: 'date', valueFormat: 'timestamp' })),
    ).toBeUndefined();
    expect(validateTypeMatch(1710000000000, mForm, propsOf({ type: 'datetime', valueFormat: 'x' }))).toBeUndefined();
    expect(validateTypeMatch('2020-01-01', mForm, propsOf({ type: 'date', valueFormat: 'x' }))).toMatch(
      /^值类型应为时间戳数字\n\n请参考以下示例值：\d+$/,
    );
  });

  test('switch / checkbox 默认 true/false', () => {
    expect(validateTypeMatch(true, mForm, propsOf({ type: 'switch' }))).toBeUndefined();
    expect(validateTypeMatch(false, mForm, propsOf({ type: 'checkbox' }))).toBeUndefined();
    expect(validateTypeMatch(1, mForm, propsOf({ type: 'switch' }))).toBe(
      '1 不在合法开关值中\n\n请使用以下某一个值：true；false',
    );
  });

  test('switch / checkbox filter=number 时为 1/0', () => {
    expect(validateTypeMatch(1, mForm, propsOf({ type: 'switch', filter: 'number' }))).toBeUndefined();
    expect(validateTypeMatch(0, mForm, propsOf({ type: 'checkbox', filter: 'number' }))).toBeUndefined();
    expect(validateTypeMatch(true, mForm, propsOf({ type: 'switch', filter: 'number' }))).toBe(
      'true 不在合法开关值中\n\n请使用以下某一个值：1；0',
    );
  });

  test('switch / checkbox 自定义 activeValue/inactiveValue', () => {
    const config = { type: 'switch', activeValue: 'on', inactiveValue: 'off' };
    expect(validateTypeMatch('on', mForm, propsOf(config))).toBeUndefined();
    expect(validateTypeMatch('off', mForm, propsOf(config))).toBeUndefined();
    expect(validateTypeMatch('maybe', mForm, propsOf(config))).toBe(
      'maybe 不在合法开关值中\n\n请使用以下某一个值："on"；"off"',
    );
  });

  test('select 单选值必须在 options 中', () => {
    const config = {
      type: 'select',
      options: [
        { text: 'A', value: 1 },
        { text: 'B', value: 2 },
      ],
    };
    expect(validateTypeMatch(1, mForm, propsOf(config))).toBeUndefined();
    expect(validateTypeMatch(3, mForm, propsOf(config))).toBe('3 不在可选项中\n\n请使用以下某一个值：1；2');
  });

  test('可选项超过 5 个时建议仅展示前 5 个并以「等」省略', () => {
    const config = {
      type: 'select',
      options: [1, 2, 3, 4, 5, 6, 7].map((v) => ({ text: `${v}`, value: v })),
    };
    expect(validateTypeMatch(99, mForm, propsOf(config))).toBe(
      '99 不在可选项中\n\n请使用以下某一个值：1；2；3；4；5 等',
    );
  });

  test('select multiple 校验数组元素', () => {
    const config = {
      type: 'select',
      multiple: true,
      options: [
        { text: 'A', value: 'a' },
        { text: 'B', value: 'b' },
      ],
    };
    expect(validateTypeMatch(['a'], mForm, propsOf(config))).toBeUndefined();
    expect(validateTypeMatch(['a', 'c'], mForm, propsOf(config))).toBe(
      'a,c 不在可选项中\n\n请使用以下某一个值："a"；"b"',
    );
    // multiple 类型不匹配时，示例值基于真实 options（前 2 个值组成的数组）
    expect(validateTypeMatch('a', mForm, propsOf(config))).toBe('a 类型应为数组\n\n请参考以下示例值：["a","b"]');
  });

  test('select multiple 仅 1 个 option 时类型不匹配示例为单元素数组', () => {
    const config = {
      type: 'select',
      multiple: true,
      options: [{ text: 'A', value: 'a' }],
    };
    expect(validateTypeMatch('a', mForm, propsOf(config))).toBe('a 类型应为数组\n\n请参考以下示例值：["a"]');
  });

  test('select options 为函数 / group', () => {
    const fnConfig = {
      type: 'select',
      options: () => [{ text: 'A', value: 1 }],
    };
    expect(validateTypeMatch(1, mForm, propsOf(fnConfig))).toBeUndefined();
    // options 为函数（动态）时，跳过「不在可选项中」枚举校验
    expect(validateTypeMatch(2, mForm, propsOf(fnConfig))).toBeUndefined();

    const groupConfig = {
      type: 'select',
      group: true,
      options: [
        {
          label: 'g',
          disabled: false,
          options: [{ text: 'A', value: 'a' }],
        },
      ],
    };
    expect(validateTypeMatch('a', mForm, propsOf(groupConfig))).toBeUndefined();
    expect(validateTypeMatch('b', mForm, propsOf(groupConfig))).toBe('b 不在可选项中\n\n请使用以下某一个值："a"');
  });

  test('select allowCreate / remote 不做枚举', () => {
    expect(validateTypeMatch('custom', mForm, propsOf({ type: 'select', allowCreate: true }))).toBeUndefined();
    // allowCreate 无 options 时跳过类型校验
    expect(validateTypeMatch({ a: 1 }, mForm, propsOf({ type: 'select', allowCreate: true }))).toBeUndefined();
    expect(validateTypeMatch(['x'], mForm, propsOf({ type: 'select', multiple: true, remote: true }))).toBeUndefined();
    // remote multiple 无 options 时跳过类型校验
    expect(validateTypeMatch('x', mForm, propsOf({ type: 'select', multiple: true, remote: true }))).toBeUndefined();
  });

  test('select allowCreate 有 options 时类型不匹配示例用真实 options', () => {
    // allowCreate + options：非 multiple 传 object，示例取第一个真实 option 值
    const config = {
      type: 'select',
      allowCreate: true,
      options: [
        { text: 'A', value: 'a' },
        { text: 'B', value: 'b' },
      ],
    };
    expect(validateTypeMatch({ a: 1 }, mForm, propsOf(config))).toBe(
      '[object Object] 类型不合法\n\n请参考以下示例值："a"',
    );
    // allowCreate + multiple + options：传非数组，示例取前 2 个真实 option 值组成数组
    expect(validateTypeMatch('a', mForm, propsOf({ ...config, multiple: true }))).toBe(
      'a 类型应为数组\n\n请参考以下示例值：["a","b"]',
    );
  });

  test('radio-group / checkbox-group', () => {
    const radio = {
      type: 'radio-group',
      options: [
        { text: 'A', value: 1 },
        { text: 'B', value: 2 },
      ],
    };
    expect(validateTypeMatch(1, mForm, propsOf(radio))).toBeUndefined();
    expect(validateTypeMatch(3, mForm, propsOf(radio))).toBe('3 不在可选项中\n\n请使用以下某一个值：1；2');

    const checkboxGroup = {
      type: 'checkbox-group',
      options: [
        { text: 'A', value: 'a' },
        { text: 'B', value: 'b' },
      ],
    };
    expect(validateTypeMatch(['a', 'b'], mForm, propsOf(checkboxGroup))).toBeUndefined();
    expect(validateTypeMatch(['c'], mForm, propsOf(checkboxGroup))).toBe(
      'c 不在可选项中\n\n请使用以下某一个值："a"；"b"',
    );

    // type 为驼峰形式 radioGroup，应通过 toLine 归一化后按 radio-group 规则校验
    const radioGroupCamelCase = {
      type: 'radioGroup',
      options: [
        { text: 'A', value: 1 },
        { text: 'B', value: 2 },
      ],
    };
    expect(validateTypeMatch(1, mForm, propsOf(radioGroupCamelCase))).toBeUndefined();
    expect(validateTypeMatch(3, mForm, propsOf(radioGroupCamelCase))).toBe(
      '3 不在可选项中\n\n请使用以下某一个值：1；2',
    );
  });

  test('cascader 静态路径与 valueSeparator', () => {
    const options = [
      {
        value: 'zhejiang',
        label: 'Zhejiang',
        children: [
          {
            value: 'hangzhou',
            label: 'Hangzhou',
          },
        ],
      },
    ];

    expect(validateTypeMatch(['zhejiang', 'hangzhou'], mForm, propsOf({ type: 'cascader', options }))).toBeUndefined();
    expect(validateTypeMatch(['zhejiang', 'ningbo'], mForm, propsOf({ type: 'cascader', options }))).toBe(
      'zhejiang,ningbo 不在可选项中\n\n请使用以下某一个值："hangzhou"',
    );
    expect(
      validateTypeMatch('zhejiang/hangzhou', mForm, propsOf({ type: 'cascader', options, valueSeparator: '/' })),
    ).toBeUndefined();
    // remote 无 options 时跳过类型校验
    expect(validateTypeMatch('bad', mForm, propsOf({ type: 'cascader', remote: true }))).toBeUndefined();
    expect(validateTypeMatch(['a'], mForm, propsOf({ type: 'cascader', remote: true }))).toBeUndefined();
  });

  test('number-range / daterange / table', () => {
    expect(validateTypeMatch([1, 2], mForm, propsOf({ type: 'number-range' }))).toBeUndefined();
    expect(validateTypeMatch([1], mForm, propsOf({ type: 'number-range' }))).toBe(
      '1 类型应为长度为 2 的数字数组\n\n请参考以下示例值：[0, 100]',
    );

    expect(
      validateTypeMatch(['2020/01/01 00:00:00', '2020/01/02 00:00:00'], mForm, propsOf({ type: 'daterange' })),
    ).toBeUndefined();
    expect(validateTypeMatch(['2020-01-01', '2020-01-02'], mForm, propsOf({ type: 'daterange' }))).toMatch(
      /^2020-01-01,2020-01-02 格式应为长度为 2 的 YYYY\/MM\/DD HH:mm:ss 数组\n\n请参考以下示例值：\["\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}", "\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}"\]$/,
    );
    expect(validateTypeMatch(['a'], mForm, propsOf({ type: 'daterange' }))).toMatch(
      /^a 格式应为长度为 2 的 YYYY\/MM\/DD HH:mm:ss 数组\n\n请参考以下示例值：\["\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}", "\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}"\]$/,
    );
    expect(validateTypeMatch([1, 2], mForm, propsOf({ type: 'daterange', valueFormat: 'timestamp' }))).toBeUndefined();
    expect(validateTypeMatch('x', mForm, propsOf({ type: 'daterange', names: ['a', 'b'] }))).toBeUndefined();

    expect(validateTypeMatch([{ id: 1 }], mForm, propsOf({ type: 'table' }))).toBeUndefined();
    // table 无 options，类型不匹配示例回退到通用对象数组示例
    expect(validateTypeMatch({}, mForm, propsOf({ type: 'group-list' }))).toBe(
      '[object Object] 类型应为对象数组\n\n请参考以下示例值：[{}]',
    );
    // table / group-list 元素必须为对象，字符串数组不合法
    expect(validateTypeMatch(['a', 'b'], mForm, propsOf({ type: 'table' }))).toBe(
      'a,b 类型应为对象数组\n\n请参考以下示例值：[{}]',
    );
    expect(validateTypeMatch([1], mForm, propsOf({ type: 'group-list' }))).toBe(
      '1 类型应为对象数组\n\n请参考以下示例值：[{}]',
    );
    // 数组中混入非对象元素也不合法
    expect(validateTypeMatch([{ id: 1 }, 'x'], mForm, propsOf({ type: 'grouplist' }))).toBe(
      '[object Object],x 类型应为对象数组\n\n请参考以下示例值：[{}]',
    );
  });

  test('容器类字段 no-op', () => {
    expect(validateTypeMatch({ a: 1 }, mForm, propsOf({ type: 'fieldset', items: [] }))).toBeUndefined();
    expect(validateTypeMatch(1, mForm, propsOf({ type: 'panel', items: [] }))).toBeUndefined();
  });

  test('无 type 时跳过校验', () => {
    expect(validateTypeMatch('ok', mForm, propsOf({}))).toBeUndefined();
    expect(validateTypeMatch(1, mForm, propsOf({}))).toBeUndefined();
  });

  test('textarea / color-picker / html 期望 string', () => {
    expect(validateTypeMatch('ok', mForm, propsOf({ type: 'textarea' }))).toBeUndefined();
    expect(validateTypeMatch('ok', mForm, propsOf({ type: 'color-picker' }))).toBeUndefined();
    expect(validateTypeMatch(1, mForm, propsOf({ type: 'html' }))).toBe(
      '1 类型应为字符串\n\n请参考以下示例值："文本内容"',
    );
  });

  test('checkbox-group 非数组', () => {
    // 类型不匹配时示例基于真实 options（仅 1 个 option → 单元素数组）
    expect(
      validateTypeMatch('a', mForm, propsOf({ type: 'checkbox-group', options: [{ text: 'A', value: 'a' }] })),
    ).toBe('a 类型应为数组\n\n请参考以下示例值：["a"]');
  });

  test('radio-group / checkbox-group 无 options 时跳过校验', () => {
    expect(validateTypeMatch('a', mForm, propsOf({ type: 'radio-group' }))).toBeUndefined();
    expect(validateTypeMatch('a', mForm, propsOf({ type: 'checkbox-group' }))).toBeUndefined();
  });

  test('timerange 按 valueFormat 校验', () => {
    expect(validateTypeMatch(['12:00:00', '13:00:00'], mForm, propsOf({ type: 'timerange' }))).toBeUndefined();
    expect(validateTypeMatch(['bad'], mForm, propsOf({ type: 'timerange' }))).toMatch(
      /^bad 格式应为长度为 2 的 HH:mm:ss 数组\n\n请参考以下示例值：\["\d{2}:\d{2}:\d{2}", "\d{2}:\d{2}:\d{2}"\]$/,
    );
  });

  test('cascader emitPath=false 校验叶子值', () => {
    const options = [
      {
        value: 'zhejiang',
        label: 'Zhejiang',
        children: [{ value: 'hangzhou', label: 'Hangzhou' }],
      },
    ];
    expect(
      validateTypeMatch('hangzhou', mForm, propsOf({ type: 'cascader', options, emitPath: false })),
    ).toBeUndefined();
    expect(validateTypeMatch('ningbo', mForm, propsOf({ type: 'cascader', options, emitPath: false }))).toBe(
      'ningbo 不在可选项中\n\n请使用以下某一个值："hangzhou"',
    );
  });

  test('cascader multiple 且 emitPath=false', () => {
    const options = [
      {
        value: 'zhejiang',
        label: 'Zhejiang',
        children: [{ value: 'hangzhou', label: 'Hangzhou' }],
      },
    ];
    expect(
      validateTypeMatch(['hangzhou'], mForm, propsOf({ type: 'cascader', options, multiple: true, emitPath: false })),
    ).toBeUndefined();
    expect(
      validateTypeMatch(['ningbo'], mForm, propsOf({ type: 'cascader', options, multiple: true, emitPath: false })),
    ).toBe('ningbo 不在可选项中\n\n请使用以下某一个值："hangzhou"');
  });

  test('cascader valueSeparator 时数组值', () => {
    const options = [
      {
        value: 'zhejiang',
        label: 'Zhejiang',
        children: [{ value: 'hangzhou', label: 'Hangzhou' }],
      },
    ];
    expect(
      validateTypeMatch(['zhejiang', 'hangzhou'], mForm, propsOf({ type: 'cascader', options, valueSeparator: '/' })),
    ).toBeUndefined();
  });

  test('cascader 类型不匹配时示例基于真实路径', () => {
    const options = [
      {
        value: 'zhejiang',
        label: 'Zhejiang',
        children: [{ value: 'hangzhou', label: 'Hangzhou' }],
      },
    ];
    // emitPath（默认）单选：示例为完整路径数组
    expect(validateTypeMatch('bad', mForm, propsOf({ type: 'cascader', options }))).toBe(
      'bad 类型应为数组\n\n请参考以下示例值：["zhejiang","hangzhou"]',
    );
    // multiple + emitPath：示例为路径数组的数组
    expect(validateTypeMatch('bad', mForm, propsOf({ type: 'cascader', options, multiple: true }))).toBe(
      'bad 类型应为数组\n\n请参考以下示例值：[["zhejiang","hangzhou"]]',
    );
    // valueSeparator：示例为路径拼接字符串
    expect(validateTypeMatch(123, mForm, propsOf({ type: 'cascader', options, valueSeparator: '/' }))).toBe(
      '123 类型应为字符串或数组\n\n请参考以下示例值："zhejiang/hangzhou"',
    );
    // emitPath=false + multiple：示例为叶子值组成的数组
    expect(
      validateTypeMatch('bad', mForm, propsOf({ type: 'cascader', options, multiple: true, emitPath: false })),
    ).toBe('bad 类型应为数组\n\n请参考以下示例值：["hangzhou"]');
  });

  test('select allowCreate 无 options 时跳过类型校验', () => {
    expect(validateTypeMatch({ a: 1 }, mForm, propsOf({ type: 'select', allowCreate: true }))).toBeUndefined();
  });

  test('动态 type 函数解析', () => {
    expect(validateTypeMatch('ok', mForm, propsOf({ type: () => 'text', name: 'field' }))).toBeUndefined();
    expect(validateTypeMatch(1, mForm, propsOf({ type: () => 'number', name: 'field' }))).toBeUndefined();
  });

  test('type 为异步函数（返回 Promise）时跳过校验', () => {
    expect(
      validateTypeMatch('ok', mForm, propsOf({ type: () => Promise.resolve('text'), name: 'field' })),
    ).toBeUndefined();
    expect(validateTypeMatch(123, mForm, propsOf({ type: async () => 'number', name: 'field' }))).toBeUndefined();
    // 即便值类型明显不匹配，异步 type 也跳过校验
    expect(validateTypeMatch({ a: 1 }, mForm, propsOf({ type: async () => 'text', name: 'field' }))).toBeUndefined();
  });

  test('cascader valueSeparator 为异步函数（返回 Promise）时跳过校验', () => {
    const options = [
      {
        value: 'zhejiang',
        label: 'Zhejiang',
        children: [{ value: 'hangzhou', label: 'Hangzhou' }],
      },
    ];
    // valueSeparator 异步时无法同步确定分隔符，跳过校验（即便值类型不匹配也不报错）
    expect(
      validateTypeMatch(123, mForm, propsOf({ type: 'cascader', options, valueSeparator: () => Promise.resolve('/') })),
    ).toBeUndefined();
    expect(
      validateTypeMatch('bad', mForm, propsOf({ type: 'cascader', options, valueSeparator: async () => '/' })),
    ).toBeUndefined();
  });

  test('defaultValue 为异步函数（返回 Promise）时示例回退到通用值', () => {
    // defaultValue 异步时无法同步获取，错误信息中的示例值回退到通用示例，不报错也不 crash
    expect(validateTypeMatch('1', mForm, propsOf({ type: 'number', defaultValue: () => Promise.resolve(123) }))).toBe(
      '1 类型应为数字\n\n请参考以下示例值：123',
    );
    expect(validateTypeMatch({ a: 1 }, mForm, propsOf({ type: 'text', defaultValue: async () => '示例' }))).toBe(
      '[object Object] 类型应为字符串\n\n请参考以下示例值："文本内容"',
    );
  });
});

describe('getRules typeMatch', () => {
  test('未配置 typeMatch 时行为不变', () => {
    const rules: any = [{ required: true, message: '必填' }];
    const newRules = getRules(mForm, rules, propsOf({ type: 'text' }));
    expect(newRules).toHaveLength(1);
    expect(newRules[0].required).toBe(true);
    expect((newRules[0] as any).validator).toBeUndefined();
  });

  test('typeMatch 注入 validator 并校验失败', () => {
    const rules: any = [{ typeMatch: true, message: '类型错误' }];
    const newRules: any = getRules(mForm, rules, propsOf({ type: 'text' }));
    const callback = vi.fn();
    newRules[0].validator({}, { a: 1 }, callback);
    expect(callback).toHaveBeenCalledWith(expect.any(Error));
    expect(callback.mock.calls[0][0].message).toBe('类型错误');
  });

  test('typeMatch 校验通过时 callback 无参调用', () => {
    const rules: any = [{ typeMatch: true }];
    const newRules: any = getRules(mForm, rules, propsOf({ type: 'text' }));
    const callback = vi.fn();
    newRules[0].validator({}, 'ok', callback);
    expect(callback).toHaveBeenCalledWith();
  });

  test('typeMatch 与自定义 validator 共存，先做类型校验', () => {
    const custom = vi.fn((_params: any, _ctx: any, _form: any) => {
      _params.callback();
    });
    const rules: any = [{ typeMatch: true, validator: custom }];
    const newRules: any = getRules(mForm, rules, propsOf({ type: 'number' }));

    const failCallback = vi.fn();
    newRules[0].validator({}, 'bad', failCallback);
    expect(failCallback).toHaveBeenCalledWith(expect.any(Error));
    expect(custom).not.toHaveBeenCalled();

    const okCallback = vi.fn();
    newRules[0].validator({}, 1, okCallback);
    expect(custom).toHaveBeenCalled();
    expect(okCallback).toHaveBeenCalledWith();
  });
});

describe('getRules tdesign validator', () => {
  beforeEach(() => {
    setDesignConfig({ adapterType: 'tdesign-vue-next' });
  });

  afterEach(() => {
    setDesignConfig({});
  });

  test('typeMatch 校验失败时返回 CustomValidateObj', async () => {
    const rules: any = [{ typeMatch: true, message: '类型错误' }];
    const newRules: any = getRules(mForm, rules, propsOf({ type: 'text' }));
    // TDesign 调用签名：validator(val)
    await expect(newRules[0].validator({ a: 1 })).resolves.toEqual({
      result: false,
      message: '类型错误',
    });
  });

  test('typeMatch 校验通过时返回 true', async () => {
    const rules: any = [{ typeMatch: true }];
    const newRules: any = getRules(mForm, rules, propsOf({ type: 'text' }));
    await expect(newRules[0].validator('ok')).resolves.toBe(true);
  });

  test('自定义 validator 通过 callback 报告错误', async () => {
    const rules: any = {
      validator: ({ value, callback }: any) => {
        if (value < 0) {
          callback(new Error('不能为负'));
          return;
        }
        callback();
      },
    };
    const newRules: any = getRules(mForm, rules, { config: {} });
    await expect(newRules[0].validator(-1)).resolves.toEqual({
      result: false,
      message: '不能为负',
    });
    await expect(newRules[0].validator(1)).resolves.toBe(true);
  });
});

describe('typeMatch 扩展注册', () => {
  beforeEach(() => {
    clearTypeMatchRules();
  });

  afterEach(() => {
    clearTypeMatchRules();
  });

  test('registerTypeMatchRule 可覆盖内置 text 规则', () => {
    registerTypeMatchRule('text', (value, { message }) => {
      if (typeof value !== 'string' || !value.startsWith('magic')) {
        return message || '必须以 magic 开头';
      }
      return undefined;
    });

    // 覆盖后：普通 string 不再直接通过
    expect(validateTypeMatch('hello', mForm, propsOf({ type: 'text' }))).toBe('必须以 magic 开头');
    expect(validateTypeMatch('magic-ok', mForm, propsOf({ type: 'text' }))).toBeUndefined();
  });

  test('可为业务自定义字段 type 扩展校验', () => {
    registerTypeMatchRule('vs-code', (value, { message }) => {
      if (typeof value !== 'string') {
        return message || '代码字段应为字符串';
      }
      return undefined;
    });

    expect(validateTypeMatch(123, mForm, propsOf({ type: 'vs-code' }))).toBe('代码字段应为字符串');
    expect(validateTypeMatch('const a = 1', mForm, propsOf({ type: 'vsCode' }))).toBeUndefined();
  });

  test('registerTypeMatchRules 批量注册 + delete/get', () => {
    registerTypeMatchRules({
      foo: () => 'foo error',
      bar: () => undefined,
    });

    expect(getTypeMatchRule('foo')).toBeTypeOf('function');
    expect(validateTypeMatch(1, mForm, propsOf({ type: 'foo' }))).toBe('foo error');
    expect(validateTypeMatch(1, mForm, propsOf({ type: 'bar' }))).toBeUndefined();

    expect(deleteTypeMatchRule('foo')).toBe(true);
    expect(getTypeMatchRule('foo')).toBeUndefined();
    // 删除后回退到内置：未知 type 默认通过
    expect(validateTypeMatch(1, mForm, propsOf({ type: 'foo' }))).toBeUndefined();
  });

  test('自定义规则可覆盖 display（内置跳过）', () => {
    expect(validateTypeMatch(123, mForm, propsOf({ type: 'display' }))).toBeUndefined();

    registerTypeMatchRule('display', (value, { message }) => {
      if (typeof value !== 'string') {
        return message || 'display 自定义为 string';
      }
      return undefined;
    });

    expect(validateTypeMatch(123, mForm, propsOf({ type: 'display' }))).toBe('display 自定义为 string');
  });

  test('registerTypeMatchRules 批量注册', () => {
    registerTypeMatchRules({
      batch: () => 'batch error',
    });
    expect(validateTypeMatch(1, mForm, propsOf({ type: 'batch' }))).toBe('batch error');
  });
});

describe('plugin typeMatchRules', () => {
  beforeEach(() => {
    clearTypeMatchRules();
  });

  afterEach(() => {
    clearTypeMatchRules();
  });

  test('install 时注册 typeMatchRules', async () => {
    const { createApp } = await import('vue');
    const plugin = (await import('@form/plugin')).default;

    const app = createApp({});
    plugin.install(app, {
      typeMatchRules: {
        'install-type': (value) => (value === 'ok' ? undefined : 'install error'),
      },
    });

    expect(validateTypeMatch('ok', mForm, propsOf({ type: 'install-type' }))).toBeUndefined();
    expect(validateTypeMatch('bad', mForm, propsOf({ type: 'install-type' }))).toBe('install error');
  });
});

describe('createTypeMatchValidator', () => {
  beforeEach(() => {
    clearTypeMatchRules();
  });

  afterEach(() => {
    clearTypeMatchRules();
  });

  test('validateTypeMatch 抛异常时仍执行原始 validator', () => {
    registerTypeMatchRule('throw', () => {
      throw new Error('boom');
    });

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const originalValidator = vi.fn();
    const validator = createTypeMatchValidator(mForm, propsOf({ type: 'throw' }), {
      validator: originalValidator,
    } as any);

    validator({}, 'value', () => {}, {}, {});
    expect(originalValidator).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
