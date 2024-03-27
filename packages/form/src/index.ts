/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2023 THL A29 Limited, a Tencent company.  All rights reserved.
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

import { App } from 'vue';

import Container from './containers/Container.vue';
import Fieldset from './containers/Fieldset.vue';
import GroupList from './containers/GroupList.vue';
import Panel from './containers/Panel.vue';
import Row from './containers/Row.vue';
import MStep from './containers/Step.vue';
import Table from './containers/Table.vue';
import Tabs from './containers/Tabs.vue';
import Cascader from './fields/Cascader.vue';
import Checkbox from './fields/Checkbox.vue';
import CheckboxGroup from './fields/CheckboxGroup.vue';
import ColorPicker from './fields/ColorPicker.vue';
import Date from './fields/Date.vue';
import Daterange from './fields/Daterange.vue';
import DateTime from './fields/DateTime.vue';
import Display from './fields/Display.vue';
import DynamicField from './fields/DynamicField.vue';
import Hidden from './fields/Hidden.vue';
import Link from './fields/Link.vue';
import Number from './fields/Number.vue';
import NumberRange from './fields/NumberRange.vue';
import RadioGroup from './fields/RadioGroup.vue';
import Select from './fields/Select.vue';
import Switch from './fields/Switch.vue';
import Text from './fields/Text.vue';
import Textarea from './fields/Textarea.vue';
import Time from './fields/Time.vue';
import Timerange from './fields/Timerange.vue';
import { setConfig } from './utils/config';
import Form from './Form.vue';
import FormDialog from './FormDialog.vue';
import type { FormConfig } from './schema';

import './theme/index.scss';

export * from './schema';
export * from './utils/form';
export * from './utils/useAddField';

export { default as MForm } from './Form.vue';
export { default as MFormDialog } from './FormDialog.vue';
export { default as MFormDrawer } from './FormDrawer.vue';
export { default as MFormBox } from './FormBox.vue';
export { default as MContainer } from './containers/Container.vue';
export { default as MFieldset } from './containers/Fieldset.vue';
export { default as MPanel } from './containers/Panel.vue';
export { default as MRow } from './containers/Row.vue';
export { default as MTabs } from './containers/Tabs.vue';
export { default as MTable } from './containers/Table.vue';
export { default as MGroupList } from './containers/GroupList.vue';
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

export const createForm = <T extends [] = []>(config: FormConfig | T) => config;

export interface InstallOptions {
  [key: string]: any;
}

const defaultInstallOpt: InstallOptions = {};

export default {
  install(app: App, opt: InstallOptions = {}) {
    const option = Object.assign(defaultInstallOpt, opt);

    // eslint-disable-next-line no-param-reassign
    app.config.globalProperties.$MAGIC_FORM = option;
    setConfig(option);

    app.component('m-form', Form);
    app.component('m-form-dialog', FormDialog);
    app.component('m-form-container', Container);
    app.component('m-form-fieldset', Fieldset);
    app.component('m-form-group-list', GroupList);
    app.component('m-form-panel', Panel);
    app.component('m-form-row', Row);
    app.component('m-form-step', MStep);
    app.component('m-form-table', Table);
    app.component('m-form-tab', Tabs);
    app.component('m-fields-text', Text);
    app.component('m-fields-number', Number);
    app.component('m-fields-number-range', NumberRange);
    app.component('m-fields-textarea', Textarea);
    app.component('m-fields-hidden', Hidden);
    app.component('m-fields-date', Date);
    app.component('m-fields-datetime', DateTime);
    app.component('m-fields-daterange', Daterange);
    app.component('m-fields-timerange', Timerange);
    app.component('m-fields-time', Time);
    app.component('m-fields-checkbox', Checkbox);
    app.component('m-fields-switch', Switch);
    app.component('m-fields-color-picker', ColorPicker);
    app.component('m-fields-checkbox-group', CheckboxGroup);
    app.component('m-fields-radio-group', RadioGroup);
    app.component('m-fields-display', Display);
    app.component('m-fields-link', Link);
    app.component('m-fields-select', Select);
    app.component('m-fields-cascader', Cascader);
    app.component('m-fields-dynamic-field', DynamicField);
  },
};
