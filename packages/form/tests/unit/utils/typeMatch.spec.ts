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
  config,
  model,
  prop: config.name || 'field',
});

describe('validateTypeMatch', () => {
  test('空值直接通过', () => {
    expect(validateTypeMatch(undefined, mForm, propsOf({ type: 'text' }))).toBeUndefined();
    expect(validateTypeMatch(null, mForm, propsOf({ type: 'text' }))).toBeUndefined();
    expect(validateTypeMatch('', mForm, propsOf({ type: 'text' }))).toBeUndefined();
    expect(validateTypeMatch([], mForm, propsOf({ type: 'select', multiple: true }))).toBeUndefined();
  });

  test('0 / false 不视为空值', () => {
    expect(validateTypeMatch(0, mForm, propsOf({ type: 'number' }))).toBeUndefined();
    expect(validateTypeMatch(false, mForm, propsOf({ type: 'switch' }))).toBeUndefined();
  });

  test('display / hidden 不校验', () => {
    expect(validateTypeMatch(123, mForm, propsOf({ type: 'display' }))).toBeUndefined();
    expect(validateTypeMatch({ a: 1 }, mForm, propsOf({ type: 'hidden' }))).toBeUndefined();
  });

  test('text 期望 string', () => {
    expect(validateTypeMatch('ok', mForm, propsOf({ type: 'text' }))).toBeUndefined();
    expect(validateTypeMatch(1, mForm, propsOf({ type: 'text' }))).toBe('1 类型应为字符串');
    expect(validateTypeMatch(1, mForm, propsOf({ type: 'text' }), '自定义错误')).toBe('自定义错误');
  });

  test('text filter=number 时期望 number', () => {
    expect(validateTypeMatch(1, mForm, propsOf({ type: 'text', filter: 'number' }))).toBeUndefined();
    expect(validateTypeMatch(0, mForm, propsOf({ type: 'text', filter: 'number' }))).toBeUndefined();
    expect(validateTypeMatch('1', mForm, propsOf({ type: 'text', filter: 'number' }))).toBe('1 类型应为数字');
    expect(validateTypeMatch(NaN, mForm, propsOf({ type: 'textarea', filter: 'number' }))).toBe('NaN 类型应为数字');
  });

  test('text 自定义 filter 函数时跳过内置类型校验', () => {
    expect(validateTypeMatch({ a: 1 }, mForm, propsOf({ type: 'text', filter: () => ({ a: 1 }) }))).toBeUndefined();
  });

  test('number 期望 number', () => {
    expect(validateTypeMatch(1, mForm, propsOf({ type: 'number' }))).toBeUndefined();
    expect(validateTypeMatch('1', mForm, propsOf({ type: 'number' }))).toBe('1 类型应为数字');
    expect(validateTypeMatch(NaN, mForm, propsOf({ type: 'number' }))).toBe('NaN 类型应为数字');
  });

  test('date / time / datetime 按 valueFormat（Day.js format）校验', () => {
    // 默认 date: YYYY/MM/DD
    expect(validateTypeMatch('2020/01/01', mForm, propsOf({ type: 'date' }))).toBeUndefined();
    expect(validateTypeMatch('2020-01-01', mForm, propsOf({ type: 'date' }))).toBe('值格式应为 YYYY/MM/DD');
    expect(validateTypeMatch(new Date(), mForm, propsOf({ type: 'datetime' }))).toBe('值格式应为 YYYY/MM/DD HH:mm:ss');
    expect(validateTypeMatch(1710000000000, mForm, propsOf({ type: 'time' }))).toBe('值格式应为 HH:mm:ss');
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
    expect(validateTypeMatch('2020-01-01', mForm, propsOf({ type: 'date', valueFormat: 'x' }))).toBe(
      '值类型应为时间戳数字',
    );
  });

  test('switch / checkbox 默认 true/false', () => {
    expect(validateTypeMatch(true, mForm, propsOf({ type: 'switch' }))).toBeUndefined();
    expect(validateTypeMatch(false, mForm, propsOf({ type: 'checkbox' }))).toBeUndefined();
    expect(validateTypeMatch(1, mForm, propsOf({ type: 'switch' }))).toBe('1 不在合法开关值中');
  });

  test('switch / checkbox filter=number 时为 1/0', () => {
    expect(validateTypeMatch(1, mForm, propsOf({ type: 'switch', filter: 'number' }))).toBeUndefined();
    expect(validateTypeMatch(0, mForm, propsOf({ type: 'checkbox', filter: 'number' }))).toBeUndefined();
    expect(validateTypeMatch(true, mForm, propsOf({ type: 'switch', filter: 'number' }))).toBe('true 不在合法开关值中');
  });

  test('switch / checkbox 自定义 activeValue/inactiveValue', () => {
    const config = { type: 'switch', activeValue: 'on', inactiveValue: 'off' };
    expect(validateTypeMatch('on', mForm, propsOf(config))).toBeUndefined();
    expect(validateTypeMatch('off', mForm, propsOf(config))).toBeUndefined();
    expect(validateTypeMatch('maybe', mForm, propsOf(config))).toBe('maybe 不在合法开关值中');
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
    expect(validateTypeMatch(3, mForm, propsOf(config))).toBe('3 不在可选项中');
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
    expect(validateTypeMatch(['a', 'c'], mForm, propsOf(config))).toBe('a,c 不在可选项中');
    expect(validateTypeMatch('a', mForm, propsOf(config))).toBe('a 类型应为数组');
  });

  test('select options 为函数 / group', () => {
    const fnConfig = {
      type: 'select',
      options: () => [{ text: 'A', value: 1 }],
    };
    expect(validateTypeMatch(1, mForm, propsOf(fnConfig))).toBeUndefined();
    expect(validateTypeMatch(2, mForm, propsOf(fnConfig))).toBe('2 不在可选项中');

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
    expect(validateTypeMatch('b', mForm, propsOf(groupConfig))).toBe('b 不在可选项中');
  });

  test('select allowCreate / remote 不做枚举', () => {
    expect(validateTypeMatch('custom', mForm, propsOf({ type: 'select', allowCreate: true }))).toBeUndefined();
    expect(validateTypeMatch({ a: 1 }, mForm, propsOf({ type: 'select', allowCreate: true }))).toBe(
      '[object Object] 类型不合法',
    );
    expect(validateTypeMatch(['x'], mForm, propsOf({ type: 'select', multiple: true, remote: true }))).toBeUndefined();
    expect(validateTypeMatch('x', mForm, propsOf({ type: 'select', multiple: true, remote: true }))).toBe(
      'x 类型应为数组',
    );
  });

  test('radio-group / checkbox-group', () => {
    const radio = {
      type: 'radioGroup',
      options: [
        { text: 'A', value: 1 },
        { text: 'B', value: 2 },
      ],
    };
    expect(validateTypeMatch(1, mForm, propsOf(radio))).toBeUndefined();
    expect(validateTypeMatch(3, mForm, propsOf(radio))).toBe('3 不在可选项中');

    const checkboxGroup = {
      type: 'checkbox-group',
      options: [
        { text: 'A', value: 'a' },
        { text: 'B', value: 'b' },
      ],
    };
    expect(validateTypeMatch(['a', 'b'], mForm, propsOf(checkboxGroup))).toBeUndefined();
    expect(validateTypeMatch(['c'], mForm, propsOf(checkboxGroup))).toBe('c 不在可选项中');
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
      'zhejiang,ningbo 不在可选项中',
    );
    expect(
      validateTypeMatch('zhejiang/hangzhou', mForm, propsOf({ type: 'cascader', options, valueSeparator: '/' })),
    ).toBeUndefined();
    expect(validateTypeMatch('bad', mForm, propsOf({ type: 'cascader', remote: true }))).toBe('bad 类型应为数组');
    expect(validateTypeMatch(['a'], mForm, propsOf({ type: 'cascader', remote: true }))).toBeUndefined();
  });

  test('number-range / daterange / table', () => {
    expect(validateTypeMatch([1, 2], mForm, propsOf({ type: 'number-range' }))).toBeUndefined();
    expect(validateTypeMatch([1], mForm, propsOf({ type: 'number-range' }))).toBe('1 类型应为长度为 2 的数字数组');

    expect(
      validateTypeMatch(['2020/01/01 00:00:00', '2020/01/02 00:00:00'], mForm, propsOf({ type: 'daterange' })),
    ).toBeUndefined();
    expect(validateTypeMatch(['2020-01-01', '2020-01-02'], mForm, propsOf({ type: 'daterange' }))).toBe(
      '2020-01-01,2020-01-02 格式应为长度为 2 的 YYYY/MM/DD HH:mm:ss 数组',
    );
    expect(validateTypeMatch(['a'], mForm, propsOf({ type: 'daterange' }))).toBe(
      'a 格式应为长度为 2 的 YYYY/MM/DD HH:mm:ss 数组',
    );
    expect(validateTypeMatch([1, 2], mForm, propsOf({ type: 'daterange', valueFormat: 'timestamp' }))).toBeUndefined();
    expect(validateTypeMatch('x', mForm, propsOf({ type: 'daterange', names: ['a', 'b'] }))).toBeUndefined();

    expect(validateTypeMatch([{ id: 1 }], mForm, propsOf({ type: 'table' }))).toBeUndefined();
    expect(validateTypeMatch({}, mForm, propsOf({ type: 'groupList' }))).toBe('[object Object] 类型应为数组');
  });

  test('容器类字段 no-op', () => {
    expect(validateTypeMatch({ a: 1 }, mForm, propsOf({ type: 'fieldset', items: [] }))).toBeUndefined();
    expect(validateTypeMatch(1, mForm, propsOf({ type: 'panel', items: [] }))).toBeUndefined();
  });

  test('无 type 默认按 text 校验', () => {
    expect(validateTypeMatch('ok', mForm, propsOf({}))).toBeUndefined();
    expect(validateTypeMatch(1, mForm, propsOf({}))).toBe('1 类型应为字符串');
  });

  test('textarea / color-picker / html 期望 string', () => {
    expect(validateTypeMatch('ok', mForm, propsOf({ type: 'textarea' }))).toBeUndefined();
    expect(validateTypeMatch('ok', mForm, propsOf({ type: 'color-picker' }))).toBeUndefined();
    expect(validateTypeMatch(1, mForm, propsOf({ type: 'html' }))).toBe('1 类型应为字符串');
  });

  test('checkbox-group 非数组', () => {
    expect(
      validateTypeMatch('a', mForm, propsOf({ type: 'checkbox-group', options: [{ text: 'A', value: 'a' }] })),
    ).toBe('a 类型应为数组');
  });

  test('timerange 按 valueFormat 校验', () => {
    expect(validateTypeMatch(['12:00:00', '13:00:00'], mForm, propsOf({ type: 'timerange' }))).toBeUndefined();
    expect(validateTypeMatch(['bad'], mForm, propsOf({ type: 'timerange' }))).toBe(
      'bad 格式应为长度为 2 的 HH:mm:ss 数组',
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
      'ningbo 不在可选项中',
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
    ).toBe('ningbo 不在可选项中');
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

  test('select allowCreate 对象值非法', () => {
    expect(validateTypeMatch({ a: 1 }, mForm, propsOf({ type: 'select', allowCreate: true }))).toBe(
      '[object Object] 类型不合法',
    );
  });

  test('动态 type 函数解析', () => {
    expect(validateTypeMatch('ok', mForm, propsOf({ type: () => 'text', name: 'field' }))).toBeUndefined();
    expect(validateTypeMatch(1, mForm, propsOf({ type: () => 'number', name: 'field' }))).toBeUndefined();
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
    newRules[0].validator({}, 123, callback);
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
    await expect(newRules[0].validator(123)).resolves.toEqual({
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
