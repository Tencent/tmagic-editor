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

import type { Component } from 'vue';
import { ref } from 'vue';

let $MAGIC_FORM = {} as any;
// 用 ref 持有 flat 全局开关：const 引用本身不可变，符合 `import/no-mutable-exports`；
// 通过 `.value` 改值仍保持模块级响应式语义，与 editor/plugin.ts、design/index.ts 里
// 的同名变量写法对齐。
const isGlobalFlat = ref(false);

const setConfig = (option: any): void => {
  $MAGIC_FORM = option;
  isGlobalFlat.value = option.flat ?? false;
};

const getConfig = <T = unknown>(key: string): T => $MAGIC_FORM[key];

const fieldRegistry = new Map<string, Component>();

const registerField = (tagName: string, component: Component): void => {
  if (fieldRegistry.has(tagName)) {
    return;
  }
  fieldRegistry.set(tagName, component);
};

const getField = (tagName: string): Component | undefined => fieldRegistry.get(tagName);

const deleteField = (tagName: string): boolean => fieldRegistry.delete(tagName);

export { deleteField, getConfig, getField, isGlobalFlat, registerField, setConfig };
