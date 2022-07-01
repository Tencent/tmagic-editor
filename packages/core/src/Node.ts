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

class Node extends EventEmitter {
  data: MComponent | MContainer | MPage;
  style?: {
    [key: string]: any;
  };
  events?: EventItemConfig[];
  instance?: any;

  constructor(config: MComponent | MContainer) {
    super();

    const { events } = config;
    this.data = config;
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

  listenLifeSafe() {
    this.once('created', (instance: any) => {
      this.instance = instance;
      if (typeof this.data.created === 'function') {
        this.data.created(this);
      }
    });

    this.once('mounted', (instance: any) => {
      this.instance = instance;
      if (typeof this.data.mounted === 'function') {
        this.data.mounted(this);
      }
    });
  }
}

export default Node;
