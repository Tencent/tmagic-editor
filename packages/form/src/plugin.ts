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

import { type App } from 'vue';

import Container from './containers/Container.vue';
import Fieldset from './containers/Fieldset.vue';
import FlexLayout from './containers/FlexLayout.vue';
import Panel from './containers/Panel.vue';
import Row from './containers/Row.vue';
import MStep from './containers/Step.vue';
import TableGroupList from './containers/TableGroupList.vue';
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

import './theme/index.scss';

export interface FormInstallOptions {
  [key: string]: any;
}

const defaultInstallOpt: FormInstallOptions = {};

export default {
  install(app: App, opt: FormInstallOptions = {}) {
    const option = Object.assign(defaultInstallOpt, opt);

    app.config.globalProperties.$MAGIC_FORM = option;
    setConfig(option);

    app.component('m-form', Form);
    app.component('m-form-dialog', FormDialog);
    app.component('m-form-container', Container);
    app.component('m-form-fieldset', Fieldset);
    app.component('m-form-group-list', TableGroupList);
    app.component('m-form-panel', Panel);
    app.component('m-form-row', Row);
    app.component('m-form-step', MStep);
    app.component('m-form-table', TableGroupList);
    app.component('m-form-tab', Tabs);
    app.component('m-form-flex-layout', FlexLayout);
    app.component('m-fields-text', Text);
    app.component('m-fields-img-upload', Text);
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
