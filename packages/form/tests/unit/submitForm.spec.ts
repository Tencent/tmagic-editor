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

import { clearFields, registerFields, submitForm } from '@form/index';

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

// 探针字段：被真实实例化时记一次，用于区分「纯逻辑校验」与「dialog 弹层真实渲染」
const probeMountCount = { value: 0 };
const MountProbe = defineComponent({
  name: 'MFieldsMountProbe',
  setup() {
    probeMountCount.value += 1;
    return () => h('div');
  },
});

beforeAll(() => {
  appContext = createFormAppContext((app) => app.component('m-fields-mount-probe', MountProbe));
});

afterEach(() => {
  document.body.innerHTML = '';
  probeMountCount.value = 0;
  clearFields();
});

/** 探针配置：mount-probe 不是内置 type，无渲染路径不会实例化该组件 */
const probeConfig = [{ type: 'mount-probe', name: 'text', text: 'text' }];

// submitForm 走无渲染实现：不挂载组件、不需要 DOM。
// 校验引擎本身的行为在 utils/validateValues.spec.ts 中覆盖；
// 此处聚焦 submitForm 这一层：返回值形态、无 DOM 可用、未登记 type 不挂载、dialog 弹层。
describe('submitForm', () => {
  test('校验通过时 resolve 表单值，且不产生任何 DOM', async () => {
    const baseChildCount = document.body.children.length;

    const values = await submitForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'hello' },
    });

    expect(values).toEqual({ text: 'hello' });
    expect(document.body.children.length).toBe(baseChildCount);
    expect(document.body.querySelector('.m-form')).toBeNull();
  });

  test('校验失败时以错误文案 reject', async () => {
    const caught = await captureError(() =>
      submitForm({
        config: [{ type: 'text', name: 'name', text: '名称', rules: required() }],
        initValues: { name: '' },
      }),
    );

    expect(caught).toBeInstanceOf(Error);
    expect(caught.message).toBe('名称 -> 必填');
  });

  test('config 中的 defaultValue 会被填入结果', async () => {
    const values = await submitForm({
      config: [
        { type: 'text', name: 'text', text: 'text' },
        { type: 'text', name: 'withDefault', text: 'withDefault', defaultValue: 'fallback' },
      ] as any,
      initValues: { text: 'hello' },
    });

    expect(values).toEqual({ text: 'hello', withDefault: 'fallback' });
  });

  test('native=true 时返回未经 clone 的 values', async () => {
    const values = await submitForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'origin' },
      native: true,
    });

    expect(values).toEqual({ text: 'origin' });
  });

  test('默认（native 未开启）返回的是深拷贝，不与调用方入参共享引用', async () => {
    const initValues = { object: { nested: 'b' } };

    const values = await submitForm({
      config: [{ name: 'object', items: [{ type: 'text', name: 'nested', text: 'nested' }] }],
      initValues,
    });

    expect(values).toEqual({ object: { nested: 'b' } });
    values.object.nested = 'mutated';
    expect(initValues.object.nested).toBe('b');
  });

  test('context 可被 defaultValue 经 mForm 读到', async () => {
    const values = await submitForm({
      config: [
        {
          type: 'text',
          name: 'u',
          text: 'u',
          defaultValue: (mForm: any) => mForm?.username ?? 'MISSING',
        },
      ],
      initValues: {},
      context: { username: 'from-context' },
    });

    expect(values).toEqual({ u: 'from-context' });
  });

  test('context 携带 keyProp 等内置保留字段时不污染最终 values', async () => {
    const values = await submitForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'foo' },
      context: { keyProp: 'custom', extra: 'value' } as any,
    });

    expect(values).toEqual({ text: 'foo' });
  });

  test('在嵌套 items 配置下也能正确 resolve', async () => {
    const values = await submitForm({
      config: [
        { type: 'text', name: 'name', text: 'name' },
        { name: 'object', items: [{ type: 'text', name: 'nested', text: 'nested' }] },
      ],
      initValues: { name: 'a', object: { nested: 'b' } },
    });

    expect(values).toEqual({ name: 'a', object: { nested: 'b' } });
  });

  test('returnChangeRecords=true 时返回 { values, changeRecords }，无渲染下变更记录为空', async () => {
    const result = await submitForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'hello' },
      returnChangeRecords: true,
    });

    expect(result.values).toEqual({ text: 'hello' });
    // 无渲染校验没有用户交互，因此不存在变更记录
    expect(result.changeRecords).toEqual([]);
  });

  test('未设置 returnChangeRecords 时仅返回 values（不包裹）', async () => {
    const result = await submitForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'hello' },
    });

    expect(result).toEqual({ text: 'hello' });
    expect(result).not.toHaveProperty('changeRecords');
  });

  test('多次并发调用互不干扰', async () => {
    const config = [{ type: 'text', name: 'text', text: 'text' }];

    const [v1, v2] = await Promise.all([
      submitForm({ config, initValues: { text: 'first' } }),
      submitForm({ config, initValues: { text: 'second' } }),
    ]);

    expect(v1).toEqual({ text: 'first' });
    expect(v2).toEqual({ text: 'second' });
  });

  test('多次串行调用后 document.body 不留下任何节点', async () => {
    const baseChildCount = document.body.children.length;

    for (let i = 0; i < 5; i++) {
      await submitForm({
        config: [{ type: 'text', name: 'text', text: 'text' }],
        initValues: { text: `value-${i}` },
      });
    }

    expect(document.body.children.length).toBe(baseChildCount);
  });

  test('signal 已中断时立即以 reason 抛错', async () => {
    const controller = new AbortController();
    const reason = new Error('canceled by caller');
    controller.abort(reason);

    await expect(
      submitForm({
        config: [{ type: 'text', name: 'text', text: 'text' }],
        initValues: { text: 'a' },
        signal: controller.signal,
      }),
    ).rejects.toBe(reason);
  });
});

describe('submitForm —— 无 DOM 环境', () => {
  test('全为内置类型时，无 document 也能取回表单值', async () => {
    const values = await withoutDocument(() =>
      submitForm({
        config: [{ type: 'text', name: 'text', text: 'text' }],
        initValues: { text: 'no-dom' },
      }),
    );

    expect(values).toEqual({ text: 'no-dom' });
  });

  test('无 document 时校验规则依然生效', async () => {
    const caught = await withoutDocument(() =>
      captureError(() =>
        submitForm({
          config: [{ type: 'text', name: 'name', text: '名称', rules: required() }],
          initValues: { name: '' },
        }),
      ),
    );

    expect(caught).toBeInstanceOf(Error);
    expect(caught.message).toBe('名称 -> 必填');
  });

  test('无 document 时未登记 type 也能提交', async () => {
    const values = await withoutDocument(() =>
      submitForm({ config: probeConfig, initValues: { text: 'hello' }, appContext }),
    );

    expect(values).toEqual({ text: 'hello' });
  });
});

describe('submitForm —— 未登记字段 type', () => {
  test('即使有 DOM 也不挂载字段组件，无 rules 时直接 resolve', async () => {
    const baseChildCount = document.body.children.length;

    const values = await submitForm({ config: probeConfig, initValues: { text: 'hello' }, appContext });

    expect(values).toEqual({ text: 'hello' });
    expect(probeMountCount.value).toBe(0);
    expect(document.body.children.length).toBe(baseChildCount);
  });

  test('登记为叶子字段后提交仍不渲染任何组件', async () => {
    registerFields({ 'mount-probe': {} });

    const values = await submitForm({ config: probeConfig, initValues: { text: 'hello' }, appContext });

    expect(values).toEqual({ text: 'hello' });
    expect(probeMountCount.value).toBe(0);
  });

  test('登记为叶子字段后，无 DOM 也能提交', async () => {
    registerFields({ 'totally-unknown': {} });

    const values = await withoutDocument(() =>
      submitForm({
        config: [{ type: 'totally-unknown', name: 'x', text: 'X' }] as any,
        initValues: { x: 'v' },
      }),
    );

    expect(values).toEqual({ x: 'v' });
  });
});

describe('submitForm —— dialog 弹层', () => {
  test('可见渲染弹层，点击「确定」校验通过后 resolve 表单值并清理 DOM', async () => {
    const pending = submitForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'hello' },
      dialog: true,
      appContext,
    });

    await nextTick();
    await nextTick();

    // 弹层容器未隐藏，表单可见渲染
    expect(document.body.querySelector('.m-form')).not.toBeNull();

    findButton('确定').click();

    const values = await pending;
    expect(values).toEqual({ text: 'hello' });
    expect(document.body.querySelector('.m-form')).toBeNull();
  });

  test('弹层标题可配置', async () => {
    const pending = submitForm({
      config: [{ type: 'text', name: 'text', text: 'text' }],
      initValues: { text: 'hello' },
      dialog: true,
      title: '编辑配置',
      appContext,
    });
    await nextTick();
    await nextTick();

    expect(document.body.textContent).toContain('编辑配置');
    expect(document.body.textContent).not.toContain('submitForm');

    findButton('取消').click();
    await captureError(() => pending);
  });

  test('点击「取消」以错误 reject 并清理 DOM', async () => {
    const pending = submitForm({
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
    const pending = submitForm({
      config: [{ type: 'text', name: 'name', text: '名称' }],
      initValues: { name: '' },
      dialog: true,
      appContext,
    });
    await nextTick();
    await nextTick();

    const comp = findMFormInstance();
    expect(comp).toBeTruthy();
    mockExposed(comp, 'submitForm', vi.fn().mockRejectedValue(new Error('名称 -> 必填')));

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

    // 弹层保留
    expect(document.body.querySelector('.m-form')).not.toBeNull();

    // promise 仍 pending：点击取消以 reject 结束，避免悬挂
    findButton('取消').click();

    const caught = await captureError(() => pending);
    expect(caught).toBeInstanceOf(Error);
    expect(caught.message).toContain('canceled');
    expect(document.body.querySelector('.m-form')).toBeNull();
  });

  test('字段被真实实例化（dialog 是唯一会渲染的路径）', async () => {
    const pending = submitForm({ config: probeConfig, initValues: { text: 'hello' }, dialog: true, appContext });
    await nextTick();
    await nextTick();

    expect(probeMountCount.value).toBe(1);

    findButton('确定').click();
    await pending;
  });
});
