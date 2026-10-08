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

import { cloneDeep } from 'lodash-es';
import type { Writable } from 'type-fest';

import type { EventOption, Id, MNode } from '@tmagic/core';
import { toLine } from '@tmagic/utils';

import type { AsyncHookPlugin, SyncHookPlugin } from '@editor/type';

import type { SdkContext } from '../type';

import BaseService from './BaseService';

const canUsePluginMethods = {
  async: [] as const,
  sync: ['setEvent', 'getEvent', 'setMethod', 'getMethod'] as const,
};

type AsyncMethodName = Writable<(typeof canUsePluginMethods)['async']>;
type SyncMethodName = Writable<(typeof canUsePluginMethods)['sync']>;

class Events extends BaseService {
  private eventMap: Record<string, EventOption[]>;
  private methodMap: Record<string, EventOption[]>;

  constructor(ctx: SdkContext) {
    super([
      ...canUsePluginMethods.async.map((methodName) => ({ name: methodName, isAsync: true })),
      ...canUsePluginMethods.sync.map((methodName) => ({ name: methodName, isAsync: false })),
    ]);
    this.eventMap = ctx.reactivity.reactive({});
    this.methodMap = ctx.reactivity.reactive({});
  }

  public setEvents(events: Record<string, EventOption[]>) {
    Object.keys(events).forEach((type: string) => {
      this.setEvent(toLine(type), events[type] || []);
    });
  }

  public setEvent(type: string, events: EventOption[]) {
    this.eventMap[toLine(type)] = [...events];
  }

  public getEvent(type: string, _data: { node?: MNode | null } = {}): EventOption[] {
    return cloneDeep(this.eventMap[toLine(type)]) || [];
  }

  public setMethods(methods: Record<string, EventOption[]>) {
    Object.keys(methods).forEach((type: string) => {
      this.setMethod(toLine(type), methods[type] || []);
    });
  }

  public setMethod(type: string, method: EventOption[]) {
    this.methodMap[toLine(type)] = [...method];
  }

  public getMethod(type: string, _data: { node?: MNode | null; targetId?: Id } = {}) {
    return cloneDeep(this.methodMap[toLine(type)]) || [];
  }

  public resetState() {
    // 原地清空而不是重新赋值，保留 reactive 代理身份，已建立的 computed / 渲染副作用才能收到更新
    Object.keys(this.eventMap).forEach((type) => delete this.eventMap[type]);
    Object.keys(this.methodMap).forEach((type) => delete this.methodMap[type]);
  }

  public destroy() {
    this.resetState();
    this.removeAllListeners();
    this.removeAllPlugins();
  }

  public usePlugin(options: AsyncHookPlugin<AsyncMethodName, Events> & SyncHookPlugin<SyncMethodName, Events>): void {
    super.usePlugin(options);
  }
}

export type EventsService = Events;

export default Events;
