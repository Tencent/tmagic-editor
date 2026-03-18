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

import type { App } from 'vue';

import type { DesignPluginOptions } from '@tmagic/design';
import designPlugin from '@tmagic/design';
import type { FormInstallOptions } from '@tmagic/form';
import formPlugin from '@tmagic/form';
import tablePlugin from '@tmagic/table';

import Code from './fields/Code.vue';
import CodeLink from './fields/CodeLink.vue';
import CodeSelect from './fields/CodeSelect.vue';
import CodeSelectCol from './fields/CodeSelectCol.vue';
import CondOpSelect from './fields/CondOpSelect.vue';
import DataSourceFields from './fields/DataSourceFields.vue';
import DataSourceFieldSelect from './fields/DataSourceFieldSelect/Index.vue';
import DataSourceInput from './fields/DataSourceInput.vue';
import DataSourceMethods from './fields/DataSourceMethods.vue';
import DataSourceMethodSelect from './fields/DataSourceMethodSelect.vue';
import DataSourceMocks from './fields/DataSourceMocks.vue';
import DataSourceSelect from './fields/DataSourceSelect.vue';
import DisplayConds from './fields/DisplayConds.vue';
import EventSelect from './fields/EventSelect.vue';
import KeyValue from './fields/KeyValue.vue';
import PageFragmentSelect from './fields/PageFragmentSelect.vue';
import StyleSetter from './fields/StyleSetter/Index.vue';
import uiSelect from './fields/UISelect.vue';
import CodeEditor from './layouts/CodeEditor.vue';
import { setEditorConfig } from './utils/config';
import Editor from './Editor.vue';
import type { EditorInstallOptions } from './type';

import './theme/index.scss';

const defaultInstallOpt: EditorInstallOptions = {
  // eslint-disable-next-line no-eval
  parseDSL: (dsl: string) => eval(dsl),
  customCreateMonacoEditor: (monaco, codeEditorEl, options) => monaco.editor.create(codeEditorEl, options),
  customCreateMonacoDiffEditor: (monaco, codeEditorEl, options) =>
    monaco.editor.createDiffEditor(codeEditorEl, options),
};

export default {
  install: (app: App, opt?: Partial<EditorInstallOptions | DesignPluginOptions | FormInstallOptions>): void => {
    const option = Object.assign(defaultInstallOpt, opt || {});

    app.use(designPlugin, opt || {});
    app.use(formPlugin, opt || {});
    app.use(tablePlugin);

    app.config.globalProperties.$TMAGIC_EDITOR = option;
    setEditorConfig(option);

    app.component(`${Editor.name || 'MEditor'}`, Editor);
    app.component('magic-code-editor', CodeEditor);
    app.component('m-fields-ui-select', uiSelect);
    app.component('m-fields-code-link', CodeLink);
    app.component('m-fields-vs-code', Code);
    app.component('m-fields-code-select', CodeSelect);
    app.component('m-fields-code-select-col', CodeSelectCol);
    app.component('m-fields-event-select', EventSelect);
    app.component('m-fields-data-source-fields', DataSourceFields);
    app.component('m-fields-data-source-mocks', DataSourceMocks);
    app.component('m-fields-key-value', KeyValue);
    app.component('m-fields-data-source-input', DataSourceInput);
    app.component('m-fields-data-source-select', DataSourceSelect);
    app.component('m-fields-data-source-methods', DataSourceMethods);
    app.component('m-fields-data-source-method-select', DataSourceMethodSelect);
    app.component('m-fields-data-source-field-select', DataSourceFieldSelect);
    app.component('m-fields-page-fragment-select', PageFragmentSelect);
    app.component('m-fields-display-conds', DisplayConds);
    app.component('m-fields-cond-op-select', CondOpSelect);
    app.component('m-form-style-setter', StyleSetter);
  },
};
