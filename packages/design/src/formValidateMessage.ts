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
 * 校验错误文案中，「主错误描述」与「修改建议」之间的分隔符。
 *
 * 约定：typeMatch 等校验器产出的文案形如
 * `主错误描述${VALIDATE_SUGGESTION_SEPARATOR}修改建议`。
 * - 行内 form-item 错误、组件树 tooltip 仅展示「主错误描述」；
 * - 错误汇总（如属性面板报错弹窗）展示完整文案（含修改建议）。
 *
 * 该常量为「主错误描述 / 修改建议」这一隐式协议的唯一真源，
 * 所有生产/消费该文案的位置都应复用这里的常量与 helper，避免魔法字符串散落。
 */
export const VALIDATE_SUGGESTION_SEPARATOR = '\n\n';

/**
 * 在「主错误描述」后追加「修改建议」；无建议时原样返回主错误描述。
 *
 * @param message 主错误描述
 * @param suggestion 可选的修改建议（示例值等）
 */
export const appendValidateSuggestion = (message: string, suggestion?: string): string =>
  suggestion ? `${message}${VALIDATE_SUGGESTION_SEPARATOR}${suggestion}` : message;

/**
 * 去掉校验文案中的「修改建议」部分，仅保留「主错误描述」。
 *
 * @param text 完整校验文案（可能形如 `主错误描述\n\n修改建议`）
 */
export const stripValidateSuggestion = (text?: string): string =>
  String(text ?? '').split(VALIDATE_SUGGESTION_SEPARATOR)[0];
