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

import Vue from 'vue';

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
  const app = new Core({
    ua: window.navigator.userAgent,
    platform: 'editor',
  });

  if (app.env.isWeb) {
    app.setDesignWidth(window.document.documentElement.getBoundingClientRect().width);
  }

  Object.entries(components.default).forEach(([type, component]: [string, any]) => {
    Vue.component(`magic-ui-${type}`, component);
  });

  Object.entries(dataSources).forEach(([type, ds]: [string, any]) => {
    DataSourceManager.register(type, ds);
  });

  Object.values(plugins.default).forEach((plugin: any) => {
    Vue.use(plugin, { app });
  });

  window.appInstance = app;

  Vue.prototype.app = app;

  new Vue({
    // @ts-ignore
    render: (h) => h(App),
    provide: {
      app,
    },
    el: '#app',
  });
});
