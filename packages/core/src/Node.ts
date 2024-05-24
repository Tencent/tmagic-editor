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

import { EventEmitter } from 'events';

import { DataSource } from '@tmagic/data-source';
import type { AppCore, EventConfig, MComponent, MContainer, MNode, MPage, MPageFragment } from '@tmagic/schema';
import { HookCodeType, HookType } from '@tmagic/schema';

import type App from './App';
import type Page from './Page';
import Store from './Store';

interface NodeOptions {
  config: MNode;
  page?: Page;
  parent?: Node;
  app: App;
}
class Node extends EventEmitter {
  public data!: MNode;
  public style!: {
    [key: string]: any;
  };
  public events: EventConfig[] = [];
  public instance?: any;
  public page?: Page;
  public parent?: Node;
  public app: App;
  public store = new Store();

  constructor(options: NodeOptions) {
    super();

    this.page = options.page;
    this.parent = options.parent;
    this.app = options.app;
    this.setData(options.config);
    this.listenLifeSafe();
  }

  public setData(data: MComponent | MContainer | MPage | MPageFragment) {
    this.data = data;
    const { events, style } = data;
    this.events = events || [];
    this.style = style || {};
    this.emit('update-data');
  }

  public destroy() {
    this.removeAllListeners();
  }

  private listenLifeSafe() {
    this.once('created', async (instance: any) => {
      this.once('destroy', () => {
        this.instance = null;
        if (typeof this.data.destroy === 'function') {
          this.data.destroy(this);
        }

        this.listenLifeSafe();
      });

      this.instance = instance;
      await this.runHookCode('created');
    });

    this.once('mounted', async (instance: any) => {
      this.instance = instance;

      const eventConfigQueue = this.app.eventQueueMap[instance.config.id] || [];

      for (let eventConfig = eventConfigQueue.shift(); eventConfig; eventConfig = eventConfigQueue.shift()) {
        this.app.compActionHandler(eventConfig.eventConfig, eventConfig.fromCpt, eventConfig.args);
      }

      await this.runHookCode('mounted');
    });
  }

  private async runHookCode(hook: string) {
    if (typeof this.data[hook] === 'function') {
      // 兼容旧的数据格式
      await this.data[hook](this);
      return;
    }

    const hookData = this.data[hook] as {
      /** 钩子类型 */
      hookType: HookType;
      hookData: {
        /** 函数类型 */
        codeType?: HookCodeType;
        /** 函数id, 代码块为string, 数据源为[数据源id, 方法名称] */
        codeId: string | [string, string];
        /** 参数配置 */
        params: Record<string, any>;
      }[];
    };

    if (hookData?.hookType !== HookType.CODE) return;

    for (const item of hookData.hookData) {
      const { codeType = HookCodeType.CODE, codeId, params = {} } = item;

      let functionContent: ((...args: any[]) => any) | string | undefined;
      const functionParams: { app: AppCore; params: Record<string, any>; dataSource?: DataSource } = {
        app: this.app,
        params,
      };

      if (codeType === HookCodeType.CODE && typeof codeId === 'string' && this.app.codeDsl?.[codeId]) {
        functionContent = this.app.codeDsl[codeId].content;
      } else if (codeType === HookCodeType.DATA_SOURCE_METHOD && Array.isArray(codeId) && codeId.length > 1) {
        const dataSource = this.app.dataSourceManager?.get(codeId[0]);
        functionContent = dataSource?.methods.find((method) => method.name === codeId[1])?.content;
        functionParams.dataSource = dataSource;
      }

      if (functionContent && typeof functionContent === 'function') {
        await functionContent(functionParams);
      }
    }
  }
}

export default Node;
