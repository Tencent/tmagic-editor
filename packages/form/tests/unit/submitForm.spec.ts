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
import { type AppContext, createApp, defineComponent, h } from 'vue';
import MagicForm, { submitForm } from '@form/index';
import ElementPlus from 'element-plus';

let appContext: AppContext;

beforeAll(() => {
  // 构造一个父级 app，把 element-plus 与 m-form 插件装上，
  // 之后通过 appContext 传给 submitForm 复用全局注册
  const parentApp = createApp(defineComponent({ render: () => h('div') }));
  parentApp.use(ElementPlus);
  parentApp.use(MagicForm);
  appContext = parentApp._context;
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('submitForm', () => {
  test('校验通过时 resolve 表单值，并自动清理 DOM', async () => {
    const values = await submitForm({
      config: [
        {
          type: 'text',
          name: 'text',
          text: 'text',
        },
      ],
      initValues: { text: 'hello' },
      appContext,
    });

    expect(values).toEqual({ text: 'hello' });
    expect(document.body.querySelector('.m-form')).toBeNull();
  });

  test('native=true 时返回原始（未 clone）的 values', async () => {
    const initValues = { text: 'origin' };

    const values = await submitForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues,
      native: true,
      appContext,
    });

    expect(values).toEqual({ text: 'origin' });
  });

  test('支持 extendState 扩展状态', async () => {
    const extendState = vi.fn(async () => ({ extra: 'value' }));

    await submitForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'foo' },
      extendState,
      appContext,
    });

    expect(extendState).toHaveBeenCalled();
  });

  test('在嵌套 items 配置下也能正确 resolve', async () => {
    const values = await submitForm({
      config: [
        { type: 'text', name: 'name', text: 'name' },
        {
          name: 'object',
          items: [{ type: 'text', name: 'nested', text: 'nested' }],
        },
      ],
      initValues: {
        name: 'a',
        object: { nested: 'b' },
      },
      appContext,
    });

    expect(values).toEqual({
      name: 'a',
      object: { nested: 'b' },
    });
  });

  test('returnChangeRecords=true 时返回 { values, changeRecords }', async () => {
    const result = await submitForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'hello' },
      returnChangeRecords: true,
      appContext,
    });

    expect(result).toHaveProperty('values');
    expect(result).toHaveProperty('changeRecords');
    expect(result.values).toEqual({ text: 'hello' });
    expect(Array.isArray(result.changeRecords)).toBe(true);
  });

  test('未设置 returnChangeRecords 时仅返回 values（不包裹）', async () => {
    const result = await submitForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'hello' },
      appContext,
    });

    expect(result).toEqual({ text: 'hello' });
    expect(result).not.toHaveProperty('changeRecords');
  });

  test('多次连续调用不会相互干扰', async () => {
    const [v1, v2] = await Promise.all([
      submitForm({
        config: [{ type: 'text', name: 'text', text: 'text' }],
        initValues: { text: 'first' },
        appContext,
      }),
      submitForm({
        config: [{ type: 'text', name: 'text', text: 'text' }],
        initValues: { text: 'second' },
        appContext,
      }),
    ]);

    expect(v1).toEqual({ text: 'first' });
    expect(v2).toEqual({ text: 'second' });
    expect(document.body.querySelector('.m-form')).toBeNull();
  });

  test('多次串行调用后 document.body 不留下任何节点', async () => {
    const baseChildCount = document.body.children.length;

    for (let i = 0; i < 5; i++) {
      await submitForm({
        config: [{ type: 'text', name: 'text', text: 'text' }],
        initValues: { text: `value-${i}` },
        appContext,
      });
    }

    // 反复调用后，body 下不应残留任何挂载容器
    expect(document.body.children.length).toBe(baseChildCount);
    expect(document.body.querySelector('.m-form')).toBeNull();
  });

  test('调用过程中临时容器会被附加到 body 上，结束后被移除', async () => {
    const baseChildCount = document.body.children.length;

    const pending = submitForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'in-flight' },
      appContext,
    });

    // 此时容器应已加入 body
    expect(document.body.children.length).toBe(baseChildCount + 1);

    await pending;

    expect(document.body.children.length).toBe(baseChildCount);
  });

  test('未注入 DOM 环境时（document 不可用）以错误 reject', async () => {
    const originalDocument = globalThis.document;

    // 模拟纯 Node 环境
    delete (globalThis as any).document;

    let caught: any = null;
    try {
      await submitForm({
        config: [{ type: 'text', name: 'text', text: 'text' }],
        initValues: { text: 'no-dom' },
        appContext,
      });
    } catch (e) {
      caught = e;
    } finally {
      (globalThis as any).document = originalDocument;
    }

    expect(caught).toBeInstanceOf(Error);
  });

  test('timeout > 0 时会注册定时器，timeout <= 0 时不注册', async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    await submitForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'with-timeout' },
      timeout: 5000,
      appContext,
    });

    const calledWithTimeout = setTimeoutSpy.mock.calls.some(([, delay]) => delay === 5000);
    expect(calledWithTimeout).toBe(true);

    setTimeoutSpy.mockClear();

    await submitForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'no-timeout' },
      timeout: 0,
      appContext,
    });

    const calledWithZero = setTimeoutSpy.mock.calls.some(([, delay]) => delay === 0);
    expect(calledWithZero).toBe(false);

    setTimeoutSpy.mockRestore();
  });
});
