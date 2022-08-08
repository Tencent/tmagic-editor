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
import './utils/polyfills';

import { App } from 'vue';

import Code from './fields/Code.vue';
import CodeLink from './fields/CodeLink.vue';
import uiSelect from './fields/UISelect.vue';
import CodeEditor from './layouts/CodeEditor.vue';
import { setConfig } from './utils/config';
import Editor from './Editor.vue';
import type { InstallOptions } from './type';

import './theme/index.scss';

export type { MoveableOptions } from '@tmagic/stage';
export * from './type';
export * from './utils';
export { default as TMagicEditor } from './Editor.vue';
export { default as TMagicCodeEditor } from './layouts/CodeEditor.vue';
export { default as editorService } from './services/editor';
export { default as propsService } from './services/props';
export { default as historyService } from './services/history';
export { default as storageService } from './services/storage';
export { default as eventsService } from './services/events';
export { default as uiService } from './services/ui';
export { default as ComponentListPanel } from './layouts/sidebar/ComponentListPanel.vue';
export { default as LayerPanel } from './layouts/sidebar/LayerPanel.vue';
export { default as PropsPanel } from './layouts/PropsPanel.vue';
export { default as ToolButton } from './components/ToolButton.vue';

const defaultInstallOpt: InstallOptions = {
  // @todo, 自定义图片上传方法等编辑器依赖的外部选项
};

export default {
  install: (app: App, opt?: InstallOptions): void => {
    const option = Object.assign(defaultInstallOpt, opt || {});

    // eslint-disable-next-line no-param-reassign
    app.config.globalProperties.$TMAGIC_EDITOR = option;
    setConfig(option);

    app.component(Editor.name, Editor);
    app.component('m-fields-ui-select', uiSelect);
    app.component(CodeLink.name, CodeLink);
    app.component(Code.name, Code);
    app.component(CodeEditor.name, CodeEditor);
  },
};
