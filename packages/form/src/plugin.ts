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
import TableGroupList from './containers/table-group-list/TableGroupList.vue';
import Tabs from './containers/Tabs.vue';
import Cascader from './fields/Cascader.vue';
import Checkbox from './fields/Checkbox.vue';
import CheckboxGroup from './fields/CheckboxGroup/Index.vue';
import ColorPicker from './fields/ColorPicker.vue';
import Date from './fields/Date/Index.vue';
import Daterange from './fields/Daterange.vue';
import DateTime from './fields/DateTime/Index.vue';
import Display from './fields/Display/Index.vue';
import DynamicField from './fields/DynamicField/Index.vue';
import Hidden from './fields/Hidden.vue';
import Link from './fields/Link.vue';
import Number from './fields/Number.vue';
import NumberRange from './fields/NumberRange/Index.vue';
import RadioGroup from './fields/RadioGroup.vue';
import Select from './fields/Select.vue';
import Switch from './fields/Switch.vue';
import Text from './fields/Text.vue';
import Textarea from './fields/Textarea.vue';
import Time from './fields/Time.vue';
import Timerange from './fields/Timerange.vue';
import { builtInFields } from './utils/builtInFields';
import { setConfig } from './utils/config';
import { type FieldOptions, registerBuiltInFields, registerFields } from './utils/registerField';
import Form from './Form.vue';
import FormDialog from './FormDialog.vue';
import FormDrawer from './FormDrawer.vue';

import './theme/index.scss';

// #region FormInstallOptions
/**
 * `@tmagic/form` 插件安装选项。
 */
export interface FormInstallOptions {
  /** 是否启用全局 flat 模式。 */
  flat?: boolean;
  /**
   * 自定义字段 type 的登记（叶子 / innerConfig / walk / typeMatch / component / container）。
   * 与 `registerFields` 相同。
   */
  fields?: Record<string, FieldOptions>;
  [key: string]: any;
}
// #endregion FormInstallOptions

const builtInFieldVue: Record<string, Pick<FieldOptions, 'component' | 'container'>> = {
  text: { component: Text },
  'img-upload': { component: Text },
  number: { component: Number },
  'number-range': { component: NumberRange },
  textarea: { component: Textarea },
  hidden: { component: Hidden },
  date: { component: Date },
  datetime: { component: DateTime },
  daterange: { component: Daterange },
  timerange: { component: Timerange },
  time: { component: Time },
  checkbox: { component: Checkbox },
  switch: { component: Switch },
  'color-picker': { component: ColorPicker },
  'checkbox-group': { component: CheckboxGroup },
  'radio-group': { component: RadioGroup },
  display: { component: Display },
  link: { component: Link },
  select: { component: Select },
  cascader: { component: Cascader },
  'dynamic-field': { component: DynamicField },
  container: { container: Container },
  tab: { container: Tabs },
  row: { container: Row },
  'flex-layout': { container: FlexLayout },
  fieldset: { container: Fieldset },
  panel: { container: Panel },
  step: { container: MStep },
  table: { container: TableGroupList },
  'group-list': { container: TableGroupList },
  'table-group-list': { container: TableGroupList },
};

const defaultInstallOpt: FormInstallOptions = {};

export default {
  /**
   * 安装 `@tmagic/form`：登记内置字段、挂载 `m-form` / `m-form-dialog` / `m-form-drawer`。
   *
   * @param app - Vue 应用
   * @param [opt] - 安装选项
   */
  install(app: App, opt: FormInstallOptions = {}) {
    const option = { ...defaultInstallOpt, ...opt };

    app.config.globalProperties.$MAGIC_FORM = option;
    setConfig(option);

    registerBuiltInFields(builtInFields);
    registerBuiltInFields(builtInFieldVue, app);

    if (option.fields) {
      registerFields(option.fields, app);
    }

    app.component('m-form', Form);
    app.component('m-form-dialog', FormDialog);
    app.component('m-form-drawer', FormDrawer);
  },
};
