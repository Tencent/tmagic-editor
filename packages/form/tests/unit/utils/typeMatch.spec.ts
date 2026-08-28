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
import { clearFields } from '@form/utils/registerField';
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
import { getDesignConfig } from '@tmagic/design/headless';

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

  test('可选项超过 20 个时建议仅举例前 5 个并标明总数', () => {
    const values = Array.from({ length: 21 }, (_, i) => i + 1);
    const config = {
      type: 'select',
      options: values.map((v) => ({ text: `${v}`, value: v })),
    };
    expect(validateTypeMatch(99, mForm, propsOf(config))).toBe(
      `99 不在可选项中\n\n请从可选项中选用合法值（共 21 个，例如：${values.slice(0, 5).join('；')}）`,
    );
  });

  test('可选项未超过 20 个时建议全部列举', () => {
    const values = Array.from({ length: 20 }, (_, i) => i + 1);
    const config = {
      type: 'select',
      options: values.map((v) => ({ text: `${v}`, value: v })),
    };
    expect(validateTypeMatch(99, mForm, propsOf(config))).toBe(
      `99 不在可选项中\n\n请使用以下某一个值：${values.join('；')}`,
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

  test('typeMatch: false 标记规则会被过滤，避免默认按 string 校验', () => {
    const custom = vi.fn(({ callback }: any) => callback());
    const rules: any = [{ typeMatch: false }, { validator: custom }];
    const typeMatchValid = { value: true } as any;
    const newRules: any = getRules(mForm, rules, propsOf({ type: 'select' }), typeMatchValid);

    // 仅保留自定义 validator；不会自动注入 typeMatch: true；也不会留下空的 typeMatch:false 规则
    expect(newRules).toHaveLength(1);
    expect(newRules[0].typeMatch).toBeUndefined();
    expect(typeof newRules[0].validator).toBe('function');

    const callback = vi.fn();
    newRules[0].validator({}, 700, callback);
    expect(custom).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith();
  });

  test('typeMatch: false 与 validator 写在同一条 rule 时保留', () => {
    const custom = vi.fn(({ callback }: any) => callback());
    const rules: any = [{ typeMatch: false, validator: custom }];
    const newRules: any = getRules(mForm, rules, propsOf({ type: 'select' }));

    expect(newRules).toHaveLength(1);
    expect(newRules[0].typeMatch).toBe(false);
    expect(typeof newRules[0].validator).toBe('function');
  });
});

describe('design 配置入口', () => {
  // 无渲染链路读的是 @tmagic/design/headless（窄入口，不带组件），而 app.use(designPlugin)
  // 写的是 @tmagic/design。两个入口必须落在同一份 design 配置上，否则适配器判定会静默失效。
  test('@tmagic/design 与 @tmagic/design/headless 共用同一份配置', () => {
    setDesignConfig({ adapterType: 'tdesign-vue-next' });
    expect(getDesignConfig('adapterType')).toBe('tdesign-vue-next');

    setDesignConfig({});
    expect(getDesignConfig('adapterType')).toBeUndefined();
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

  test('异步 typeMatch 校验器的结果能正确适配', async () => {
    registerTypeMatchRule('async-type', async (value) => (value === 'ok' ? undefined : '异步校验失败'));

    const rules: any = [{ typeMatch: true }];
    const newRules: any = getRules(mForm, rules, propsOf({ type: 'async-type' }));

    await expect(newRules[0].validator('ok')).resolves.toBe(true);
    await expect(newRules[0].validator('bad')).resolves.toEqual({
      result: false,
      message: '异步校验失败',
    });

    deleteTypeMatchRule('async-type');
  });

  test('自定义 validator 返回 Promise 时按 Promise 结果适配', async () => {
    const rules: any = [
      { validator: () => Promise.resolve() },
      { validator: () => Promise.reject(new Error('异步失败')) },
      { validator: () => Promise.reject('非 Error') },
    ];
    const newRules: any = getRules(mForm, rules, { config: {} });

    await expect(newRules[0].validator('ok')).resolves.toBe(true);
    await expect(newRules[1].validator('ok')).resolves.toEqual({
      result: false,
      message: '异步失败',
    });
    await expect(newRules[2].validator('ok')).resolves.toEqual({
      result: false,
      message: '非 Error',
    });
  });

  test('自定义 validator 同步抛错时转成 CustomValidateObj', async () => {
    const rules: any = [
      {
        validator: () => {
          throw new Error('validator 内部抛错');
        },
      },
      {
        validator: () => {
          throw 'string error';
        },
      },
    ];
    const newRules: any = getRules(mForm, rules, { config: {} });

    await expect(newRules[0].validator('ok')).resolves.toEqual({
      result: false,
      message: 'validator 内部抛错',
    });
    await expect(newRules[1].validator('ok')).resolves.toEqual({
      result: false,
      message: 'string error',
    });
  });

  test('callback 收到错误数组时取首条展示', async () => {
    const rules: any = [
      {
        validator: ({ callback }: any) => {
          callback([new Error('错误一'), new Error('错误二')]);
        },
      },
      {
        validator: ({ callback }: any) => {
          callback([]);
        },
      },
    ];
    const newRules: any = getRules(mForm, rules, { config: {} });

    await expect(newRules[0].validator('ok')).resolves.toEqual({
      result: false,
      message: '错误一',
    });
    // 空数组视为无错误
    await expect(newRules[1].validator('ok')).resolves.toBe(true);
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

  test('clearTypeMatchRules / deleteTypeMatchRule 不清内置规则', () => {
    registerTypeMatchRule('built-in-keep', () => 'built-in', true);
    registerTypeMatchRule('built-in-keep', () => 'extra');
    expect(validateTypeMatch(1, mForm, propsOf({ type: 'built-in-keep' }))).toBe('extra');

    expect(deleteTypeMatchRule('built-in-keep')).toBe(true);
    expect(validateTypeMatch(1, mForm, propsOf({ type: 'built-in-keep' }))).toBe('built-in');

    registerTypeMatchRule('built-in-keep', () => 'extra-again');
    clearTypeMatchRules();
    expect(validateTypeMatch(1, mForm, propsOf({ type: 'built-in-keep' }))).toBe('built-in');
  });
});

describe('plugin fields', () => {
  beforeEach(() => {
    clearFields();
  });

  afterEach(() => {
    clearFields();
  });

  test('install 时注册 fields', async () => {
    const { createApp } = await import('vue');
    const plugin = (await import('@form/plugin')).default;

    const app = createApp({});
    plugin.install(app, {
      fields: {
        'install-type': {
          typeMatch: (value) => (value === 'ok' ? undefined : 'install error'),
        },
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

  test('异步校验器返回错误文案时回调 Error', async () => {
    registerTypeMatchRule('async-type', async (value) => (value === 'ok' ? undefined : '异步校验失败'));

    const callback = vi.fn();
    const validator = createTypeMatchValidator(mForm, propsOf({ type: 'async-type' }), { typeMatch: true } as any);

    // 异步校验器不能把 Promise 交还给 async-validator，否则会重复回调
    expect(validator({}, 'bad', callback, {}, {})).toBeUndefined();
    expect(callback).not.toHaveBeenCalled();

    await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    expect(callback.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(callback.mock.calls[0][0].message).toBe('异步校验失败');
  });

  test('异步校验器通过时无参回调', async () => {
    registerTypeMatchRule('async-type', async (value) => (value === 'ok' ? undefined : '异步校验失败'));

    const callback = vi.fn();
    const validator = createTypeMatchValidator(mForm, propsOf({ type: 'async-type' }), { typeMatch: true } as any);

    validator({}, 'ok', callback, {}, {});

    await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    expect(callback).toHaveBeenCalledWith();
  });

  test('异步校验器通过后继续执行原始 validator', async () => {
    registerTypeMatchRule('async-type', async () => undefined);

    const callback = vi.fn();
    const originalValidator = vi.fn();
    const validator = createTypeMatchValidator(mForm, propsOf({ type: 'async-type' }), {
      typeMatch: true,
      validator: originalValidator,
    } as any);

    validator({}, 'ok', callback, {}, {});

    await vi.waitFor(() => expect(originalValidator).toHaveBeenCalled());
    // 原始 validator 拿到 callback 后自行回调，这里不重复调用
    expect(callback).not.toHaveBeenCalled();
    expect(originalValidator.mock.calls[0][0].value).toBe('ok');
  });

  test('异步校验器不通过时不执行原始 validator', async () => {
    registerTypeMatchRule('async-type', async () => '异步校验失败');

    const callback = vi.fn();
    const originalValidator = vi.fn();
    const validator = createTypeMatchValidator(mForm, propsOf({ type: 'async-type' }), {
      typeMatch: true,
      validator: originalValidator,
    } as any);

    validator({}, 'bad', callback, {}, {});

    await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    expect(originalValidator).not.toHaveBeenCalled();
  });

  test('异步校验器 reject 时忽略异常并继续执行原始 validator', async () => {
    registerTypeMatchRule('async-type', () => Promise.reject(new Error('boom')));

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const callback = vi.fn();
    const originalValidator = vi.fn();
    const validator = createTypeMatchValidator(mForm, propsOf({ type: 'async-type' }), {
      typeMatch: true,
      validator: originalValidator,
    } as any);

    validator({}, 'value', callback, {}, {});

    await vi.waitFor(() => expect(originalValidator).toHaveBeenCalled());
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('异步路径下原始 validator 返回的 Promise 会被转成 callback', async () => {
    registerTypeMatchRule('async-type', async () => undefined);

    const callback = vi.fn();
    const validator = createTypeMatchValidator(mForm, propsOf({ type: 'async-type' }), {
      typeMatch: true,
      validator: () => Promise.reject(new Error('原始校验失败')),
    } as any);

    validator({}, 'ok', callback, {}, {});

    await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    expect(callback.mock.calls[0][0].message).toBe('原始校验失败');
  });

  test('原始 validator 既调 callback 又返回 Promise 时只回调一次', async () => {
    registerTypeMatchRule('async-type', async () => undefined);

    const callback = vi.fn();
    const validator = createTypeMatchValidator(mForm, propsOf({ type: 'async-type' }), {
      typeMatch: true,
      // async 写法很常见：内部调了 callback，函数本身又返回 Promise
      validator: async ({ callback: cb }: any) => {
        cb(new Error('原始校验失败'));
      },
    } as any);

    validator({}, 'ok', callback, {}, {});

    await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    expect(callback.mock.calls[0][0].message).toBe('原始校验失败');

    // 等 Promise 链彻底跑完，确认没有第二次回调
    await Promise.resolve();
    await Promise.resolve();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('异步校验器不影响同步内置规则', () => {
    registerTypeMatchRule('async-type', async () => '异步校验失败');

    const callback = vi.fn();
    const validator = createTypeMatchValidator(mForm, propsOf({ type: 'number' }), { typeMatch: true } as any);

    validator({}, 'not-a-number', callback, {}, {});

    // 内置规则仍同步回调
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0].message).toContain('类型应为数字');
  });
});

/**
 * async-validator 只解析同步返回给它的 validator 返回值，异步 typeMatch 通过后已脱离其调用栈，
 * 因此这些约定必须由 createTypeMatchValidator 自行复刻，否则 callback 永不触发、校验一直挂起。
 */
describe('createTypeMatchValidator 原始 validator 返回值约定', () => {
  beforeEach(() => {
    clearTypeMatchRules();
    registerTypeMatchRule('async-type', async () => undefined);
  });

  afterEach(() => {
    clearTypeMatchRules();
  });

  const validatorOf = (originalValidator: any, type = 'async-type') =>
    createTypeMatchValidator(mForm, propsOf({ type }), {
      typeMatch: true,
      validator: originalValidator,
    } as any);

  /** async-type 走异步 typeMatch 路径，text 走同步内置规则路径，两者行为应完全一致 */
  const paths = ['async-type', 'text'];

  test.each(paths)('%s：返回 false 时回调错误', async (type) => {
    const callback = vi.fn();
    validatorOf(() => false, type)({ fullField: 'title' }, 'ok', callback, {}, {});

    await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    expect(callback.mock.calls[0][0].message).toBe('title fails');
  });

  test('返回 false 时优先使用 rule.message', async () => {
    const callback = vi.fn();
    createTypeMatchValidator(mForm, propsOf({ type: 'async-type' }), {
      typeMatch: true,
      message: '自定义错误',
      validator: () => false,
    } as any)({}, 'ok', callback, {}, {});

    await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    expect(callback.mock.calls[0][0].message).toBe('自定义错误');
  });

  test.each(paths)('%s：返回 true 时无参回调', async (type) => {
    const callback = vi.fn();
    validatorOf(() => true, type)({}, 'ok', callback, {}, {});

    await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    expect(callback).toHaveBeenCalledWith();
  });

  test.each(paths)('%s：返回 Error 实例时透传', async (type) => {
    const error = new Error('返回 Error');
    const callback = vi.fn();
    validatorOf(() => error, type)({}, 'ok', callback, {}, {});

    await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    expect(callback).toHaveBeenCalledWith(error);
  });

  test.each(paths)('%s：返回错误数组时透传', async (type) => {
    const errors = [new Error('错误一'), new Error('错误二')];
    const callback = vi.fn();
    validatorOf(() => errors, type)({}, 'ok', callback, {}, {});

    await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    expect(callback).toHaveBeenCalledWith(errors);
  });

  test.each(paths)('%s：同步抛错时转成回调而非未捕获异常', async (type) => {
    const unhandled: any[] = [];
    const onUnhandled = (reason: any) => unhandled.push(reason);
    process.on('unhandledRejection', onUnhandled);

    const callback = vi.fn();
    validatorOf(() => {
      throw new Error('validator 内部抛错');
    }, type)({}, 'ok', callback, {}, {});

    await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    expect(callback.mock.calls[0][0].message).toBe('validator 内部抛错');

    // 等待微任务队列排空，确认异常没有变成游离的 rejected promise
    await new Promise((resolve) => setTimeout(resolve, 0));
    process.off('unhandledRejection', onUnhandled);
    expect(unhandled).toEqual([]);
  });

  test.each([
    [
      '抛出',
      () => {
        throw 'string error';
      },
    ],
    ['reject', () => Promise.reject('string error')],
  ])('%s非 Error 时包装成 Error', async (_case, originalValidator) => {
    const callback = vi.fn();
    validatorOf(originalValidator)({}, 'ok', callback, {}, {});

    await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    expect(callback.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(callback.mock.calls[0][0].message).toBe('string error');
  });

  test('同步 typeMatch 路径不把 Promise 交还 async-validator，避免重复回调', async () => {
    const callback = vi.fn();
    // async 写法很常见：内部调了 callback，函数本身又返回 Promise
    const returned = validatorOf(async ({ callback: cb }: any) => {
      cb(new Error('原始校验失败'));
    }, 'text')({}, 'ok', callback, {}, {});

    // 返回 undefined，async-validator 不会再解析 Promise 二次回调
    expect(returned).toBeUndefined();
    expect(callback).toHaveBeenCalledTimes(1);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0].message).toBe('原始校验失败');
  });
});

describe('createTypeMatchValidator 异步校验竞态', () => {
  beforeEach(() => {
    clearTypeMatchRules();
  });

  afterEach(() => {
    clearTypeMatchRules();
  });

  /** 注册一个由测试手动控制结束时机的异步规则，返回按调用顺序收集的 resolve 队列 */
  const registerManualRule = () => {
    const resolvers: ((message: string | undefined) => void)[] = [];
    registerTypeMatchRule('async-type', () => new Promise<string | undefined>((resolve) => resolvers.push(resolve)));
    return resolvers;
  };

  test('旧校验不会用过期结论结算，而是跟随最新一轮的结论', async () => {
    const resolvers = registerManualRule();
    const validator = createTypeMatchValidator(mForm, propsOf({ type: 'async-type' }), { typeMatch: true } as any);

    const staleCallback = vi.fn();
    const freshCallback = vi.fn();
    validator({}, 'old', staleCallback, {}, {});
    expect(staleCallback).not.toHaveBeenCalled();

    // 值变化触发新一轮校验：旧校验的结论作废，但不能提前按通过结算
    validator({}, 'new', freshCallback, {}, {});
    expect(staleCallback).not.toHaveBeenCalled();

    // 旧校验先返回，它的结论被丢弃
    resolvers[0]('旧值校验失败');
    await Promise.resolve();
    expect(staleCallback).not.toHaveBeenCalled();

    // 最新一轮出结论后，两次调用都以新结论结算
    resolvers[1]('新值校验失败');

    await vi.waitFor(() => expect(staleCallback).toHaveBeenCalledTimes(1));
    expect(freshCallback).toHaveBeenCalledTimes(1);
    expect(staleCallback.mock.calls[0][0].message).toBe('新值校验失败');
    expect(freshCallback.mock.calls[0][0].message).toBe('新值校验失败');
  });

  test('旧校验被同步路径的校验取代时，跟随同步结论结算', async () => {
    const resolvers = registerManualRule();
    const validator = createTypeMatchValidator(mForm, propsOf({ type: 'async-type' }), { typeMatch: true } as any);

    const staleCallback = vi.fn();
    const freshCallback = vi.fn();
    validator({}, 'bad', staleCallback, {}, {});

    // 值被清空：空值走同步路径直接通过，在途的旧校验必须跟着通过
    validator({}, '', freshCallback, {}, {});
    expect(freshCallback).toHaveBeenCalledWith();
    expect(staleCallback).toHaveBeenCalledWith();

    // 旧校验的失败结论晚到，不能落到已经通过的新值上
    resolvers[0]('异步校验失败');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(staleCallback).toHaveBeenCalledTimes(1);
  });

  test('取值为同一引用（names / 对象值）时也能识别出旧校验', async () => {
    const resolvers = registerManualRule();
    const model: Record<string, any> = { start: 'old' };
    const props = { ...propsOf({ type: 'async-type', names: ['start'] }), model };
    const validator = createTypeMatchValidator(mForm, props, { typeMatch: true } as any);

    const staleCallback = vi.fn();
    const freshCallback = vi.fn();
    validator({}, 'x', staleCallback, {}, {});

    // names 场景下校验的是 model 本身，就地修改后引用不变
    model.start = 'new';
    validator({}, 'y', freshCallback, {}, {});

    // 新校验先通过，旧校验的失败结论后到，不能覆盖
    resolvers[1](undefined);
    resolvers[0]('旧值校验失败');

    await vi.waitFor(() => expect(freshCallback).toHaveBeenCalledTimes(1));
    expect(freshCallback).toHaveBeenCalledWith();
    expect(staleCallback).toHaveBeenCalledTimes(1);
    expect(staleCallback).toHaveBeenCalledWith();
  });

  test('同值的多次在途校验都会被最新一轮结算', async () => {
    const resolvers = registerManualRule();
    const validator = createTypeMatchValidator(mForm, propsOf({ type: 'async-type' }), { typeMatch: true } as any);

    const first = vi.fn();
    const second = vi.fn();
    const third = vi.fn();
    // 同一个值可能被 blur、change 触发两次校验，之后值才变化
    validator({}, 'old', first, {}, {});
    validator({}, 'old', second, {}, {});
    validator({}, 'new', third, {}, {});

    resolvers[0]('旧值校验失败');
    resolvers[1]('旧值校验失败');
    resolvers[2]('新值校验失败');

    await vi.waitFor(() => expect(third).toHaveBeenCalledTimes(1));
    expect(first.mock.calls[0][0].message).toBe('新值校验失败');
    expect(second.mock.calls[0][0].message).toBe('新值校验失败');
    expect(third.mock.calls[0][0].message).toBe('新值校验失败');
  });

  test('并发的多次校验都会拿到结论，不会有调用被漏掉', async () => {
    registerTypeMatchRule('async-type', async () => '异步校验失败');

    const validator = createTypeMatchValidator(mForm, propsOf({ type: 'async-type' }), { typeMatch: true } as any);

    const first = vi.fn();
    const second = vi.fn();
    validator({}, 'same', first, {}, {});
    validator({}, 'same', second, {}, {});

    await vi.waitFor(() => {
      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
    });
    expect(first.mock.calls[0][0].message).toBe('异步校验失败');
    expect(second.mock.calls[0][0].message).toBe('异步校验失败');
  });

  test('结论已作废的旧校验返回后不再执行原始 validator', async () => {
    const resolvers = registerManualRule();
    const originalValidator = vi.fn(({ callback }: any) => callback());
    const validator = createTypeMatchValidator(mForm, propsOf({ type: 'async-type' }), {
      typeMatch: true,
      validator: originalValidator,
    } as any);

    validator({}, 'old', vi.fn(), {}, {});
    validator({}, 'new', vi.fn(), {}, {});

    // 旧校验的结论已作废，它的 typeMatch 通过后不应再触发一次原始 validator（可能带副作用）
    resolvers[0](undefined);
    resolvers[1](undefined);

    await vi.waitFor(() => expect(originalValidator).toHaveBeenCalled());
    expect(originalValidator).toHaveBeenCalledTimes(1);
  });
});
