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
import { type AppContext, defineComponent, h, nextTick } from 'vue';

import { clearFields, registerFields, validateForm } from '@form/index';

import {
  captureError,
  createFormAppContext,
  findButton,
  findMFormInstance,
  mockExposed,
  required,
  withoutDocument,
} from './helpers/formValidation';

let appContext: AppContext;

beforeAll(() => {
  appContext = createFormAppContext();
});

afterEach(() => {
  document.body.innerHTML = '';
  clearFields();
});

// validateForm 走无渲染实现（不挂载任何组件、不需要 DOM），
// 校验引擎本身的行为在 utils/validateValues.spec.ts 中覆盖；
// 此处聚焦 validateForm 这一层：静默语义、无 DOM 可用、未登记 type 不挂载、dialog 弹层。
describe('validateForm', () => {
  test('校验通过时 resolve 空字符串，且不产生任何 DOM', async () => {
    const baseChildCount = document.body.children.length;

    const error = await validateForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'hello' },
    });

    expect(error).toBe('');
    expect(document.body.children.length).toBe(baseChildCount);
    expect(document.body.querySelector('.m-form')).toBeNull();
  });

  test('校验失败时以错误文案 resolve（不抛异常）', async () => {
    const error = await validateForm({
      config: [{ type: 'text', name: 'name', text: '名称', rules: required() }],
      initValues: { name: '' },
    });

    expect(error).toBe('名称 -> 必填');
  });

  test('在嵌套 items 配置下也能正确 resolve', async () => {
    const error = await validateForm({
      config: [
        { type: 'text', name: 'name', text: 'name' },
        { name: 'object', items: [{ type: 'text', name: 'nested', text: 'nested' }] },
      ],
      initValues: { name: 'a', object: { nested: 'b' } },
    });

    expect(error).toBe('');
  });

  test('支持 extendState 扩展状态', async () => {
    const extendState = vi.fn(async () => ({ extra: 'value' }));

    await validateForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'foo' },
      extendState,
    });

    expect(extendState).toHaveBeenCalled();
  });

  test('tab 的 display 函数读取 extendState 注入的值时不会因竞态崩溃', async () => {
    // 无渲染实现下 extendState 一定先于遍历完成，不存在渲染式实现里的时序竞态
    const error = await validateForm({
      config: [
        {
          type: 'tab',
          items: [
            { title: '属性', items: [{ type: 'text', name: 'name', text: '名称' }] },
            {
              title: '样式',
              display: (mForm: any) => {
                const { services } = mForm || {};
                return !(services?.uiService?.get('showStylePanel') ?? true);
              },
              items: [{ type: 'text', name: 'style', text: '样式' }],
            },
          ],
        },
      ],
      initValues: { name: 'test' },
      extendState: () => ({ services: { uiService: { get: () => false } } }),
    });

    expect(error).toBe('');
  });

  test('lazy 标签页内的字段同样参与校验，且不污染调用方的原始配置', async () => {
    const config: any = [
      {
        type: 'tab',
        items: [
          { title: '属性', name: 'p', items: [{ type: 'text', name: 'name', text: '名称' }] },
          {
            title: '样式',
            name: 's',
            lazy: true,
            items: [{ type: 'text', name: 'style', text: '样式', rules: required() }],
          },
        ],
      },
    ];

    const error = await validateForm({ config, initValues: { p: { name: 'a' }, s: { style: '' } } });

    expect(error).toBe('样式 -> 必填');
    expect(config[0].items[1].lazy).toBe(true);
  });

  test('多次并发调用互不干扰', async () => {
    const config: any = [{ type: 'text', name: 'text', text: 'text', rules: required() }];

    const results = await Promise.all([
      validateForm({ config, initValues: { text: 'first' } }),
      validateForm({ config, initValues: { text: '' } }),
    ]);

    expect(results).toEqual(['', 'text -> 必填']);
  });

  test('signal 已中断时立即以 reason 抛错', async () => {
    const controller = new AbortController();
    const reason = new Error('canceled by caller');
    controller.abort(reason);

    await expect(
      validateForm({
        config: [{ type: 'text', name: 'text', text: 'text' }],
        initValues: { text: 'a' },
        signal: controller.signal,
      }),
    ).rejects.toBe(reason);
  });
});

describe('validateForm —— 无 DOM 环境', () => {
  test('全为内置类型时，无 document 也能完成校验', async () => {
    const error = await withoutDocument(() =>
      validateForm({
        config: [{ type: 'text', name: 'name', text: '名称', rules: required() }],
        initValues: { name: '' },
      }),
    );

    expect(error).toBe('名称 -> 必填');
  });

  test('无 document 时未登记 type 也能完成校验', async () => {
    const error = await withoutDocument(() =>
      validateForm({
        config: [{ type: 'totally-unknown', name: 'x', text: 'X' }] as any,
        initValues: { x: '' },
      }),
    );

    expect(error).toBe('');
  });
});

describe('validateForm —— 未登记字段 type', () => {
  test('即使有 DOM 也不实例化字段组件，无 rules 时返回空字符串', async () => {
    const setupSpy = vi.fn();
    const probeContext = createFormAppContext((app) => {
      app.component(
        'm-fields-render-probe',
        defineComponent({
          name: 'MFieldsRenderProbe',
          inheritAttrs: false,
          props: { model: { type: Object, default: () => ({}) }, name: { type: String, default: '' } },
          setup() {
            setupSpy();
            return () => h('div');
          },
        }),
      );
    });
    const baseChildCount = document.body.children.length;

    const error = await validateForm({
      config: [{ type: 'render-probe', name: 'x', text: 'X' }] as any,
      initValues: { x: '' },
      appContext: probeContext,
    });

    expect(error).toBe('');
    expect(setupSpy).not.toHaveBeenCalled();
    expect(document.body.children.length).toBe(baseChildCount);
  });

  test('未登记但带 rules 的字段可直接校验，不必先登记为叶子', async () => {
    const error = await validateForm({
      config: [{ type: 'totally-unknown', name: 'x', text: 'X', rules: required() }] as any,
      initValues: { x: '' },
    });

    expect(error).toBe('X -> 必填');
  });

  test('登记为叶子字段后即可校验', async () => {
    registerFields({ 'totally-unknown': {} });

    const error = await validateForm({
      config: [{ type: 'totally-unknown', name: 'x', text: 'X', rules: required() }] as any,
      initValues: { x: '' },
      appContext,
    });

    expect(error).toBe('X -> 必填');
  });

  test('登记为叶子字段后，无 DOM 也能校验', async () => {
    registerFields({ 'totally-unknown': {} });

    const error = await withoutDocument(() =>
      validateForm({
        config: [{ type: 'totally-unknown', name: 'x', text: 'X', rules: required() }] as any,
        initValues: { x: '' },
      }),
    );

    expect(error).toBe('X -> 必填');
  });
});

describe('validateForm —— dialog 弹层', () => {
  test('可见渲染弹层，点击「确定」校验通过后 resolve 空字符串并清理 DOM', async () => {
    const pending = validateForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'hello' },
      dialog: true,
      appContext,
    });

    await nextTick();
    await nextTick();

    expect(document.body.querySelector('.m-form')).not.toBeNull();

    findButton('确定').click();

    const error = await pending;
    expect(error).toBe('');
    expect(document.body.querySelector('.m-form')).toBeNull();
  });

  test('弹层标题可配置', async () => {
    const pending = validateForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'hello' },
      dialog: true,
      title: '校验配置',
      appContext,
    });
    await nextTick();
    await nextTick();

    expect(document.body.textContent).toContain('校验配置');
    expect(document.body.textContent).not.toContain('validateForm');

    findButton('取消').click();
    await captureError(() => pending);
  });

  test('点击「取消」以错误 reject 并清理 DOM', async () => {
    const pending = validateForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'hello' },
      dialog: true,
      appContext,
    });
    await nextTick();
    await nextTick();

    findButton('取消').click();

    const caught = await captureError(() => pending);

    expect(caught).toBeInstanceOf(Error);
    expect(caught.message).toContain('canceled');
    expect(document.body.querySelector('.m-form')).toBeNull();
  });

  test('校验失败时点击「确定」在弹层展示错误并保留弹层，随后取消结束', async () => {
    const pending = validateForm({
      config: [{ type: 'text', name: 'name', text: '名称' }],
      initValues: { name: '' },
      dialog: true,
      appContext,
    });
    await nextTick();
    await nextTick();

    const comp = findMFormInstance();
    expect(comp).toBeTruthy();
    mockExposed(comp, 'validate', vi.fn().mockResolvedValue('名称 -> 必填'));

    findButton('确定').click();

    await vi.waitFor(
      () => {
        const el = Array.from(document.body.querySelectorAll('div')).find((d) =>
          (d.textContent || '').includes('名称 -> 必填'),
        );
        expect(el).toBeTruthy();
      },
      { timeout: 1000 },
    );

    expect(document.body.querySelector('.m-form')).not.toBeNull();

    findButton('取消').click();

    const caught = await captureError(() => pending);
    expect(caught).toBeInstanceOf(Error);
    expect(caught.message).toContain('canceled');
    expect(document.body.querySelector('.m-form')).toBeNull();
  });

  test('dialog 弹层下字段照常完整渲染', async () => {
    const options = vi.fn(() => [{ text: 'a', value: 'a' }]);

    const pending = validateForm({
      config: [{ type: 'select', name: 'kind', text: '类型', options }] as any,
      initValues: { kind: 'a' },
      dialog: true,
      appContext,
    });
    await nextTick();
    await nextTick();

    expect(options).toHaveBeenCalled();

    findButton('确定').click();
    await pending;
  });
});
