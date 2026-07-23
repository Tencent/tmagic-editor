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
import { type AppContext, createApp, defineComponent, h, inject, nextTick } from 'vue';
import MagicForm, { FORM_SILENT_MODE_KEY, submitForm, validateForm } from '@form/index';
import ElementPlus from 'element-plus';

let appContext: AppContext;

// 探针字段：挂载时注入静默标记并记录，用于验证 submitForm/validateForm 的 provide 行为
const silentProbeValues: (boolean | undefined)[] = [];
const SilentProbe = defineComponent({
  name: 'MFieldsSilentProbe',
  setup() {
    silentProbeValues.push(inject(FORM_SILENT_MODE_KEY, undefined));
    return () => h('div');
  },
});

beforeAll(() => {
  // 构造一个父级 app，把 element-plus 与 m-form 插件装上，
  // 之后通过 appContext 传给 submitForm 复用全局注册
  const parentApp = createApp(defineComponent({ render: () => h('div') }));
  parentApp.use(ElementPlus);
  parentApp.use(MagicForm);
  parentApp.component('m-fields-silent-probe', SilentProbe);
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

  test('extendState 返回 keyProp 等内置保留字段时静默跳过且正常 resolve', async () => {
    const values = await submitForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'foo' },
      extendState: () => ({ keyProp: 'custom', extra: 'value' }),
      appContext,
    });

    // keyProp 属于内置保留字段，被静默跳过，不污染最终 values
    expect(values).toEqual({ text: 'foo' });
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

  test('静默（隐藏挂载）模式下向字段 provide FORM_SILENT_MODE_KEY=true', async () => {
    silentProbeValues.length = 0;

    const values = await submitForm({
      config: [{ type: 'silent-probe', name: 'text', text: 'text' }],
      initValues: { text: 'hello' },
      appContext,
    });

    expect(values).toEqual({ text: 'hello' });
    expect(silentProbeValues).toEqual([true]);
  });

  test('静默标记不会泄漏到父级应用的 provides', async () => {
    silentProbeValues.length = 0;

    await submitForm({
      config: [{ type: 'silent-probe', name: 'text', text: 'text' }],
      initValues: { text: 'hello' },
      appContext,
    });

    expect((appContext as any).provides[FORM_SILENT_MODE_KEY as symbol]).toBeUndefined();
  });

  test('validateForm 静默模式下同样 provide FORM_SILENT_MODE_KEY=true', async () => {
    silentProbeValues.length = 0;

    const error = await validateForm({
      config: [{ type: 'silent-probe', name: 'text', text: 'text' }],
      initValues: { text: 'hello' },
      appContext,
    });

    expect(error).toBe('');
    expect(silentProbeValues).toEqual([true]);
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

describe('submitForm —— debug 模式', () => {
  const findButton = (text: string) =>
    Array.from(document.body.querySelectorAll('button')).find(
      (b) => (b.textContent || '').trim() === text,
    ) as HTMLButtonElement;

  // 通过 Vue 渲染留下的内部指针定位 MForm 组件实例，用于 mock 其 expose 方法。
  // 真实 element-plus 校验在 jsdom 下不可靠（form-item 未注册到 form），故校验失败分支以 mock 方式验证。
  const findMFormInstance = (): any => {
    const formEl = document.body.querySelector('.m-form') as any;
    let comp: any = formEl?.__vueParentComponent;
    while (comp && comp.type?.name !== 'MForm' && comp.type?.__name !== 'MForm') comp = comp.parent;
    return comp;
  };

  const mockExposed = (comp: any, method: string, fn: any) => {
    Object.defineProperty(comp.exposed, method, { value: fn, configurable: true, writable: true });
  };

  test('debug 模式可见渲染弹层，点击「确定」校验通过后 resolve 表单值并清理 DOM', async () => {
    const pending = submitForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'hello' },
      debug: true,
      appContext,
    });

    await nextTick();
    await nextTick();

    // debug 模式容器未隐藏，表单可见渲染
    expect(document.body.querySelector('.m-form')).not.toBeNull();

    findButton('确定').click();

    const values = await pending;
    expect(values).toEqual({ text: 'hello' });
    expect(document.body.querySelector('.m-form')).toBeNull();
  });

  test('点击「取消」以错误 reject 并清理 DOM', async () => {
    const pending = submitForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'hello' },
      debug: true,
      appContext,
    });
    await nextTick();
    await nextTick();

    findButton('取消').click();

    let caught: any = null;
    try {
      await pending;
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(Error);
    expect(caught.message).toContain('canceled');
    expect(document.body.querySelector('.m-form')).toBeNull();
  });

  test('校验失败时点击「确定」在弹层展示错误并保留弹层，随后取消结束', async () => {
    const pending = submitForm({
      config: [{ type: 'text', name: 'name', text: '名称' }],
      initValues: { name: '' },
      debug: true,
      appContext,
    });
    await nextTick();
    await nextTick();

    // mock MForm 实例的 submitForm 抛出汇总错误（真实 element-plus 校验在 jsdom 下不可靠）
    const comp = findMFormInstance();
    expect(comp).toBeTruthy();
    mockExposed(comp, 'submitForm', vi.fn().mockRejectedValue(new Error('名称 -> 必填')));

    findButton('确定').click();

    // 等待异步校验完成并展示错误（mock submitForm 为 rejected，需等 microtask + DOM 更新）
    await vi.waitFor(
      () => {
        const el = Array.from(document.body.querySelectorAll('div')).find((d) =>
          (d.textContent || '').includes('名称 -> 必填'),
        );
        expect(el).toBeTruthy();
      },
      { timeout: 1000 },
    );

    // 弹层保留
    expect(document.body.querySelector('.m-form')).not.toBeNull();

    // promise 仍 pending：点击取消以 reject 结束，避免悬挂
    findButton('取消').click();

    let caught: any = null;
    try {
      await pending;
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(Error);
    expect(caught.message).toContain('canceled');
    expect(document.body.querySelector('.m-form')).toBeNull();
  });

  test('debug 模式不提供静默标记（表单可见，字段应正常渲染）', async () => {
    silentProbeValues.length = 0;

    const pending = submitForm({
      config: [{ type: 'silent-probe', name: 'text', text: 'text' }],
      initValues: { text: 'hello' },
      debug: true,
      appContext,
    });
    await nextTick();
    await nextTick();

    expect(silentProbeValues).toEqual([undefined]);

    findButton('确定').click();
    await pending;
  });

  test('debug 模式不注册超时定时器（等待人工操作）', async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    const pending = submitForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'hello' },
      debug: true,
      timeout: 5000,
      appContext,
    });
    await nextTick();
    await nextTick();

    const calledWithTimeout = setTimeoutSpy.mock.calls.some(([, delay]) => delay === 5000);
    expect(calledWithTimeout).toBe(false);

    findButton('确定').click();
    await pending;
    setTimeoutSpy.mockRestore();
  });
});
