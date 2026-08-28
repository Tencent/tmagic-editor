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
 * @fileoverview `@tmagic/design/headless`：不含组件与样式的那部分 design 能力。
 *
 * 供 `@tmagic/form/headless` 这类无渲染链路引用，避免为了读一个全局配置
 * 把整个组件库拉进包里。ES 产物保留模块结构，这里与 `@tmagic/design`
 * 引用的是同一个 `config` 模块，`setDesignConfig` 的写入两侧都能读到。
 *
 * @module @tmagic/design/headless
 */

export { getDesignConfig, setDesignConfig } from './config';
export {
  appendValidateSuggestion,
  stripValidateSuggestion,
  VALIDATE_SUGGESTION_SEPARATOR,
} from './formValidateMessage';
export type { DesignPluginOptions } from './types';
