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
  const resolve = (): Record<string | symbol, any> =>
    (typeof getContext === 'function' ? getContext() : unref(getContext)) || EMPTY_CONTEXT;

  return new Proxy(coreState as object, {
    get(t, k) {
      if (typeof k === 'symbol') return Reflect.get(t, k);
      const v = (t as any)[k];
      if (v !== undefined || Reflect.has(t, k)) return v;
      return resolve()[k];
    },
    set(t, k, value) {
      (t as any)[k] = value;
      return true;
    },
    has: (t, k) => Reflect.has(t, k) || (typeof k !== 'symbol' && k in resolve()),
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
};
