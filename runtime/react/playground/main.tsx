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

import React from 'react';
import ReactDOM from 'react-dom';

import Core from '@tmagic/core';
import type { MApp } from '@tmagic/schema';
import type { RemoveData, SortEventData, UpdateData } from '@tmagic/stage';
import { AppContent } from '@tmagic/ui-react';

import components from '../.tmagic/comp-entry';
import plugins from '../.tmagic/plugin-entry';

import App from './App';

const app = new Core({
  config: {},
  platform: 'editor',
});

let curPageId = '';

const updateConfig = (root: MApp) => {
  app?.setConfig(root);
  renderDom();
};

const renderDom = () => {
  ReactDOM.render(
    <React.StrictMode>
      <AppContent.Provider value={app}>
        <App />
      </AppContent.Provider>
    </React.StrictMode>,
    document.getElementById('root'),
  );

  setTimeout(() => {
    // @ts-ignore
    window.magic.onPageElUpdate(document.querySelector('.magic-ui-page'));
  });
};

const operations = {
  getApp() {
    return app;
  },

  updateRootConfig(root: MApp) {
    console.log('update root config', root);
    app?.setConfig(root);
  },

  updatePageId(id: string) {
    console.log('update page id', id);
    curPageId = id;
    app?.setPage(curPageId);
    renderDom();
  },

  getSnapElementQuerySelector() {
    return '[class*=magic-ui][id]';
  },

  select(id: string) {
    console.log('select config', id);
    const el = document.getElementById(id);
    if (el) return el;
    // 未在当前文档下找到目标元素，可能是还未渲染，等待渲染完成后再尝试获取
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(document.getElementById(id));
      }, 0);
    });
  },

  add({ root }: UpdateData) {
    console.log('add config', root);
    updateConfig(root);
  },

  update({ root }: UpdateData) {
    console.log('update config', root);
    updateConfig(root);
  },

  sortNode({ root }: SortEventData) {
    console.log('sort config', root);
    updateConfig(root);
  },

  remove({ root }: RemoveData) {
    console.log('remove config', root);
    updateConfig(root);
  },
};

Object.keys(components).forEach((type: string) => app.registerComponent(type, components[type]));

Object.values(plugins).forEach((plugin: any) => {
  plugin.install(app);
});

// @ts-ignore
window.magic?.onRuntimeReady(operations);
