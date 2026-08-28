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

import type { DesignPluginOptions } from '@tmagic/design';
import designPlugin from '@tmagic/design';
import type { FieldOptions, FormInstallOptions } from '@tmagic/form';
import formPlugin, { mergeFieldOptions } from '@tmagic/form';
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
import { editorFields } from './fields/headless-validation';
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

  flat: false,
};

const editorFieldVue: Record<string, Pick<FieldOptions, 'component' | 'container'>> = {
  'vs-code': { component: Code },
  'ui-select': { component: uiSelect },
  'cond-op-select': { component: CondOpSelect },
  'page-fragment-select': { component: PageFragmentSelect },
  'data-source-select': { component: DataSourceSelect },
  'data-source-input': { component: DataSourceInput },
  'code-link': { component: CodeLink },
  'key-value': { component: KeyValue },
  'code-select-col': { component: CodeSelectCol },
  'data-source-fields': { component: DataSourceFields },
  'data-source-mocks': { component: DataSourceMocks },
  'data-source-methods': { component: DataSourceMethods },
  'data-source-method-select': { component: DataSourceMethodSelect },
  'data-source-field-select': { component: DataSourceFieldSelect },
  'code-select': { component: CodeSelect },
  'display-conds': { component: DisplayConds },
  'event-select': { component: EventSelect },
  'style-setter': { container: StyleSetter },
};

export default {
  install: (app: App, opt?: Partial<EditorInstallOptions | DesignPluginOptions | FormInstallOptions>): void => {
    const incoming = opt || {};
    const option = { ...defaultInstallOpt, ...incoming };
    const formOpt = incoming as FormInstallOptions;

    app.use(designPlugin, incoming);
    app.use(formPlugin, {
      ...formOpt,
      fields: mergeFieldOptions(editorFields, editorFieldVue, formOpt.fields),
    });
    app.use(tablePlugin);

    app.config.globalProperties.$TMAGIC_EDITOR = option;
    setEditorConfig(option);
    app.component(`${Editor.name || 'MEditor'}`, Editor);
    app.component('magic-code-editor', CodeEditor);
  },
};
