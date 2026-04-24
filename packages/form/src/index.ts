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
export { default as MNumberRange } from './fields/NumberRange.vue';
export { default as MTextarea } from './fields/Textarea.vue';
export { default as MHidden } from './fields/Hidden.vue';
export { default as MDate } from './fields/Date.vue';
export { default as MDateTime } from './fields/DateTime.vue';
export { default as MTime } from './fields/Time.vue';
export { default as MCheckbox } from './fields/Checkbox.vue';
export { default as MSwitch } from './fields/Switch.vue';
export { default as MDaterange } from './fields/Daterange.vue';
export { default as MTimerange } from './fields/Timerange.vue';
export { default as MColorPicker } from './fields/ColorPicker.vue';
export { default as MCheckboxGroup } from './fields/CheckboxGroup.vue';
export { default as MRadioGroup } from './fields/RadioGroup.vue';
export { default as MDisplay } from './fields/Display.vue';
export { default as MLink } from './fields/Link.vue';
export { default as MSelect } from './fields/Select.vue';
export { default as MCascader } from './fields/Cascader.vue';
export { default as MDynamicField } from './fields/DynamicField.vue';

export {
  deleteField as deleteFormField,
  getField as getFormField,
  registerField as registerFormField,
} from './utils/config';

export type { FormInstallOptions } from './plugin';

export const createForm = <T extends [] = []>(config: FormConfig | T) => config;

export { default } from './plugin';
