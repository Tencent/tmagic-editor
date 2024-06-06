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

import { createApp, defineAsyncComponent } from 'vue';

import Core from '@tmagic/core';
import { DataSourceManager, DeepObservedData, registerDataSourceOnDemand } from '@tmagic/data-source';
import { getUrlParam } from '@tmagic/utils';

import components from '../.tmagic/async-comp-entry';
import asyncDataSources from '../.tmagic/async-datasource-entry';
import plugins from '../.tmagic/plugin-entry';

import request, { service } from './utils/request';
import AppComponent from './App.vue';
import { getLocalConfig } from './utils';

import '@tmagic/utils/resetcss.css';

DataSourceManager.registerObservedData(DeepObservedData);

const vueApp = createApp(AppComponent);

vueApp.use(request);

const dsl = ((getUrlParam('localPreview') ? getLocalConfig() : window.magicDSL) || [])[0] || {};

const app = new Core({
  ua: window.navigator.userAgent,
  config: dsl,
  request: service,
  curPage: getUrlParam('page'),
  useMock: Boolean(getUrlParam('useMock')),
});

app.setDesignWidth(app.env.isWeb ? window.document.documentElement.getBoundingClientRect().width : 375);

Object.entries(components).forEach(([type, component]: [string, any]) => {
  vueApp.component(`magic-ui-${type}`, defineAsyncComponent(component));
});

Object.values(plugins).forEach((plugin: any) => {
  vueApp.use(plugin, { app });
});

registerDataSourceOnDemand(dsl, asyncDataSources).then((dataSources) => {
  Object.entries(dataSources).forEach(([type, ds]: [string, any]) => {
    DataSourceManager.register(type, ds);
  });

  vueApp.config.globalProperties.app = app;
  vueApp.provide('app', app);

  vueApp.mount('#app');
});
