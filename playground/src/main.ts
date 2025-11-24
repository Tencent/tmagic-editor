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

import { createApp } from 'vue';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

import editorPlugin from '@tmagic/editor';

import App from './App.vue';
import router from './route';

import 'element-plus/dist/index.css';
import '@tmagic/editor/dist/style.css';

// @ts-ignore
globalThis.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === 'json') {
      return new JsonWorker();
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new CssWorker();
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new HtmlWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new TsWorker();
    }
    return new EditorWorker();
  },
};

const adapter = sessionStorage.getItem('tmagic-playground-ui-adapter') || 'element-plus';

let adapterModule;

if (adapter === 'tdesign-vue-next') {
  import('tdesign-vue-next/es/style/index.css');
  adapterModule = import('@tmagic/tdesign-vue-next-adapter');
} else {
  import('element-plus/dist/index.css');
  adapterModule = import('@tmagic/element-plus-adapter');
}

adapterModule.then((module: any) => {
  const app = createApp(App);
  app.use(router);
  app.use(editorPlugin, module.default);
  app.mount('#app');
});
