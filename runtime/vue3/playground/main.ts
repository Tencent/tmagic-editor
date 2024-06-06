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

import { createApp } from 'vue';

import Core from '@tmagic/core';
import { DataSourceManager, DeepObservedData } from '@tmagic/data-source';

import App from './App.vue';

import '@tmagic/utils/resetcss.css';

DataSourceManager.registerObservedData(DeepObservedData);

Promise.all([
  import('../.tmagic/comp-entry'),
  import('../.tmagic/plugin-entry'),
  import('../.tmagic/datasource-entry'),
]).then(([components, plugins, dataSources]) => {
  const vueApp = createApp(App);

  const app = new Core({
    ua: window.navigator.userAgent,
    platform: 'editor',
  });

  if (app.env.isWeb) {
    app.setDesignWidth(window.document.documentElement.getBoundingClientRect().width);
  }

  Object.entries(components.default).forEach(([type, component]: [string, any]) => {
    vueApp.component(`magic-ui-${type}`, component);
  });

  Object.entries(dataSources.default).forEach(([type, ds]: [string, any]) => {
    DataSourceManager.register(type, ds);
  });

  Object.values(plugins.default).forEach((plugin: any) => {
    vueApp.use(plugin, { app });
  });

  window.appInstance = app;
  vueApp.config.globalProperties.app = app;
  vueApp.provide('app', app);

  vueApp.mount('#app');
});
