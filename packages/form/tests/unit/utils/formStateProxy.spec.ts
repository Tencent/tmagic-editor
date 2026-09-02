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

import { describe, expect, test } from 'vitest';
import { reactive, ref } from 'vue';

import type { FormState } from '@form/index';
import { createFormStateProxy, mergeFormContexts } from '@form/utils/formStateProxy';

const makeCore = (extra: Record<string, any> = {}): FormState =>
  reactive({
    config: [],
    initValues: {},
    lastValues: {},
    isCompare: false,
    values: {},
    lastValuesProcessed: {},
    $emit: () => undefined,
    keyProp: '__key',
    setField: () => undefined,
    getField: () => undefined,
    deleteField: () => undefined,
    $messageBox: {} as any,
    $message: {} as any,
    ...extra,
  }) as FormState;

describe('createFormStateProxy', () => {
  test('核心字段优先于 context', () => {
    const formState = createFormStateProxy(makeCore({ keyProp: 'id' }), () => ({ keyProp: 'hacked', extra: 1 }));

    expect(formState.keyProp).toBe('id');
    expect((formState as any).extra).toBe(1);
  });

  test('Object.entries 能枚举到扩展字段', () => {
    const formState = createFormStateProxy(makeCore(), () => ({ username: 'alice' }));
    const keys = Object.keys(formState);

    expect(keys).toContain('username');
    expect(keys).toContain('values');
    expect(Object.entries(formState).some(([k, v]) => k === 'username' && v === 'alice')).toBe(true);
  });

  test('set 写入 core，读取优先于 context', () => {
    const core = makeCore();
    const formState = createFormStateProxy(core, () => ({ stage: 'from-context' }));

    (formState as any).stage = 'assigned';
    expect((formState as any).stage).toBe('assigned');
    expect((core as any).stage).toBe('assigned');
  });

  test('has 在 core 或 context 命中时为 true', () => {
    const formState = createFormStateProxy(makeCore(), () => ({ username: 'alice' }));
    expect('values' in formState).toBe(true);
    expect('username' in formState).toBe(true);
    expect('missing' in formState).toBe(false);
  });

  test('symbol key 只走 core，四个 trap 语义一致', () => {
    const key = Symbol('vue-raw');
    const core = makeCore();
    (core as any)[key] = 'from-core';
    const onlyInContext = Symbol('ctx-only');
    const formState = createFormStateProxy(core, () => ({ [key]: 'from-context', [onlyInContext]: 1 }));

    expect((formState as any)[key]).toBe('from-core');
    // context 上的 symbol 不应被 has / ownKeys / getOwnPropertyDescriptor 报告为存在，
    // 否则会与 get 返回 undefined 自相矛盾
    expect(onlyInContext in formState).toBe(false);
    expect(Object.getOwnPropertySymbols(formState)).not.toContain(onlyInContext);
    expect(Object.getOwnPropertyDescriptor(formState, onlyInContext)).toBeUndefined();
    expect((formState as any)[onlyInContext]).toBeUndefined();
  });

  test('core 上存在但值为 undefined 的字段不读穿 context', () => {
    const formState = createFormStateProxy(makeCore({ parentValues: undefined }), () => ({ parentValues: { a: 1 } }));
    expect(formState.parentValues).toBeUndefined();
  });

  test('getContext 返回 undefined 时读扩展字段不抛错', () => {
    const formState = createFormStateProxy(makeCore(), () => undefined as any);
    expect((formState as any).username).toBeUndefined();
    expect('username' in formState).toBe(false);
  });

  test('getOwnPropertyDescriptor 对 core/context 都不存在的 key 返回 undefined', () => {
    const formState = createFormStateProxy(makeCore(), () => ({ username: 'alice' }));
    expect(Object.getOwnPropertyDescriptor(formState, 'nope')).toBeUndefined();
    expect(Object.getOwnPropertyDescriptor(formState, 'username')?.enumerable).toBe(true);
  });

  test('mForm 自引用回 formState，读能穿到 core 与 context', () => {
    const formState = createFormStateProxy(makeCore({ keyProp: 'id' }), () => ({ username: 'alice' }));
    const vm = formState as any;

    expect(vm.mForm).toBe(formState);
    expect(vm.mForm.keyProp).toBe('id');
    expect(vm.mForm.username).toBe('alice');
    expect('mForm' in formState).toBe(true);
  });

  test('往 mForm 上挂的方法落到 core 并持久可读，跨回调可取回', () => {
    const core = makeCore();
    const formState = createFormStateProxy(core, () => ({ username: 'alice' }));
    const vm = formState as any;

    // 存量配置的跨字段通信写法：一个 validator 里挂，另一处取出来调用
    const check = () => 'checked';
    vm.mForm.checkPropertyLimit = check;

    expect((core as any).checkPropertyLimit).toBe(check);
    expect(vm.mForm.checkPropertyLimit()).toBe('checked');
    expect(vm.checkPropertyLimit).toBe(check);
  });

  test('mForm 不进入枚举，避免循环引用', () => {
    const formState = createFormStateProxy(makeCore(), () => ({ username: 'alice' }));

    expect(Object.keys(formState)).not.toContain('mForm');
    expect(() => JSON.stringify({ ...formState })).not.toThrow();
  });

  test('core 或 context 显式提供 mForm 时不被自引用覆盖', () => {
    const host = { name: 'host-mForm' };
    const fromContext = createFormStateProxy(makeCore(), () => ({ mForm: host }) as any);
    expect((fromContext as any).mForm).toBe(host);

    const own = { name: 'core-mForm' };
    const fromCore = createFormStateProxy(makeCore({ mForm: own }), () => ({ mForm: host }) as any);
    expect((fromCore as any).mForm).toEqual(own);
  });

  /**
   * 嵌套表单（ComponentForm）把父 formState 整体当 context 传给子表单，
   * 此时 mForm 应命中 context 指向父表单——与 extendState 时代把父状态并入子状态一致，
   * 跨字段通信仍落在同一份对象上。不要「修正」成指向子表单。
   */
  test('父 formState 作为 context 时，mForm 指向父表单而非自引用', () => {
    const parent = createFormStateProxy(makeCore({ owner: 'parent' }), () => ({}) as any);
    const child = createFormStateProxy(makeCore({ owner: 'child' }), () => parent as any);

    expect((child as any).mForm).toBe(parent);
    // 子表单自己的 core 字段仍优先，不被父级覆盖
    expect((child as any).owner).toBe('child');

    // 跨字段通信：一个回调往 mForm 上挂，另一个回调取回，落在同一份对象上
    (child as any).mForm.checkLimit = () => 'ok';
    expect((parent as any).checkLimit()).toBe('ok');
  });

  test('把 formState 自己当 context 传回来不爆栈', () => {
    // 闭包只在 trap 触发时求值，构造期不会读到未初始化的 formState
    const formState: any = createFormStateProxy(makeCore({ a: 1 }), () => formState);

    expect(formState.a).toBe(1);
    expect(formState.missing).toBeUndefined();
    expect('missing' in formState).toBe(false);
    // 自引用不提供额外字段，mForm 仍由兜底合成
    expect(formState.mForm).toBe(formState);
    expect(Object.keys(formState)).toContain('a');
  });

  test('getContext 可以是 Ref', () => {
    const ctx = ref({ username: 'alice' });
    const formState = createFormStateProxy(makeCore(), ctx);
    expect((formState as any).username).toBe('alice');
    ctx.value = { username: 'bob' };
    expect((formState as any).username).toBe('bob');
  });
});

describe('mergeFormContexts', () => {
  test('靠后的层优先', () => {
    const merged = mergeFormContexts({ a: 1, b: 1 }, { b: 2, c: 2 }, { c: 3 }) as any;

    expect(merged.a).toBe(1);
    expect(merged.b).toBe(2);
    expect(merged.c).toBe(3);
  });

  test('accessor 保持读时求值，不在合并时被展开', () => {
    let count = 0;
    const layer = Object.defineProperties(
      {},
      {
        stage: {
          enumerable: true,
          get: () => {
            count += 1;
            return count;
          },
        },
      },
    );

    const merged = mergeFormContexts(layer) as any;
    expect(count).toBe(0);

    const multi = mergeFormContexts({ other: 1 }, layer) as any;
    expect(count).toBe(0);
    expect(multi.stage).toBe(1);
    expect(multi.stage).toBe(2);
    expect(merged.stage).toBe(3);
  });

  test('枚举语义覆盖所有层，且不重复', () => {
    const merged = mergeFormContexts({ a: 1, b: 1 }, { b: 2, c: 2 });

    expect(Object.keys(merged).sort()).toEqual(['a', 'b', 'c']);
    expect(Object.entries(merged).sort()).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 2],
    ]);
  });

  test('忽略 undefined / null 层；零层与单层不额外包 Proxy', () => {
    const only = { a: 1 };

    expect(mergeFormContexts(undefined, null)).toEqual({});
    expect(mergeFormContexts(undefined, only, null)).toBe(only);
    // 空层数组每次返回同一个共享空对象
    expect(mergeFormContexts()).toBe(mergeFormContexts(undefined));
  });

  test('has 与 getOwnPropertyDescriptor 与取值一致', () => {
    const merged = mergeFormContexts({ a: 1 }, { b: 2 });

    expect('a' in merged).toBe(true);
    expect('b' in merged).toBe(true);
    expect('missing' in merged).toBe(false);
    expect(Object.getOwnPropertyDescriptor(merged, 'b')?.value).toBe(2);
    expect(Object.getOwnPropertyDescriptor(merged, 'missing')).toBeUndefined();
  });
});
