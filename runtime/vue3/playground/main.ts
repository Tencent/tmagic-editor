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
import { DataSourceManager } from '@tmagic/data-source';

import App from './App.vue';

import '@tmagic/utils/resetcss.css';

Promise.all([
  import('../.tmagic/comp-entry'),
  import('../.tmagic/plugin-entry'),
  import('../.tmagic/datasource-entry'),
]).then(([components, plugins, datasources]) => {
  const magicApp = createApp(App);

  Object.entries(components.default).forEach(([type, component]: [string, any]) => {
    magicApp.component(`magic-ui-${type}`, component);
  });

  Object.entries(datasources).forEach(([type, ds]: [string, any]) => {
    DataSourceManager.registe(type, ds);
  });

  Object.values(plugins.default).forEach((plugin: any) => {
    magicApp.use(plugin);
  });

  const app = new Core({
    ua: window.navigator.userAgent,
    platform: 'editor',
  });

  if (app.env.isWeb) {
    app.setDesignWidth(window.document.documentElement.getBoundingClientRect().width);
  }

  window.appInstance = app;
  magicApp.config.globalProperties.app = app;
  magicApp.provide('app', app);

  magicApp.mount('#app');
});
