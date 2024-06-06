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

import React from 'react';
import { createRoot } from 'react-dom/client';
import { cloneDeep } from 'lodash-es';

import Core from '@tmagic/core';
import { DataSourceManager, DeepObservedData } from '@tmagic/data-source';
import type { MApp } from '@tmagic/schema';
import type { RemoveData, SortEventData, UpdateData } from '@tmagic/stage';
import { AppContent } from '@tmagic/ui-react';
import { replaceChildNode } from '@tmagic/utils';

import components from '../.tmagic/comp-entry';
import dataSources from '../.tmagic/datasource-entry';
import plugins from '../.tmagic/plugin-entry';

import App from './App';

import '@tmagic/utils/resetcss.css';

declare global {
  interface Window {
    appInstance: Core;
  }
}

DataSourceManager.registerObservedData(DeepObservedData);

Object.entries(dataSources).forEach(([type, ds]: [string, any]) => {
  DataSourceManager.register(type, ds);
});

const app = new Core({
  ua: window.navigator.userAgent,
  platform: 'editor',
});

if (app.env.isWeb) {
  app.setDesignWidth(window.document.documentElement.getBoundingClientRect().width);
}

window.appInstance = app;

let curPageId = '';

const updateConfig = (root: MApp) => {
  app?.setConfig(root, curPageId);
  renderDom();
};

const renderDom = () => {
  const root = createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <AppContent.Provider value={app}>
        <App />
      </AppContent.Provider>
    </React.StrictMode>,
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
    app?.setConfig(root);
  },

  updatePageId(id: string) {
    curPageId = id;
    app?.setPage(curPageId);
    renderDom();
  },

  getSnapElementQuerySelector() {
    return '[class*=magic-ui][id]';
  },

  select(id: string) {
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
    updateConfig(root);
  },

  update({ config, root, parentId }: UpdateData) {
    const newNode = app.dataSourceManager?.compiledNode(config, undefined, true) || config;
    replaceChildNode(newNode, [root], parentId);
    updateConfig(cloneDeep(root));
  },

  sortNode({ root }: SortEventData) {
    root && updateConfig(root);
  },

  remove({ root }: RemoveData) {
    updateConfig(root);
  },
};

Object.keys(components).forEach((type: string) => app.registerComponent(type, components[type]));

Object.values(plugins).forEach((plugin: any) => {
  plugin.install({ app });
});

// @ts-ignore
window.magic?.onRuntimeReady(operations);
