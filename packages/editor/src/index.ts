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

import Code from './fields/Code.vue';
import CodeLink from './fields/CodeLink.vue';
import CodeSelect from './fields/CodeSelect.vue';
import CodeSelectCol from './fields/CodeSelectCol.vue';
import DataSourceFields from './fields/DataSourceFields.vue';
import DataSourceFieldSelect from './fields/DataSourceFieldSelect.vue';
import DataSourceInput from './fields/DataSourceInput.vue';
import DataSourceMethods from './fields/DataSourceMethods.vue';
import DataSourceMethodSelect from './fields/DataSourceMethodSelect.vue';
import DataSourceMocks from './fields/DataSourceMocks.vue';
import DataSourceSelect from './fields/DataSourceSelect.vue';
import EventSelect from './fields/EventSelect.vue';
import KeyValue from './fields/KeyValue.vue';
import PageFragmentSelect from './fields/PageFragmentSelect.vue';
import uiSelect from './fields/UISelect.vue';
import CodeEditor from './layouts/CodeEditor.vue';
import { setConfig } from './utils/config';
import Editor from './Editor.vue';
import type { InstallOptions } from './type';

import './theme/index.scss';

export type { OnDrag } from 'gesto';

export { DepTargetType } from '@tmagic/dep';
export type { MoveableOptions } from '@tmagic/stage';
export * from './type';
export * from './hooks';
export * from './utils';
export { default as TMagicEditor } from './Editor.vue';
export { default as TMagicCodeEditor } from './layouts/CodeEditor.vue';
export { default as editorService } from './services/editor';
export { default as propsService } from './services/props';
export { default as historyService } from './services/history';
export { default as storageService } from './services/storage';
export { default as eventsService } from './services/events';
export { default as dataSourceService } from './services/dataSource';
export { default as stageOverlayService } from './services/stageOverlay';
export { default as uiService } from './services/ui';
export { default as codeBlockService } from './services/codeBlock';
export { default as depService } from './services/dep';
export { default as ComponentListPanel } from './layouts/sidebar/ComponentListPanel.vue';
export { default as LayerPanel } from './layouts/sidebar/layer/LayerPanel.vue';
export { default as CodeSelect } from './fields/CodeSelect.vue';
export { default as CodeSelectCol } from './fields/CodeSelectCol.vue';
export { default as DataSourceFields } from './fields/DataSourceFields.vue';
export { default as DataSourceMocks } from './fields/DataSourceMocks.vue';
export { default as DataSourceMethods } from './fields/DataSourceMethods.vue';
export { default as DataSourceInput } from './fields/DataSourceInput.vue';
export { default as DataSourceSelect } from './fields/DataSourceSelect.vue';
export { default as DataSourceMethodSelect } from './fields/DataSourceMethodSelect.vue';
export { default as DataSourceFieldSelect } from './fields/DataSourceFieldSelect.vue';
export { default as EventSelect } from './fields/EventSelect.vue';
export { default as KeyValue } from './fields/KeyValue.vue';
export { default as CodeBlockList } from './layouts/sidebar/code-block/CodeBlockList.vue';
export { default as CodeBlockListPanel } from './layouts/sidebar/code-block/CodeBlockListPanel.vue';
export { default as DataSourceConfigPanel } from './layouts/sidebar/data-source/DataSourceConfigPanel.vue';
export { default as PropsPanel } from './layouts/PropsPanel.vue';
export { default as ToolButton } from './components/ToolButton.vue';
export { default as ContentMenu } from './components/ContentMenu.vue';
export { default as Icon } from './components/Icon.vue';
export { default as LayoutContainer } from './components/SplitView.vue';
export { default as SplitView } from './components/SplitView.vue';
export { default as Resizer } from './components/Resizer.vue';
export { default as CodeBlockEditor } from './components/CodeBlockEditor.vue';
export { default as PageFragmentSelect } from './fields/PageFragmentSelect.vue';

const defaultInstallOpt: InstallOptions = {
  // eslint-disable-next-line no-eval
  parseDSL: (dsl: string) => eval(dsl),
};

export default {
  install: (app: App, opt?: Partial<InstallOptions>): void => {
    const option = Object.assign(defaultInstallOpt, opt || {});

    // eslint-disable-next-line no-param-reassign
    app.config.globalProperties.$TMAGIC_EDITOR = option;
    setConfig(option);
    app.component(Editor.name, Editor);
    app.component('m-fields-ui-select', uiSelect);
    app.component('m-fields-code-link', CodeLink);
    app.component('m-fields-vs-code', Code);
    app.component('magic-code-editor', CodeEditor);
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
  },
};
