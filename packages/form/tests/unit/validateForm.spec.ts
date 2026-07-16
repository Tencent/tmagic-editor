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
import { type AppContext, createApp, defineComponent, h, nextTick } from 'vue';
import MagicForm, { validateForm } from '@form/index';
import ElementPlus from 'element-plus';

let appContext: AppContext;

beforeAll(() => {
  // 构造一个父级 app，把 element-plus 与 m-form 插件装上，
  // 之后通过 appContext 传给 validateForm 复用全局注册
  const parentApp = createApp(defineComponent({ render: () => h('div') }));
  parentApp.use(ElementPlus);
  parentApp.use(MagicForm);
  appContext = parentApp._context;
});

afterEach(() => {
  document.body.innerHTML = '';
});

// 说明：validateForm 内部会新建一个独立的 MForm 实例并复用其校验方法 `validate`（返回错误文案、不抛异常），
// 校验失败时的错误文案格式由 Form.vue 实例的 `validate` 负责，已在 Form.extra.spec.ts
// 中覆盖；此处聚焦 validateForm 独有的「命令式挂载 / 卸载 / 上下文注入 / 超时」等行为。
describe('validateForm', () => {
  test('校验通过时 resolve 空字符串，并自动清理 DOM', async () => {
    const error = await validateForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'hello' },
      appContext,
    });

    expect(error).toBe('');
    expect(document.body.querySelector('.m-form')).toBeNull();
  });

  test('resolve 结果始终为字符串（校验入口不抛异常）', async () => {
    const error = await validateForm({
      config: [{ type: 'text', name: 'name', text: '名称' }],
      initValues: { name: '' },
      appContext,
    });

    expect(typeof error).toBe('string');
    expect(document.body.querySelector('.m-form')).toBeNull();
  });

  test('支持 extendState 扩展状态', async () => {
    const extendState = vi.fn(async () => ({ extra: 'value' }));

    await validateForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'foo' },
      extendState,
      appContext,
    });

    expect(extendState).toHaveBeenCalled();
  });

  test('tab 的 display 函数读取 extendState 注入的值时不会因竞态崩溃', async () => {
    // 模拟编辑器 styleTabConfig.display 的模式：display 函数从 mForm 解构 services
    // services 通过 extendState 注入。若 extendState 异步且在首次渲染前未完成，
    // display 函数会读到 undefined 导致 TypeError。
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
      extendState: () => ({
        services: { uiService: { get: () => false } },
      }),
      appContext,
    });

    expect(typeof error).toBe('string');
    expect(document.body.querySelector('.m-form')).toBeNull();
  });

  test('在嵌套 items 配置下也能正确 resolve', async () => {
    const error = await validateForm({
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

    expect(error).toBe('');
  });

  test('去除 type 为 tab 的容器中各标签页的 lazy，使懒加载标签页字段也参与校验', async () => {
    const config: any = [
      {
        type: 'tab',
        items: [
          { title: '属性', items: [{ type: 'text', name: 'name', text: '名称' }] },
          { title: '样式', lazy: true, items: [{ type: 'text', name: 'style', text: '样式' }] },
        ],
      },
    ];

    const error = await validateForm({
      config,
      initValues: { name: 'a', style: 'b' },
      appContext,
    });

    expect(error).toBe('');
    // 校验只使用 config 副本，不污染调用方传入的原始配置
    expect(config[0].items[1].lazy).toBe(true);
    expect(document.body.querySelector('.m-form')).toBeNull();
  });

  test('嵌套在标签页内的 tab 容器的 lazy 同样被去除', async () => {
    const config: any = [
      {
        type: 'tab',
        items: [
          {
            title: '外层',
            items: [
              {
                type: 'tab',
                items: [
                  { title: '内层1', items: [{ type: 'text', name: 'inner1', text: '内层1' }] },
                  {
                    title: '内层2',
                    lazy: true,
                    items: [{ type: 'text', name: 'inner2', text: '内层2' }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const error = await validateForm({
      config,
      initValues: { inner1: 'a', inner2: 'b' },
      appContext,
    });

    expect(typeof error).toBe('string');
    // 原始配置不被污染
    expect(config[0].items[0].items[0].items[1].lazy).toBe(true);
    expect(document.body.querySelector('.m-form')).toBeNull();
  });

  test('多次并发调用互不干扰，且结束后不在 body 残留节点', async () => {
    const baseChildCount = document.body.children.length;

    const results = await Promise.all([
      validateForm({
        config: [{ type: 'text', name: 'text', text: 'text' }],
        initValues: { text: 'first' },
        appContext,
      }),
      validateForm({
        config: [{ type: 'text', name: 'text', text: 'text' }],
        initValues: { text: 'second' },
        appContext,
      }),
    ]);

    expect(results).toEqual(['', '']);
    expect(document.body.children.length).toBe(baseChildCount);
    expect(document.body.querySelector('.m-form')).toBeNull();
  });

  test('调用过程中临时容器会被附加到 body 上，结束后被移除', async () => {
    const baseChildCount = document.body.children.length;

    const pending = validateForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'in-flight' },
      appContext,
    });

    expect(document.body.children.length).toBe(baseChildCount + 1);

    await pending;

    expect(document.body.children.length).toBe(baseChildCount);
  });

  test('未注入 DOM 环境时（document 不可用）以错误 reject', async () => {
    const originalDocument = globalThis.document;

    delete (globalThis as any).document;

    let caught: any = null;
    try {
      await validateForm({
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

    await validateForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'with-timeout' },
      timeout: 5000,
      appContext,
    });

    const calledWithTimeout = setTimeoutSpy.mock.calls.some(([, delay]) => delay === 5000);
    expect(calledWithTimeout).toBe(true);

    setTimeoutSpy.mockClear();

    await validateForm({
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

describe('validateForm —— debug 模式', () => {
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

  test('debug 模式可见渲染弹层，点击「确定」校验通过后 resolve 空字符串并清理 DOM', async () => {
    const pending = validateForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'hello' },
      debug: true,
      appContext,
    });

    // 等待弹层与表单渲染
    await nextTick();
    await nextTick();

    // debug 模式容器未隐藏，表单可见渲染
    expect(document.body.querySelector('.m-form')).not.toBeNull();

    findButton('确定').click();

    const error = await pending;
    expect(error).toBe('');
    expect(document.body.querySelector('.m-form')).toBeNull();
  });

  test('点击「取消」以错误 reject 并清理 DOM', async () => {
    const pending = validateForm({
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
    const pending = validateForm({
      config: [{ type: 'text', name: 'name', text: '名称' }],
      initValues: { name: '' },
      debug: true,
      appContext,
    });
    await nextTick();
    await nextTick();

    // mock MForm 实例的 validate 返回非空错误文案（真实 element-plus 校验在 jsdom 下不可靠）
    const comp = findMFormInstance();
    expect(comp).toBeTruthy();
    mockExposed(comp, 'validate', vi.fn().mockResolvedValue('名称 -> 必填'));

    findButton('确定').click();

    // 等待异步校验完成并展示错误（mock validate 为 resolved，需等 microtask + DOM 更新）
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

  test('debug 模式不注册超时定时器（等待人工操作）', async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    const pending = validateForm({
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
