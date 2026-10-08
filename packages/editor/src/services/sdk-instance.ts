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

/**
 * 浏览器端默认的 SDK 实例：`editorService` 等单例都从这里取。
 *
 * 与 Node 下 `createDslSdk` 创建的实例是同一套实现，区别只在注入的适配器：
 * Vue 的响应式、localStorage、IndexedDB、Web Worker、剪贴板与 `tMagicMessage`。
 */

import { createDslSdk } from '@editor/sdk';
import { getEditorConfig } from '@editor/utils/config';
import { CollectWorkerClient } from '@editor/utils/dep/collect-worker-client';
import { idbGet, idbSet } from '@editor/utils/indexed-db';
import { copyTextToClipboard, notifyByDesign } from '@editor/utils/props';

const sdk = createDslSdk({
  storage: typeof globalThis.localStorage === 'undefined' ? undefined : globalThis.localStorage,
  // 编辑器通过 `setEditorConfig` 注入，需在调用时读取
  parseDSL: (code: string) => getEditorConfig('parseDSL')(code),
  historyPersistence: { get: idbGet as any, set: idbSet },
  collectWorker: new CollectWorkerClient(),
  copyText: copyTextToClipboard,
  notify: notifyByDesign,
  // 浏览器端的校验由属性面板负责；依赖收集由 initService 挂载时连线
  validateMode: 'off',
  autoWiring: false,
});

export const editorService = sdk.editor;
export const historyService = sdk.history;
export const propsService = sdk.props;
export const dataSourceService = sdk.dataSource;
export const codeBlockService = sdk.codeBlock;
export const depService = sdk.dep;
export const eventsService = sdk.events;
export const storageService = sdk.storage;
export const componentListService = sdk.componentList;

export { Protocol, WebStorage } from '@editor/sdk/services/WebStorage';
export type { CodeBlockService } from '@editor/sdk/services/CodeBlock';
export type { ComponentListService } from '@editor/sdk/services/ComponentList';
export type { DataSourceService } from '@editor/sdk/services/DataSource';
export type { DepEvents, DepService } from '@editor/sdk/services/Dep';
export type { EditorService } from '@editor/sdk/services/Editor';
export type { EventsService } from '@editor/sdk/services/Events';
export type { HistoryService } from '@editor/sdk/services/History';
export type { PropsService } from '@editor/sdk/services/Props';
export type { StorageService } from '@editor/sdk/services/WebStorage';

export default sdk;
