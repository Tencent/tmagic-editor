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

import { createApp, defineAsyncComponent, reactive } from 'vue';

import Core from '@tmagic/core';
import { getUrlParam } from '@tmagic/utils';

import components from '../.tmagic/async-comp-entry';
import plugins from '../.tmagic/plugin-entry';

import request from './utils/request';
import AppComponent from './App.vue';
import { getLocalConfig } from './utils';

const magicApp = createApp(AppComponent);

magicApp.use(request);

Object.entries(components).forEach(([type, component]: [string, any]) => {
  magicApp.component(`magic-ui-${type}`, defineAsyncComponent(component));
});

Object.values(plugins).forEach((plugin: any) => {
  magicApp.use(plugin);
});

const designWidth = document.documentElement.getBoundingClientRect().width;

const config = ((getUrlParam('localPreview') ? getLocalConfig() : window.magicDSL) || [])[0] || {};
const curPageId = getUrlParam('page');
const app = new Core({
  designWidth,
  config,
  curPage: curPageId,
});

app?.setConfig(config, curPageId);
app?.setDataSet(
  config,
  // 直接写死一个数据源用于测试
  {
    id: 1,
    url: 'https://wangminghua.usemock.com/api/data1',
    name: '数据源1',
    keys: ['num1', 'num2', 'num3', 'num4', 'num5', 'num6', 'num7', 'num8', 'num9', 'num10', 'num11'],
    alias: [
      {
        key: 'num1',
        name: '默认值',
      },
    ],
    rtype: 'list',
    interval: 5,
  },
  {
    adapter: reactive,
  },
);

magicApp.config.globalProperties.app = app;
magicApp.provide('app', app);

magicApp.mount('#app');
