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

import { ref } from 'vue';

import { EditorInstallOptions } from '@editor/type';

let $TMAGIC_EDITOR: EditorInstallOptions = {} as any;

// 用 ref 持有 flat 全局开关：const 引用本身不可变，符合 `import/no-mutable-exports`；
// 通过 `.value` 改值仍保持模块级响应式语义，与 editor/plugin.ts、design/index.ts 里
// 的同名变量写法对齐。
const isGlobalFlat = ref(false);

const setEditorConfig = (option: EditorInstallOptions): void => {
  $TMAGIC_EDITOR = option;
  isGlobalFlat.value = option.flat ?? false;
};

const getEditorConfig = <K extends keyof EditorInstallOptions>(key: K): EditorInstallOptions[K] => $TMAGIC_EDITOR[key];

export { getEditorConfig, isGlobalFlat, setEditorConfig };
