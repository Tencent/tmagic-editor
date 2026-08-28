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

/**
 * @fileoverview `@tmagic/editor/headless`：编辑器字段的无渲染登记表。
 *
 * 不加载编辑器界面（Editor.vue、各面板、monaco 等），可在无 DOM 的 Node 里 import。
 * 配合 `@tmagic/form/headless`：`registerBuiltInFields(builtInFields); registerFields(editorFields);`
 *
 * 注意这里不是「零 Vue 依赖」：`style-setter` 的字段配置与编辑器 UI 共用同一份工厂
 * （`fields/StyleSetter/configs.ts`），配置里的 `icon` / `component` 会带进来若干图标
 * SFC；typeMatch 的提示文案要读画布与数据源，也会带进 editor services。这些都只在
 * import 时定义、不访问 DOM，但产物体积明显大于 `@tmagic/form/headless`。
 *
 * @module @tmagic/editor/headless
 */

export { editorFields } from './fields/headless-validation';
