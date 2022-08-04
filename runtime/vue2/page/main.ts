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

import Vue from 'vue';

import Core from '@tmagic/core';
import { getUrlParam } from '@tmagic/utils';

import components from '../.tmagic/comp-entry';
import plugins from '../.tmagic/plugin-entry';

import request from './utils/request';
import AppComponent from './App.vue';
import { getLocalConfig } from './utils';

Vue.use(request);

const app = new Core({
  config: ((getUrlParam('localPreview') ? getLocalConfig() : window.magicDSL) || [])[0] || {},
  curPage: getUrlParam('page'),
});

Object.keys(components).forEach((type: string) => {
  const component = components[type];
  Vue.component(component.name, component);
  app.registerComponent(type, component);
});

Object.values(plugins).forEach((plugin: any) => {
  Vue.use(plugin);
});

Vue.prototype.app = app;

const magicApp = new Vue({
  provide: {
    app,
  },

  render: (h) => h(AppComponent),
});

magicApp.$mount('#app');
