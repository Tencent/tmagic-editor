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

import type { FormConfig } from './schema';

export * from './schema';
export * from './submitForm';
export * from './utils/form';
export * from './utils/useAddField';

export { default as MForm } from './Form.vue';
export { default as MFormDialog } from './FormDialog.vue';
export { default as MFormDrawer } from './FormDrawer.vue';
export { default as MFormBox } from './FormBox.vue';
export { default as MContainer } from './containers/Container.vue';
export { default as MFieldset } from './containers/Fieldset.vue';
export { default as MFlexLayout } from './containers/FlexLayout.vue';
export { default as MPanel } from './containers/Panel.vue';
export { default as MRow } from './containers/Row.vue';
export { default as MTabs } from './containers/Tabs.vue';
export { default as MTable } from './containers/table-group-list/TableGroupList.vue';
export { default as MGroupList } from './containers/table-group-list/TableGroupList.vue';
export { default as MTableGroupList } from './containers/table-group-list/TableGroupList.vue';
export { default as MText } from './fields/Text.vue';
export { default as MNumber } from './fields/Number.vue';
export { default as MNumberRange } from './fields/NumberRange/Index.vue';
export { default as MTextarea } from './fields/Textarea.vue';
export { default as MHidden } from './fields/Hidden.vue';
export { default as MDate } from './fields/Date/Index.vue';
export { default as MDateTime } from './fields/DateTime/Index.vue';
export { default as MTime } from './fields/Time.vue';
export { default as MCheckbox } from './fields/Checkbox.vue';
export { default as MSwitch } from './fields/Switch.vue';
export { default as MDaterange } from './fields/Daterange.vue';
export { default as MTimerange } from './fields/Timerange.vue';
export { default as MColorPicker } from './fields/ColorPicker.vue';
export { default as MCheckboxGroup } from './fields/CheckboxGroup/Index.vue';
export { default as MRadioGroup } from './fields/RadioGroup.vue';
export { default as MDisplay } from './fields/Display/Index.vue';
export { default as MLink } from './fields/Link.vue';
export { default as MSelect } from './fields/Select.vue';
export { default as MCascader } from './fields/Cascader.vue';
export { default as MDynamicField } from './fields/DynamicField/Index.vue';

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

export type { FieldInnerConfig, FieldInnerConfigContext, FieldInnerConfigResult } from './utils/fieldInnerConfig';

export { isLeafFieldType } from './utils/fieldValueEffects';
export type { FieldMountValueEffect, FieldMountValueEffectContext } from './utils/fieldValueEffects';

export {
  applyMountValueEffects,
  collectValidatableFields,
  FieldInnerConfigError,
  isFieldInnerConfigError,
} from './utils/collectFields';
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

export type { FormInstallOptions } from './plugin';

export const createForm = <T extends [] = []>(config: FormConfig | T) => config;

export { default } from './plugin';
