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

import { EventEmitter } from 'events';

import type { EventItemConfig, MComponent, MContainer, MPage } from '@tmagic/schema';

import type App from './App';
import type Page from './Page';
import Store from './Store';

interface NodeOptions {
  config: MComponent | MContainer;
  page?: Page;
  parent?: Node;
  app: App;
}
class Node extends EventEmitter {
  public data: MComponent | MContainer | MPage;
  public style?: {
    [key: string]: any;
  };
  public events?: EventItemConfig[];
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
    const { events } = options.config;
    this.data = options.config;
    this.events = events;

    this.listenLifeSafe();

    this.once('destroy', () => {
      this.instance = null;
      if (typeof this.data.destroy === 'function') {
        this.data.destroy(this);
      }

      this.listenLifeSafe();
    });
  }

  private listenLifeSafe() {
    this.once('created', (instance: any) => {
      this.instance = instance;

      if (typeof this.data.created === 'function') {
        this.data.created(this);
      }
    });

    this.once('mounted', (instance: any) => {
      this.instance = instance;

      const eventConfigQueue = this.app.eventQueueMap[instance.config.id] || [];

      for (let eventConfig = eventConfigQueue.shift(); eventConfig; eventConfig = eventConfigQueue.shift()) {
        this.app.eventHandler(eventConfig.eventConfig, eventConfig.fromCpt, eventConfig.args);
      }

      if (typeof this.data.mounted === 'function') {
        this.data.mounted(this);
      }
    });
  }
}

export default Node;
