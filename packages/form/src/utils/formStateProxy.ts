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

import { type Ref, unref } from 'vue';

import type { FormContext, FormState } from '../schema';

/** 无上下文时共用的空对象，避免每次读取都分配新对象 */
const EMPTY_CONTEXT: FormContext = Object.freeze({});

/**
 * 按优先级分层合并上下文，**靠后的层优先**。
 *
 * 用读穿 Proxy 而非 `{ ...a, ...b }`：展开会立即执行 accessor，
 * 而宿主允许用 `{ get stage() { ... } }` 这类读时求值的描述符。
 */
export const mergeFormContexts = (...layers: (FormContext | undefined | null)[]): FormContext => {
  const stack = layers.filter((layer): layer is FormContext => Boolean(layer));

  if (stack.length === 0) return EMPTY_CONTEXT;
  if (stack.length === 1) return stack[0];

  // 反转成「高优先级在前」，查找时取第一个命中的层
  const ordered = stack.slice().reverse() as Record<string | symbol, any>[];
  const owner = (k: string | symbol) => ordered.find((layer) => Reflect.has(layer, k));

  const target: Record<string | symbol, any> = {};

  return new Proxy(target, {
    get: (_t, k) => owner(k)?.[k],
    has: (_t, k) => Boolean(owner(k)),
    ownKeys: () => [...new Set(ordered.flatMap((layer) => Reflect.ownKeys(layer)))],
    getOwnPropertyDescriptor: (_t, k) => {
      for (const layer of ordered) {
        const descriptor = Object.getOwnPropertyDescriptor(layer, k);
        // 目标是空对象，必须报告为 configurable，否则违反 Proxy 不变式
        if (descriptor) return { ...descriptor, configurable: true };
      }
      return undefined;
    },
  }) as FormContext;
};

/**
 * 存量下发配置沿用 Vue2 时代的写法，把回调第一个参数当组件实例用，靠 `vm.mForm.xxx`
 * 取表单状态。这类配置除了读，还会往上面挂方法做跨字段通信，例如：
 *
 * ```js
 * vm.mForm.checkPropertyLimit = async (...) => { ... }   // 一个字段的 validator 里挂
 * await vm.mForm.checkPropertyLimit(...)                 // 另一处再取出来调用
 * ```
 *
 * 所以 `mForm` 必须能指回某个 formState：读能落到 core / context，写能经 `set` trap
 * 落到 coreState 并持久化。
 *
 * 优先级是 core > context > 合成自引用，三者都是刻意的：
 *
 * - **core**：`formState.mForm = formState` 这类直写（如 FormPreview 用自建 services 时）
 *   必须最优先。
 * - **context**：唯一的生产者是把父 formState 整体当 context 传下来的嵌套表单
 *   （ComponentForm）。此时 `mForm` 命中 context 指向**父表单**，与 `extendState` 时代
 *   把父 formState 并入子状态的结果一致，跨字段通信仍落在同一份对象上。父 formState
 *   本身也是 Proxy，写入照样持久化，所以这里让 context 赢是对的，别「修正」成指向子表单。
 * - **合成自引用**：前两者都没有时才兜底，让 `vm.mForm.xxx = fn` 落到自己的 coreState。
 *
 * 由此推出一条约束：**不要往 context 里塞普通对象充当 `mForm`**。context 通常是 computed
 * 产物，依赖一变就重建，挂上去的方法会静默丢失。要么直写 core，要么什么都不放交给兜底。
 *
 * 枚举语义上合成的自引用表现得像原型链上的属性：`'mForm' in state` 为真，但不出现在
 * `Object.keys(state)` 里，`getOwnPropertyDescriptor` 也返回 undefined。这是故意的——
 * 按扩展字段打包 formState 的调用方（如发给 AI 的逻辑）会因循环引用炸掉。
 */
const SELF_REF_KEY = 'mForm';

/**
 * 将 coreState 与宿主业务上下文关联：读取时优先 core，miss 再读穿到 context。
 *
 * - `get` 用属性访问而非 `Reflect.get(t, k, receiver)`，避免破坏 Vue reactive 的 `__v_raw`；
 * - symbol 键一律只走 core，四个 trap 保持一致。context 是业务数据袋，不承载 symbol 键，
 *   把 Vue / 工具链的内部 symbol 隔离在 core 上才能让 `toRaw` / `isReactive` 判定正确；
 * - `ownKeys` + `getOwnPropertyDescriptor` 保证 `Object.entries(formState)` 能枚举到扩展字段
 *   （admin-web-next 的 `pickPanelFormStateExtendFields` 依赖此语义）；
 * - `set` 写入 coreState，第三方 `formState.xxx = v` 仍生效且优先于 context。
 *
 * 独立成文件，避免与 `form.ts` ↔ `typeMatch.ts` 形成循环依赖。
 */
export const createFormStateProxy = (
  coreState: FormState,
  getContext: (() => FormContext) | Ref<FormContext>,
): FormState => {
  const resolve = (): Record<string | symbol, any> => {
    const ctx = (typeof getContext === 'function' ? getContext() : unref(getContext)) || EMPTY_CONTEXT;
    // 把 formState 自己当 context 传回来（`:context="formState"`）会让 get / has 无限递归，
    // 直接爆栈。这种自引用本就提供不了任何额外字段，断掉即可。
    return ctx === proxy ? EMPTY_CONTEXT : ctx;
  };

  const proxy = new Proxy(coreState as object, {
    get(t, k) {
      if (typeof k === 'symbol') return Reflect.get(t, k);
      const v = (t as any)[k];
      if (v !== undefined || Reflect.has(t, k)) return v;

      const ctx = resolve();
      if (k in ctx) return ctx[k];
      // 自引用不进 ownKeys：枚举 formState 的调用方（如按扩展字段打包发给 AI 的逻辑）
      // 会因为循环引用炸掉，这里只在显式读取时才合成
      return k === SELF_REF_KEY ? proxy : undefined;
    },
    set(t, k, value) {
      (t as any)[k] = value;
      return true;
    },
    // `mForm` 在这里为真，但不进 ownKeys、getOwnPropertyDescriptor 也返回 undefined
    // （见 SELF_REF_KEY 注释）。因此展开 / Object.entries 不会循环引用，
    // 但对 proxy 直接做递归遍历（`for...in`、深拷贝、直接 JSON.stringify(formState)）仍会。
    has: (t, k) => Reflect.has(t, k) || (typeof k !== 'symbol' && (k in resolve() || k === SELF_REF_KEY)),
    ownKeys: (t) => [
      ...new Set([...Reflect.ownKeys(t), ...Reflect.ownKeys(resolve()).filter((k) => typeof k !== 'symbol')]),
    ],
    getOwnPropertyDescriptor: (t, k) => {
      const own = Reflect.getOwnPropertyDescriptor(t, k);
      if (own) return own;
      if (typeof k === 'symbol') return undefined;

      const ctx = resolve();
      if (!(k in ctx)) return undefined;
      // core 上不存在该键，必须报告为 configurable，否则违反 Proxy 不变式
      return { configurable: true, enumerable: true, writable: true, value: ctx[k] };
    },
  }) as FormState;

  return proxy;
};
