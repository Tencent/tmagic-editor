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

import { effect as dateEffect } from '@form/fields/Date/effect';
import { effect as dateTimeEffect } from '@form/fields/DateTime/effect';
import {
  applyMountValueEffects,
  builtInFields,
  clearFields,
  collectValidatableFields,
  createHeadlessFormState,
  type FieldMountValueEffectContext,
  isFieldInnerConfigError,
  registerBuiltInFields,
  registerField,
} from '@form/index';

const apply = (config: any, values: any) => {
  const formState = createHeadlessFormState({ config, initValues: values });
  formState.values = values;
  applyMountValueEffects(formState, config, values);
  return values;
};

beforeAll(() => {
  registerBuiltInFields(builtInFields);
});

afterEach(() => {
  clearFields();
});

describe('applyMountValueEffects —— 内置字段的值初始化', () => {
  test('display 的 initValue 会写入表单值', () => {
    const values = apply([{ type: 'display', name: 'status', text: '状态', initValue: 'ready' }], {});
    expect(values.status).toBe('ready');
  });

  test('date 按 valueFormat 归一化，datetime 的非法值归一化为空字符串', () => {
    const values = apply(
      [
        { type: 'date', name: 'start', text: '开始', valueFormat: 'YYYY-MM-DD' },
        { type: 'datetime', name: 'end', text: '结束' },
        { type: 'datetime', name: 'meet', text: '会议', valueFormat: 'YYYY-MM-DD HH:mm:ss' },
      ],
      { start: '2021/07/17 15:37:00', end: new Date('nonsense'), meet: '2021/07/17 15:37:00' },
    );

    expect(values.start).toBe('2021-07-17');
    expect(values.end).toBe('');
    expect(values.meet).toBe('2021-07-17 15:37:00');
  });

  test('date / datetime 在 model 缺失时不抛错', () => {
    const ctx = { config: { name: 'd' }, model: undefined, prop: 'd', values: {}, mForm: undefined } as any;
    expect(() => dateEffect(ctx)).not.toThrow();
    expect(() => dateTimeEffect(ctx)).not.toThrow();
  });

  test('number-range 的非数组值与 checkbox-group 的空值都被修正为空数组', () => {
    const values = apply(
      [
        { type: 'number-range', name: 'range', text: '区间' },
        { type: 'checkbox-group', name: 'tags', text: '标签' },
      ],
      { range: 'not-an-array' },
    );

    expect(values.range).toEqual([]);
    expect(values.tags).toEqual([]);
  });

  test('重复执行结果不变（幂等）', () => {
    const config = [
      { type: 'date', name: 'start', text: '开始', valueFormat: 'YYYY-MM-DD' },
      { type: 'display', name: 'status', text: '状态', initValue: 'ready' },
    ];
    const values = apply(config, { start: '2021/07/17 15:37:00' });
    const once = { ...values };

    apply(config, values);

    expect(values).toEqual(once);
  });

  test('config 不是数组时直接返回，不抛错', () => {
    expect(() => applyMountValueEffects(undefined, {} as any, {})).not.toThrow();
  });

  test('mForm 缺省时也能执行', () => {
    const values: any = { start: '2021/07/17 15:37:00' };
    applyMountValueEffects(undefined, [{ type: 'date', name: 'start', text: '开始' }] as any, values);
    expect(values.start).toBe('2021/07/17');
  });
});

describe('applyMountValueEffects —— 不受 display 影响', () => {
  test('display 为 false 的字段同样被规整', () => {
    const values = apply([{ type: 'date', name: 'start', text: '开始', display: false }], {
      start: '2021/07/17 15:37:00',
    });

    expect(values.start).toBe('2021/07/17');
  });

  test('display 为函数且返回 false 的字段同样被规整', () => {
    const values = apply([{ type: 'date', name: 'start', text: '开始', display: () => false }], {
      start: '2021/07/17 15:37:00',
    });

    expect(values.start).toBe('2021/07/17');
  });

  test('fieldset 勾选框未勾选时，内部字段同样被规整', () => {
    const values = apply(
      [
        {
          type: 'fieldset',
          name: 'wrap',
          expand: true,
          checkbox: { name: 'value', trueValue: 1, falseValue: 0 },
          items: [{ type: 'date', name: 'start', text: '开始' }],
        },
      ],
      { wrap: { value: 0, start: '2021/07/17 15:37:00' } },
    );

    expect(values.wrap.start).toBe('2021/07/17');
  });

  test('display 为假的 tab 页内字段同样被规整', () => {
    const values = apply(
      [
        {
          type: 'tab',
          items: [
            {
              title: '隐藏页',
              display: false,
              items: [{ type: 'date', name: 'start', text: '开始' }],
            },
          ],
        },
      ],
      { start: '2021/07/17 15:37:00' },
    );

    expect(values.start).toBe('2021/07/17');
  });

  test('display 为假的表格列，行内字段同样被规整', () => {
    const values = apply(
      [
        {
          type: 'table',
          name: 'list',
          items: [{ type: 'date', name: 'start', label: '开始', display: false }],
        },
      ],
      { list: [{ start: '2021/07/17 15:37:00' }] },
    );

    expect(values.list[0].start).toBe('2021/07/17');
  });
});

describe('applyMountValueEffects —— 登记字段', () => {
  test('effect 收到完整 prop 路径与本次处理的表单值根对象', () => {
    const seen: Array<Pick<FieldMountValueEffectContext, 'prop'> & { isRoot: boolean; model: any }> = [];
    registerField('my-probe', {
      effect: ({ prop, values, model }) => {
        seen.push({ prop, isRoot: values === rootValues, model });
      },
    });

    const rootValues: any = { wrap: { inner: 'v' } };
    apply([{ name: 'wrap', items: [{ type: 'my-probe', name: 'inner', text: '内部' }] }], rootValues);

    expect(seen).toHaveLength(1);
    expect(seen[0].prop).toBe('wrap.inner');
    expect(seen[0].isRoot).toBe(true);
    expect(seen[0].model).toBe(rootValues.wrap);
  });

  test('业务登记的 effect 可覆盖内置字段', () => {
    registerField('display', {
      effect: ({ config, model }) => {
        model[(config as any).name] = 'overridden';
      },
    });

    const values = apply([{ type: 'display', name: 'status', text: '状态', initValue: 'ready' }], {});
    expect(values.status).toBe('overridden');
  });

  test('复合字段同时登记 effect 与 innerConfig 时，先执行本字段 effect 再下钻', () => {
    registerField('my-composite', {
      effect: ({ config, model }) => {
        const { name } = config as any;
        if (model && !model[name]) {
          model[name] = { start: '2021/07/17 15:37:00' };
        }
      },
      innerConfig: ({ config, model }) => ({
        config: { type: 'date', name: 'start', text: '开始', valueFormat: 'YYYY-MM-DD' },
        model: model[(config as any).name],
      }),
    });

    const values = apply([{ type: 'my-composite', name: 'wrap', text: '包裹' }], {});

    expect(values.wrap.start).toBe('2021-07-17');
  });

  test('innerConfig 登记的复合字段，其内部叶子字段的 effect 也会执行', () => {
    registerField('my-composite', {
      innerConfig: ({ config, model }) => ({
        config: { type: 'date', name: 'start', text: '开始', valueFormat: 'YYYY-MM-DD' },
        model: model[(config as any).name],
      }),
    });

    const values = apply([{ type: 'my-composite', name: 'wrap', text: '包裹' }], {
      wrap: { start: '2021/07/17 15:37:00' },
    });

    expect(values.wrap.start).toBe('2021-07-17');
  });

  test('dynamic-field 的 defaultValue 按 prop 写入传入的值根对象', () => {
    const values = apply(
      [
        {
          name: 'wrap',
          items: [
            {
              type: 'dynamic-field',
              name: 'dynamic',
              dynamicKey: 'kind',
              returnFields: () => [{ name: 'extra', label: '附加', defaultValue: 'fallback' }],
            },
          ],
        },
      ],
      { wrap: { kind: 'a' } },
    );

    expect(values.wrap.dynamic.extra).toBe('fallback');
  });

  test('returnFields 异步时不写入，交由组件挂载后的 watch 处理', () => {
    const values = apply(
      [
        {
          type: 'dynamic-field',
          name: 'dynamic',
          dynamicKey: 'kind',
          returnFields: async () => [{ name: 'extra', label: '附加', defaultValue: 'fallback' }],
        },
      ],
      { kind: 'a' },
    );

    expect(values.dynamic).toBeUndefined();
  });
});

/**
 * table / group-list / dynamic tab 会把同一份 items 重复展开，遍历前会先预判这份 items
 * 是否可能触发 effect。是否真的跳过，靠「walkNode 是否求值过函数型 text」观测：
 * 真正遍历到该节点才会调用它，被跳过则一次都不会调用。
 */
describe('applyMountValueEffects —— 跳过不含 effect 的重复展开', () => {
  const probe = () => vi.fn(() => '探针');

  test('列里没有 effect 的表格不逐行展开', () => {
    const text = probe();
    apply(
      [
        { type: 'table', name: 'list', items: [{ type: 'text', name: 'k', text }] },
        { type: 'date', name: 'day', text: '日期', valueFormat: 'YYYY-MM-DD' },
      ],
      { list: Array.from({ length: 5 }, (_, i) => ({ k: `k${i}` })), day: '2021/07/17 15:37:00' },
    );

    expect(text).not.toHaveBeenCalled();
  });

  test('列里有 effect 的表格照常逐行展开', () => {
    const text = probe();
    const values = apply(
      [
        {
          type: 'table',
          name: 'list',
          items: [
            { type: 'text', name: 'k', text },
            { type: 'date', name: 'd', text: '日期', valueFormat: 'YYYY-MM-DD' },
          ],
        },
      ],
      { list: [{ k: 'k0', d: '2021/07/17 15:37:00' }, { k: 'k1' }] },
    );

    expect(text).toHaveBeenCalled();
    expect(values.list[0].d).toBe('2021-07-17');
  });

  test('group-list 形态同样按列配置预判', () => {
    const text = probe();
    apply([{ type: 'group-list', name: 'list', items: [{ type: 'text', name: 'k', text }] }], {
      list: [{ k: 'k0' }, { k: 'k1' }],
    });

    expect(text).not.toHaveBeenCalled();
  });

  test('dynamic tab 的标签页内没有 effect 时不逐页展开', () => {
    const text = probe();
    apply([{ type: 'tab', name: 'panes', dynamic: true, items: [{ type: 'text', name: 'k', text }] }], {
      panes: [{ k: 'k0' }, { k: 'k1' }],
    });

    expect(text).not.toHaveBeenCalled();
  });

  test('dynamic tab 的标签页内有 effect 时照常逐页展开', () => {
    const values = apply(
      [
        {
          type: 'tab',
          name: 'panes',
          dynamic: true,
          items: [{ type: 'date', name: 'd', text: '日期', valueFormat: 'YYYY-MM-DD' }],
        },
      ],
      { panes: [{ d: '2021/07/17 15:37:00' }, { d: '2021/07/18 15:37:00' }] },
    );

    expect(values.panes.map((pane: any) => pane.d)).toEqual(['2021-07-17', '2021-07-18']);
  });

  test('空列、hidden 列、container 型列都不会让预判误判为可能有 effect', () => {
    const text = probe();
    const values = apply(
      [
        {
          type: 'table',
          name: 'list',
          items: [
            null,
            // hidden 只收集规则，不往下分派，内部字段本就不参与值初始化
            { type: 'hidden', name: 'h', items: [{ type: 'date', name: 'd', valueFormat: 'YYYY-MM-DD' }] },
            { type: 'container', name: 'c', items: [{ type: 'text', name: 'k', text }] },
          ],
        },
      ],
      { list: [{ h: {}, d: '2021/07/17 15:37:00', c: { k: 'k0' } }] },
    );

    expect(text).not.toHaveBeenCalled();
    expect(values.list[0].d).toBe('2021/07/17 15:37:00');
  });

  test('container 型列里的 effect 字段不会被跳过', () => {
    const values = apply(
      [
        {
          type: 'table',
          name: 'list',
          items: [{ type: 'container', items: [{ type: 'date', name: 'd', valueFormat: 'YYYY-MM-DD' }] }],
        },
      ],
      { list: [{ d: '2021/07/17 15:37:00' }] },
    );

    expect(values.list[0].d).toBe('2021-07-17');
  });

  test('列的函数型 type 静态看不出来，不会被跳过', () => {
    const values = apply(
      [{ type: 'table', name: 'list', items: [{ type: () => 'date', name: 'd', valueFormat: 'YYYY-MM-DD' }] }],
      { list: [{ d: '2021/07/17 15:37:00' }] },
    );

    expect(values.list[0].d).toBe('2021-07-17');
  });

  test('列里嵌套多层后才出现的 effect 字段不会被跳过', () => {
    const values = apply(
      [
        {
          type: 'table',
          name: 'list',
          items: [
            {
              items: [{ items: [{ type: 'date', name: 'd', text: '日期', valueFormat: 'YYYY-MM-DD' }] }],
            },
          ],
        },
      ],
      { list: [{ d: '2021/07/17 15:37:00' }] },
    );

    expect(values.list[0].d).toBe('2021-07-17');
  });

  test('itemsFunction 按行生成的列不会被跳过', () => {
    const values = apply(
      [
        {
          type: 'table',
          name: 'list',
          items: [{ itemsFunction: () => [{ type: 'date', name: 'd', text: '日期', valueFormat: 'YYYY-MM-DD' }] }],
        },
      ],
      { list: [{ k: 'k0', d: '2021/07/17 15:37:00' }] },
    );

    expect(values.list[0].d).toBe('2021-07-17');
  });

  test('另一形态的 tableItems 不参与值初始化，与遍历范围一致', () => {
    const values = apply(
      [
        {
          type: 'group-list',
          name: 'list',
          items: [{ type: 'text', name: 'k', text: 'k' }],
          tableItems: [{ type: 'date', name: 'd', text: '日期', valueFormat: 'YYYY-MM-DD' }],
        },
      ],
      { list: [{ k: 'k0', d: '2021/07/17 15:37:00' }] },
    );

    expect(values.list[0].d).toBe('2021/07/17 15:37:00');
  });

  test('列是 innerConfig 复合字段时不会被跳过：内部配置运行期才产生', () => {
    const innerConfig = vi.fn(() => null);
    registerField('my-composite', { innerConfig });

    apply([{ type: 'table', name: 'list', items: [{ type: 'my-composite', name: 'wrap' }] }], {
      list: [{ wrap: {} }],
    });

    expect(innerConfig).toHaveBeenCalled();
  });

  test('列是业务登记的容器时不会被跳过：遍历路径未知', () => {
    const walk = vi.fn();
    registerField('my-box', { walk });

    apply([{ type: 'table', name: 'list', items: [{ type: 'my-box', name: 'box', items: [] }] }], {
      list: [{ box: {} }],
    });

    expect(walk).toHaveBeenCalled();
  });
});

describe('applyMountValueEffects —— 单个字段出错不影响整体', () => {
  test('effect 抛错时记录并继续处理后续字段', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    registerField('my-boom', {
      effect: () => {
        throw new Error('boom');
      },
    });

    const values = apply(
      [
        { type: 'my-boom', name: 'bad', text: '坏字段' },
        { type: 'date', name: 'start', text: '开始', valueFormat: 'YYYY-MM-DD' },
      ],
      { start: '2021/07/17 15:37:00' },
    );

    expect(values.start).toBe('2021-07-17');
    expect(spy.mock.calls[0][0]).toContain('[MForm] mount value effect for "my-boom" at "bad" failed:');
    spy.mockRestore();
  });

  test('innerConfig 抛错时记录并继续，不像校验那样抛出', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    registerField('my-composite', {
      innerConfig: () => {
        throw new Error('boom');
      },
    });

    const config = [
      { type: 'my-composite', name: 'wrap', text: '包裹' },
      { type: 'date', name: 'start', text: '开始', valueFormat: 'YYYY-MM-DD' },
    ];

    const values = apply(config, { start: '2021/07/17 15:37:00' });

    expect(values.start).toBe('2021-07-17');
    expect(isFieldInnerConfigError(spy.mock.calls[0][0])).toBe(true);
    spy.mockRestore();
  });

  test('collect 模式下 innerConfig 抛错仍然抛出 FieldInnerConfigError', () => {
    registerField('my-composite', {
      innerConfig: () => {
        throw new Error('boom');
      },
    });

    const config = [{ type: 'my-composite', name: 'wrap', text: '包裹' }] as any;
    const formState = createHeadlessFormState({ config, initValues: {} });

    expect(() => collectValidatableFields(formState, config, {})).toThrow(/FIELD_INNER_CONFIG|innerConfig/);
  });
});

describe('collectValidatableFields —— 只读', () => {
  test('收集字段不再改写表单值，值初始化由 applyMountValueEffects 负责', () => {
    const config = [{ type: 'display', name: 'status', text: '状态', initValue: 'ready' }] as any;
    const values: any = {};
    const formState = createHeadlessFormState({ config, initValues: values });
    formState.values = values;

    collectValidatableFields(formState, config, values);

    expect(values.status).toBeUndefined();
  });

  test('innerConfig 回调在 collect 时也不改写本字段的值', () => {
    registerField('my-composite', {
      effect: ({ config, model }) => {
        model[(config as any).name] = { start: 'from-effect' };
      },
      innerConfig: ({ config, model }) => ({
        config: { type: 'text', name: 'start', text: '开始' },
        model: model[(config as any).name],
      }),
    });

    const config = [{ type: 'my-composite', name: 'wrap', text: '包裹' }] as any;
    const values: any = { wrap: {} };
    const formState = createHeadlessFormState({ config, initValues: values });
    formState.values = values;

    collectValidatableFields(formState, config, values);

    expect(values.wrap).toEqual({});
  });
});
