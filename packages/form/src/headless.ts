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
 * @fileoverview `@tmagic/form/headless`：无渲染校验入口，不加载 Vue 组件与样式。
 *
 * 纯 Node / CI 请从这里引入 `submitForm` / `validateForm` / `registerField`。
 * `dialog: true` 需要 DOM，请改从 `@tmagic/form` 引入。
 *
 * ESM 下本入口与 `@tmagic/form` 共用同一批模块文件，字段注册表是同一份。
 * CJS（`require`）下两者是各自独立的 UMD bundle，注册表不共享，同一进程里不要
 * 同时 `require('@tmagic/form')` 和 `require('@tmagic/form/headless')`。
 *
 * @module @tmagic/form/headless
 */

export * from './schema';
export * from './utils/form';
export { builtInFields } from './utils/builtInFields';

export {
  clearFields,
  getField as getFormField,
  mergeFieldOptions,
  registerBuiltInFields,
  registerField,
  registerFields,
  unregisterField,
} from './utils/registerField';
export type { FieldOptions, HeadlessFieldOptions } from './utils/registerField';

export type { FieldNestedConfig, FieldNestedConfigContext, FieldNestedConfigResult } from './utils/fieldNestedConfig';

export { isLeafFieldType } from './utils/fieldValueEffects';
export type { FieldMountValueEffect, FieldMountValueEffectContext } from './utils/fieldValueEffects';

export { collectValidatableFields, FieldNestedConfigError, isFieldNestedConfigError } from './utils/collectFields';
export type { CollectedField } from './utils/collectFields';

export { createHeadlessFormState, validateValues } from './utils/validateValues';
export type { HeadlessFormStateOptions, ValidateValuesOptions, ValidateValuesResult } from './utils/validateValues';

export { formatValidateError, getTextByName } from './utils/validateError';

export {
  clearTypeMatchRules,
  deleteTypeMatchRule,
  getTypeMatchRule,
  MAX_SUGGESTION_OPTIONS,
  optionSuggestion,
  stringifyExampleValue,
  validateTypeMatch,
} from './utils/typeMatch';

export type { TypeMatchValidateContext, TypeMatchValidator } from './utils/typeMatch';

export { submitForm, validateForm } from './utils/submitHeadless';
export type { SubmitFormOptions, SubmitFormResult, ValidateFormOptions } from './utils/submitHeadless';
