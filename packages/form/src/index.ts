/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
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
import RadioGroup from './fields/RadioGroup.vue';
import Select from './fields/Select.vue';
import Switch from './fields/Switch.vue';
import Text from './fields/Text.vue';
import Textarea from './fields/Textarea.vue';
import Time from './fields/Time.vue';
import { setConfig } from './utils/config';
import Form from './Form.vue';
import FormDialog from './FormDialog.vue';

import './theme/index.scss';

export * from './schema';
export * from './utils/form';
export * from './utils/useAddField';
export { default as fieldProps } from './utils/fieldProps';

export { default as MForm } from './Form.vue';
export { default as MFormDialog } from './FormDialog.vue';
export { default as MContainer } from './containers/Container.vue';
export { default as MFieldset } from './containers/Fieldset.vue';
export { default as MPanel } from './containers/Panel.vue';
export { default as MRow } from './containers/Row.vue';
export { default as MTabs } from './containers/Tabs.vue';
export { default as MTable } from './containers/Table.vue';
export { default as MGroupList } from './containers/GroupList.vue';
export { default as MText } from './fields/Text.vue';
export { default as MNumber } from './fields/Number.vue';
export { default as MTextarea } from './fields/Textarea.vue';
export { default as MHidden } from './fields/Hidden.vue';
export { default as MDate } from './fields/Date.vue';
export { default as MDateTime } from './fields/DateTime.vue';
export { default as MTime } from './fields/Time.vue';
export { default as MCheckbox } from './fields/Checkbox.vue';
export { default as MSwitch } from './fields/Switch.vue';
export { default as MDaterange } from './fields/Daterange.vue';
export { default as MColorPicker } from './fields/ColorPicker.vue';
export { default as MCheckboxGroup } from './fields/CheckboxGroup.vue';
export { default as MRadioGroup } from './fields/RadioGroup.vue';
export { default as MDisplay } from './fields/Display.vue';
export { default as MLink } from './fields/Link.vue';
export { default as MSelect } from './fields/Select.vue';
export { default as MCascader } from './fields/Cascader.vue';
export { default as MDynamicField } from './fields/DynamicField.vue';

const defaultInstallOpt = {};

const install = (app: App, opt: any) => {
  const option = Object.assign(defaultInstallOpt, opt);

  // eslint-disable-next-line no-param-reassign
  app.config.globalProperties.$MAGIC_FORM = option;
  setConfig(option);

  app.component(Form.name, Form);
  app.component(FormDialog.name, FormDialog);
  app.component(Container.name, Container);
  app.component('m-form-fieldset', Fieldset);
  app.component(GroupList.name, GroupList);
  app.component(Panel.name, Panel);
  app.component(Row.name, Row);
  app.component(MStep.name, MStep);
  app.component(Table.name, Table);
  app.component(Tabs.name, Tabs);
  app.component(Text.name, Text);
  app.component(Number.name, Number);
  app.component(Textarea.name, Textarea);
  app.component('m-fields-hidden', Hidden);
  app.component(Date.name, Date);
  app.component(DateTime.name, DateTime);
  app.component(Time.name, Time);
  app.component(Checkbox.name, Checkbox);
  app.component(Switch.name, Switch);
  app.component('m-fields-daterange', Daterange);
  app.component('m-fields-color-picker', ColorPicker);
  app.component(CheckboxGroup.name, CheckboxGroup);
  app.component(RadioGroup.name, RadioGroup);
  app.component('m-fields-display', Display);
  app.component(Link.name, Link);
  app.component(Select.name, Select);
  app.component(Cascader.name, Cascader);
  app.component(DynamicField.name, DynamicField);
};

export default {
  install,
};
