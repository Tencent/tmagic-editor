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

import { reactive } from 'vue';
import { cloneDeep } from 'lodash-es';

import { DEFAULT_EVENTS, DEFAULT_METHODS, EventOption } from '@tmagic/core';
import { toLine } from '@tmagic/utils';

import type { ComponentGroup } from '@editor/type';

import BaseService from './BaseService';

let eventMap: Record<string, EventOption[]> = reactive({});
let methodMap: Record<string, EventOption[]> = reactive({});

class Events extends BaseService {
  constructor() {
    super([]);
  }

  public init(componentGroupList: ComponentGroup[]) {
    componentGroupList.forEach((group) => {
      group.items.forEach((element) => {
        const type = toLine(element.type);
        if (!this.getEvent(type)) {
          this.setEvent(type, DEFAULT_EVENTS);
        }
        if (!this.getMethod(type)) {
          this.setMethod(type, DEFAULT_METHODS);
        }
      });
    });
  }

  public setEvents(events: Record<string, EventOption[]>) {
    Object.keys(events).forEach((type: string) => {
      this.setEvent(toLine(type), events[type] || []);
    });
  }

  public setEvent(type: string, events: EventOption[]) {
    eventMap[toLine(type)] = [...DEFAULT_EVENTS, ...events];
  }

  public getEvent(type: string): EventOption[] {
    return cloneDeep(eventMap[toLine(type)] || DEFAULT_EVENTS);
  }

  public setMethods(methods: Record<string, EventOption[]>) {
    Object.keys(methods).forEach((type: string) => {
      this.setMethod(toLine(type), methods[type] || []);
    });
  }

  public setMethod(type: string, method: EventOption[]) {
    methodMap[toLine(type)] = [...DEFAULT_METHODS, ...method];
  }

  public getMethod(type: string) {
    return cloneDeep(methodMap[toLine(type)] || DEFAULT_METHODS);
  }

  public resetState() {
    eventMap = reactive({});
    methodMap = reactive({});
  }

  public destroy() {
    this.resetState();
    this.removeAllListeners();
    this.removeAllPlugins();
  }
}

export type EventsService = Events;

export default new Events();
