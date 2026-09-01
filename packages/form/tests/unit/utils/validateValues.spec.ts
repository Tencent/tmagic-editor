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
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { createApp, defineComponent } from 'vue';

import MagicForm, {
  builtInFields,
  clearFields,
  collectValidatableFields,
  createHeadlessFormState,
  getTypeMatchRule,
  isFieldInnerConfigError,
  isLeafFieldType,
  registerBuiltInFields,
  registerField,
  registerFields,
  unregisterField,
  validateValues,
} from '@form/index';

import { required } from '../helpers/formValidation';

/** plugin.ts 注册的内置字段 type */
const BUILT_IN_FIELD_TYPES = [
  'text',
  'img-upload',
  'number',
  'number-range',
  'textarea',
  'hidden',
  'date',
  'datetime',
  'daterange',
  'timerange',
  'time',
  'checkbox',
  'switch',
  'color-picker',
  'checkbox-group',
  'radio-group',
  'display',
  'link',
  'select',
  'cascader',
  'dynamic-field',
  'component',
];

/** 收集字段 prop 列表，用于断言「哪些字段参与了校验」 */
const collectProps = (config: any, values: any) => {
  const formState = createHeadlessFormState({ config, initValues: values });
  formState.values = values;
  const fields = collectValidatableFields(formState, config, values);
  return { props: fields.map((f) => f.prop) };
};

beforeAll(() => {
  registerBuiltInFields(builtInFields);
});

afterEach(() => {
  clearFields();
});

describe('validateValues —— 基础校验', () => {
  test('required 规则生效，错误文案使用字段 text', async () => {
    const { error, invalidFields } = await validateValues({
      config: [{ type: 'text', name: 'name', text: '名称', rules: required() }] as any,
      initValues: { name: '' },
    });

    expect(error).toBe('名称 -> 必填');
    expect(invalidFields).toHaveProperty('name');
  });

  test('校验通过时 error 为空字符串', async () => {
    const { error, invalidFields } = await validateValues({
      config: [{ type: 'text', name: 'name', text: '名称', rules: required() }] as any,
      initValues: { name: 'a' },
    });

    expect(error).toBe('');
    expect(invalidFields).toEqual({});
  });

  test('useFieldTextInError=false 时用字段 name 作为前缀', async () => {
    const { error } = await validateValues({
      config: [{ type: 'text', name: 'name', text: '名称', rules: required() }] as any,
      initValues: { name: '' },
      useFieldTextInError: false,
    });

    expect(error).toBe('name -> 必填');
  });

  test('多条错误以 <br> 拼接', async () => {
    const { error } = await validateValues({
      config: [
        { type: 'text', name: 'a', text: 'A', rules: required('A必填') },
        { type: 'text', name: 'b', text: 'B', rules: required('B必填') },
      ] as any,
      initValues: { a: '', b: '' },
    });

    expect(error).toBe('A -> A必填<br>B -> B必填');
  });

  test('无 rules 的字段不参与校验', async () => {
    const { props } = collectProps([{ type: 'text', name: 'a', text: 'A' }], { a: '' });
    expect(props).toEqual([]);
  });

  test('trigger 只是 FormItem 的元信息，不影响规则匹配方式', async () => {
    // 若把 trigger 一起交给 async-validator，{ required: true } 会从 required 校验器
    // 退化为 string 校验器，行为随之改变，这里断言两者结果一致
    const withTrigger = await validateValues({
      config: [
        { type: 'text', name: 'a', text: 'A', rules: [{ required: true, message: '必填', trigger: 'blur' }] },
      ] as any,
      initValues: { a: '' },
    });
    const withoutTrigger = await validateValues({
      config: [{ type: 'text', name: 'a', text: 'A', rules: required() }] as any,
      initValues: { a: '' },
    });

    expect(withTrigger.error).toBe(withoutTrigger.error);
  });

  test('自定义 validator 可拿到 mForm 与 model 上下文', async () => {
    const validator = vi.fn(({ value, callback }: any, ctx: any, mForm: any) => {
      expect(ctx.model).toMatchObject({ a: 'x' });
      expect(mForm.initValues).toMatchObject({ a: 'x' });
      callback(value === 'x' ? new Error('不能是 x') : undefined);
    });

    const { error } = await validateValues({
      config: [{ type: 'text', name: 'a', text: 'A', rules: [{ validator }] }] as any,
      initValues: { a: 'x' },
    });

    expect(validator).toHaveBeenCalled();
    expect(error).toBe('A -> 不能是 x');
  });

  test('typeMatchValid=true 时自动注入类型匹配校验', async () => {
    const { error } = await validateValues({
      config: [{ type: 'number', name: 'n', text: '数字' }] as any,
      initValues: { n: 'not-a-number' },
      typeMatchValid: true,
    });

    expect(error).not.toBe('');
    expect(error).toContain('数字');
  });

  test('context 注入的字段可被 mForm 读穿', async () => {
    const { error } = await validateValues({
      config: [
        {
          type: 'text',
          name: 'a',
          text: 'A',
          rules: required(),
          display: (mForm: any) => mForm?.custom === 'on',
        },
      ] as any,
      initValues: { a: '' },
      context: { custom: 'on' },
    });

    expect(error).toBe('A -> 必填');
  });

  test('context 不能覆盖 formState 内置字段', async () => {
    const { values } = await validateValues({
      config: [{ type: 'text', name: 'a', text: 'A' }] as any,
      initValues: { a: 'origin' },
      context: { keyProp: 'hacked', initValues: { a: 'hacked' } } as any,
    });

    expect(values).toEqual({ a: 'origin' });
  });

  test('context 注入的字段可被 display 通过 mForm 读到', async () => {
    const { error } = await validateValues({
      config: [
        {
          type: 'text',
          name: 'a',
          text: 'A',
          rules: required(),
          display: (mForm: any) => mForm?.custom === 'on',
        },
      ] as any,
      initValues: { a: '' },
      context: { custom: 'on' },
    });

    expect(error).toBe('A -> 必填');
  });

  test('同一次校验中各回调从 mForm 读到同一份 context', async () => {
    const seen: any[] = [];
    const display = (mForm: any) => {
      seen.push({ username: mForm?.username, env: mForm?.env });
      return true;
    };

    await validateValues({
      config: [
        { type: 'text', name: 'a', text: 'A', display },
        { type: 'text', name: 'b', text: 'B', display },
      ] as any,
      initValues: { a: '1', b: '2' },
      context: { username: 'alice', env: 'prod' },
    });

    expect(seen.length).toBeGreaterThan(1);
    expect(seen.every((c) => c.username === 'alice' && c.env === 'prod')).toBe(true);
  });
});

describe('validateValues —— display 判定', () => {
  test('display: false 的字段不参与校验', async () => {
    const { props } = collectProps([{ type: 'text', name: 'a', text: 'A', display: false, rules: required() }], {
      a: '',
    });
    expect(props).toEqual([]);
  });

  test('display 函数返回 false 的字段不参与校验', async () => {
    const { props } = collectProps([{ type: 'text', name: 'a', text: 'A', display: () => false, rules: required() }], {
      a: '',
    });
    expect(props).toEqual([]);
  });

  test("display: 'expand' 的字段参与校验（展开与否是交互状态）", async () => {
    const { props } = collectProps([{ type: 'text', name: 'a', text: 'A', display: 'expand', rules: required() }], {
      a: '',
    });
    expect(props).toEqual(['a']);
  });

  test('hidden 字段不看 display，始终参与校验', async () => {
    const { props } = collectProps([{ type: 'hidden', name: 'a', display: false, rules: required() }], { a: '' });
    expect(props).toEqual(['a']);
  });
});

describe('validateValues —— 容器的 prop 路径', () => {
  test('无 type 的嵌套 items 按 name 下钻', () => {
    const { props } = collectProps(
      [{ name: 'obj', items: [{ type: 'text', name: 'inner', text: 'I', rules: required() }] }],
      { obj: { inner: '' } },
    );
    expect(props).toEqual(['obj.inner']);
  });

  test('无 name 的嵌套 items 不增加层级', () => {
    const { props } = collectProps([{ items: [{ type: 'text', name: 'a', text: 'A', rules: required() }] }], { a: '' });
    expect(props).toEqual(['a']);
  });

  test('row / flex-layout 透传 prop', () => {
    const row = collectProps([{ type: 'row', items: [{ type: 'text', name: 'a', text: 'A', rules: required() }] }], {
      a: '',
    });
    expect(row.props).toEqual(['a']);

    const flex = collectProps(
      [{ type: 'flexLayout', items: [{ type: 'text', name: 'a', text: 'A', rules: required() }] }],
      { a: '' },
    );
    expect(flex.props).toEqual(['a']);
  });

  test('panel 折叠不影响校验', () => {
    const { props } = collectProps(
      [
        {
          type: 'panel',
          name: 'p',
          expand: false,
          items: [{ type: 'text', name: 'a', text: 'A', rules: required() }],
        },
      ],
      { p: { a: '' } },
    );
    expect(props).toEqual(['p.a']);
  });

  test('tab：按 tab.name 拼接 prop，lazy 标签页也参与校验', () => {
    const { props } = collectProps(
      [
        {
          type: 'tab',
          items: [
            { title: 'T1', name: 't1', items: [{ type: 'text', name: 'a', text: 'A', rules: required() }] },
            { title: 'T2', name: 't2', lazy: true, items: [{ type: 'text', name: 'b', text: 'B', rules: required() }] },
          ],
        },
      ],
      { t1: { a: '' }, t2: { b: '' } },
    );
    expect(props).toEqual(['t1.a', 't2.b']);
  });

  test('tab：display 为假的标签页不参与校验', () => {
    const { props } = collectProps(
      [
        {
          type: 'tab',
          items: [
            { title: 'T1', name: 't1', items: [{ type: 'text', name: 'a', text: 'A', rules: required() }] },
            {
              title: 'T2',
              name: 't2',
              display: () => false,
              items: [{ type: 'text', name: 'b', text: 'B', rules: required() }],
            },
          ],
        },
      ],
      { t1: { a: '' }, t2: { b: '' } },
    );
    expect(props).toEqual(['t1.a']);
  });

  test('dynamic tab：按下标拼接 prop', () => {
    const { props } = collectProps(
      [
        {
          type: 'tab',
          dynamic: true,
          name: 'tabs',
          items: [{ type: 'text', name: 'a', text: 'A', rules: required() }],
        },
      ],
      { tabs: [{ a: '' }, { a: '' }] },
    );
    expect(props).toEqual(['tabs.0.a', 'tabs.1.a']);
  });

  test('fieldset：勾选框关闭时子项不参与校验', () => {
    const config = [
      {
        type: 'fieldset',
        name: 'fs',
        expand: true,
        checkbox: true,
        items: [{ type: 'text', name: 'a', text: 'A', rules: required() }],
      },
    ];

    expect(collectProps(config, { fs: { value: 0, a: '' } }).props).toEqual([]);
    expect(collectProps(config, { fs: { value: 1, a: '' } }).props).toEqual(['fs.a']);
  });

  test('step：prop 基准被重置为 step.name', () => {
    const { props } = collectProps(
      [
        {
          type: 'step',
          items: [
            { title: 'S1', name: 's1', items: [{ type: 'text', name: 'a', text: 'A', rules: required() }] },
            { title: 'S2', name: 's2', items: [{ type: 'text', name: 'b', text: 'B', rules: required() }] },
          ],
        },
      ],
      { s1: { a: '' }, s2: { b: '' } },
    );
    expect(props).toEqual(['s1.a', 's2.b']);
  });

  test('group-list：每一行都参与校验，包括默认折叠的行', () => {
    const rows = Array.from({ length: 9 }, (_, i) => ({ title: `${i}` }));
    const { props } = collectProps(
      [
        {
          type: 'group-list',
          name: 'list',
          items: [{ type: 'text', name: 'title', text: '标题', rules: required() }],
        },
      ],
      { list: rows },
    );

    // defaultExpandQuantity 默认为 7，渲染式校验会漏掉第 8 行起的字段
    expect(props).toHaveLength(9);
    expect(props[8]).toBe('list.8.title');
  });

  test('table：逐行逐列拼接 prop，跳过 hidden 列与 display 为假的列', () => {
    const { props } = collectProps(
      [
        {
          type: 'table',
          name: 'rows',
          items: [
            { type: 'text', name: 'a', label: 'A', rules: required() },
            { type: 'hidden', name: 'h', rules: required() },
            { type: 'text', name: 'c', label: 'C', display: () => false, rules: required() },
          ],
        },
      ],
      {
        rows: [
          { a: '', h: '', c: '' },
          { a: '', h: '', c: '' },
        ],
      },
    );

    expect(props).toEqual(['rows.0.a', 'rows.1.a']);
  });

  test('table：分页配置不会截断校验范围', () => {
    const rows = Array.from({ length: 12 }, () => ({ a: '' }));
    const { props } = collectProps(
      [
        {
          type: 'table',
          name: 'rows',
          pagination: true,
          items: [{ type: 'text', name: 'a', label: 'A', rules: required() }],
        },
      ],
      { rows },
    );

    // 渲染式校验只会覆盖当前页（默认 10 条）
    expect(props).toHaveLength(12);
  });

  test('带 text 的容器：容器自身与子项都参与校验', () => {
    const { props } = collectProps(
      [
        {
          type: 'group-list',
          name: 'list',
          text: '列表',
          rules: required('列表必填'),
          items: [{ type: 'text', name: 'title', text: '标题', rules: required() }],
        },
      ],
      { list: [{ title: '' }] },
    );

    expect(props).toEqual(['list', 'list.0.title']);
  });
});

describe('validateValues —— 挂载副作用复刻', () => {
  test('display 字段的 initValue 会写入表单值', async () => {
    const { values, error } = await validateValues({
      config: [{ type: 'display', name: 'status', text: '状态', initValue: 'ready', rules: required() }] as any,
      initValues: {},
    });

    expect(values.status).toBe('ready');
    expect(error).toBe('');
  });

  test('number-range 字段的非数组值被修正为空数组', async () => {
    const { values } = await validateValues({
      config: [{ type: 'number-range', name: 'range', text: '区间' }] as any,
      initValues: { range: 'not-an-array' },
    });

    expect(values.range).toEqual([]);
  });

  test('checkbox-group 字段的空值被初始化为空数组', async () => {
    const { values, error } = await validateValues({
      config: [{ type: 'checkbox-group', name: 'tags', text: '标签', rules: required() }] as any,
      initValues: {},
    });

    // 与渲染式一致：初始化成空数组后 required 仍然不通过
    expect(values.tags).toEqual([]);
    expect(error).toBe('标签 -> 必填');
  });

  test('date 字段按 valueFormat 归一化', async () => {
    const { values } = await validateValues({
      config: [{ type: 'date', name: 'start', text: '开始', valueFormat: 'YYYY-MM-DD' }] as any,
      initValues: { start: '2021/07/17 15:37:00' },
    });

    expect(values.start).toBe('2021-07-17');
  });

  test('datetime 字段的非法值被归一化为空字符串', async () => {
    const { values, error } = await validateValues({
      config: [{ type: 'datetime', name: 'start', text: '开始', rules: required() }] as any,
      initValues: { start: new Date('nonsense') },
    });

    expect(values.start).toBe('');
    expect(error).toBe('开始 -> 必填');
  });

  test('datetime 字段按默认 valueFormat 归一化', async () => {
    const { values } = await validateValues({
      config: [{ type: 'datetime', name: 'start', text: '开始' }] as any,
      initValues: { start: '2021/07/17 15:37:00' },
    });

    expect(values.start).toBe('2021/07/17 15:37:00');
  });
});

describe('validateValues —— 未登记 type 与扩展登记', () => {
  test('未登记的字段 type 只要有 rules 就校验自身，不必登记为叶子', () => {
    const { props } = collectProps([{ type: 'my-custom', name: 'a', text: 'A', rules: required() }], { a: '' });
    expect(props).toEqual(['a']);
  });

  test('未登记且没有 rules / items 的 type 不抛错，也不收集字段', () => {
    const { props } = collectProps(
      [
        { type: 'my-custom', name: 'a', text: 'A' },
        { type: 'text', name: 'ok', text: 'OK', rules: required() },
      ],
      { a: '', ok: '' },
    );
    expect(props).toEqual(['ok']);
  });

  test('未登记的 type 若配置了 items，会下钻校验子项', () => {
    const { props } = collectProps(
      [
        {
          type: 'my-layout',
          items: [{ type: 'text', name: 'a', text: 'A', rules: required() }],
        },
      ],
      { a: '' },
    );
    expect(props).toEqual(['a']);
  });

  test('多个未登记 type 不阻塞遍历，只收集带 rules 的字段', () => {
    const { props } = collectProps(
      [
        { type: 'alpha-unknown', name: 'a', text: 'A' },
        { type: 'text', name: 'ok', text: 'OK', rules: required() },
        { type: 'beta-unknown', name: 'b', text: 'B' },
        {
          type: 'panel',
          name: 'wrap',
          items: [{ type: 'gamma-unknown', name: 'c', text: 'C', rules: required() }],
        },
      ],
      { a: '', ok: '', b: '', wrap: { c: '' } },
    );
    expect(props).toEqual(['ok', 'wrap.c']);
  });

  test('内置 type: component 视为叶子：收集自身 rules，不下钻 items', () => {
    const { props } = collectProps(
      [
        {
          type: 'component',
          name: 'a',
          text: 'A',
          rules: required(),
          items: [{ type: 'text', name: 'nested', text: 'Nested', rules: required() }],
        },
      ],
      { a: '', nested: '' },
    );

    expect(props).toEqual(['a']);
  });

  test('clearFields 不会清掉内置叶子字段', () => {
    registerFields({ 'temp-leaf': {} });
    clearFields();
    expect(isLeafFieldType('temp-leaf')).toBe(false);
    expect(isLeafFieldType('text')).toBe(true);
    expect(isLeafFieldType('tab')).toBe(false);
  });

  test('内置叶子字段都不抛错', () => {
    for (const type of BUILT_IN_FIELD_TYPES) {
      expect(() => collectProps([{ type, name: 'a', text: 'A' }], { a: '' }), type).not.toThrow();
    }
  });

  test('内置叶子字段表覆盖 plugin 注册的全部 m-fields-* 组件', () => {
    const app = createApp(defineComponent({ render: () => null }));
    app.use(MagicForm);

    const registeredTypes = Object.keys((app._context as any).components)
      .filter((name) => name.startsWith('m-fields-'))
      .map((name) => name.replace('m-fields-', ''));

    expect(registeredTypes.length).toBeGreaterThan(0);
    for (const type of registeredTypes) {
      expect(isLeafFieldType(type), `${type} 未登记为叶子字段`).toBe(true);
    }
  });

  test('registerFields 登记为叶子后仍收集自身 rules，且不下钻 items', () => {
    registerFields({ 'my-custom': {} });
    const { props } = collectProps(
      [
        {
          type: 'my-custom',
          name: 'a',
          text: 'A',
          rules: required(),
          items: [{ type: 'text', name: 'nested', text: 'Nested', rules: required() }],
        },
      ],
      { a: '', nested: '' },
    );
    expect(props).toEqual(['a']);
  });

  test('registerField 带 effect 时会复刻写入', async () => {
    registerField('my-status', {
      effect: ({ config, model }) => {
        model[(config as any).name] = 'from-effect';
      },
    });

    const { values, error } = await validateValues({
      config: [{ type: 'my-status', name: 'status', text: '状态', rules: required() }] as any,
      initValues: {},
    });

    expect(values.status).toBe('from-effect');
    expect(error).toBe('');
  });

  test('叶子字段 type 名支持驼峰与中划线互通', () => {
    registerField('myStatus');
    const { props } = collectProps(
      [
        {
          type: 'my-status',
          name: 'a',
          items: [{ type: 'text', name: 'nested', text: 'Nested', rules: required() }],
        },
      ],
      { a: { nested: '' } },
    );
    expect(props).toEqual([]);
  });

  test('登记的叶子字段可覆盖内置字段的 mount effect', async () => {
    registerField('display', {
      effect: ({ config, model }) => {
        model[(config as any).name] = 'overridden';
      },
    });

    const { values } = await validateValues({
      config: [{ type: 'display', name: 'status', text: '状态', initValue: 'ready' }] as any,
      initValues: {},
    });

    expect(values.status).toBe('overridden');
  });

  test('unregisterField 后不再锁死子树，配置里的 items 会下钻', () => {
    registerFields({ 'my-custom': {} });
    unregisterField('my-custom');
    const { props } = collectProps(
      [
        {
          type: 'my-custom',
          name: 'wrap',
          items: [{ type: 'text', name: 'inner', text: 'Inner', rules: required() }],
        },
      ],
      { wrap: { inner: '' } },
    );
    expect(props).toEqual(['wrap.inner']);
  });

  test('registerField innerConfig 可遍历复合字段的内部配置', async () => {
    registerField('my-composite', {
      innerConfig: ({ config, model }) => ({
        config: { type: 'text', name: 'inner', text: '内部', rules: required('内部必填') },
        model: model[(config as any).name],
      }),
    });

    const { error } = await validateValues({
      config: [{ type: 'my-composite', name: 'wrap', text: '包裹' }] as any,
      initValues: { wrap: { inner: '' } },
    });

    // 内部配置不在调用方传入的 config 树上，getTextByName 找不到 text，回退为 prop 路径
    expect(error).toBe('wrap.inner -> 内部必填');
  });

  test('innerConfig 返回 null 表示该字段没有内部字段', () => {
    registerField('my-composite', { innerConfig: () => null });
    expect(() => collectProps([{ type: 'my-composite', name: 'a', text: 'A' }], { a: '' })).not.toThrow();
  });

  test('innerConfig 抛错时把失败原因带出去', () => {
    registerField('my-composite', {
      innerConfig: () => {
        throw new Error('boom');
      },
    });

    expect(() => collectProps([{ type: 'my-composite', name: 'a', text: 'A' }], { a: '' })).toThrow(
      /\[MForm\] innerConfig for "my-composite" at "a" failed: boom/,
    );
  });

  test('innerConfig 抛错时抛出 FieldInnerConfigError，可按 code 判别', () => {
    registerField('my-composite', {
      innerConfig: () => {
        throw new Error('boom');
      },
    });

    try {
      collectProps([{ type: 'my-composite', name: 'a', text: 'A' }], { a: '' });
      expect.unreachable('should throw');
    } catch (e) {
      expect(isFieldInnerConfigError(e)).toBe(true);
      expect((e as { code?: string }).code).toBe('FIELD_INNER_CONFIG');
      expect((e as { type?: string; prop?: string }).type).toBe('my-composite');
      expect((e as { type?: string; prop?: string }).prop).toBe('a');
    }
  });

  test('innerConfig 的 type 名支持驼峰与中划线互通', () => {
    registerField('myComposite', { innerConfig: () => null });
    expect(() => collectProps([{ type: 'my-composite', name: 'a', text: 'A' }], { a: '' })).not.toThrow();
  });

  test('同时传 innerConfig 与 effect 时不告警，两者并存', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    registerField('my-both', { innerConfig: () => null, effect: () => undefined });

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test('后一次 registerField 覆盖前一次，不告警', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    registerField('my-both', { effect: () => undefined });
    registerField('my-both', { innerConfig: () => null });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test('registerField typeMatch 会写入规则表，unregisterField 后清除', () => {
    registerField('my-custom', {
      typeMatch: (value) => (value === 'ok' ? undefined : 'not ok'),
    });
    expect(getTypeMatchRule('my-custom')).toBeTypeOf('function');
    unregisterField('my-custom');
    expect(getTypeMatchRule('my-custom')).toBeUndefined();
  });
});
