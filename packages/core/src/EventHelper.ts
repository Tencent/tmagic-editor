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
 * 通用的事件处理
 */
import { EventEmitter } from 'events';

import { has } from 'lodash-es';

import type { DataSource } from '@tmagic/data-source';
import {
  ActionType,
  type CodeItemConfig,
  type CompItemConfig,
  type DataSourceItemConfig,
  type EventActionItem,
  type EventConfig,
  Id,
  NODE_DISABLE_CODE_BLOCK_KEY,
  NODE_DISABLE_DATA_SOURCE_KEY,
} from '@tmagic/schema';
import { DATA_SOURCE_FIELDS_CHANGE_EVENT_PREFIX } from '@tmagic/utils';

import type { default as TMagicApp } from './App';
import FlowState from './FlowState';
import type { default as TMagicNode } from './Node';
import { AfterEventHandler, BeforeEventHandler } from './type';

interface EventCache {
  toId: Id;
  method: string;
  fromCpt: any;
  args: any[];
  handled?: boolean;
}

export default class EventHelper extends EventEmitter {
  public app: TMagicApp;
  public eventQueue: EventCache[] = [];

  private nodeEventList = new Map<(fromCpt: TMagicNode, ...args: any[]) => void, symbol>();
  private dataSourceEventList = new Map<string, Map<string, (...args: any[]) => void>>();
  private beforeEventHandler?: BeforeEventHandler;
  private afterEventHandler?: AfterEventHandler;

  constructor({
    app,
    beforeEventHandler,
    afterEventHandler,
  }: {
    app: TMagicApp;
    beforeEventHandler?: BeforeEventHandler;
    afterEventHandler?: AfterEventHandler;
  }) {
    super();

    this.beforeEventHandler = beforeEventHandler;
    this.afterEventHandler = afterEventHandler;
    this.app = app;
  }

  public destroy() {
    this.removeNodeEvents();
    this.removeAllListeners();
    this.nodeEventList.clear();
    this.dataSourceEventList.clear();
  }

  public bindNodeEvents(node: TMagicNode) {
    node.events?.forEach((event, index) => {
      if (!event.name) {
        return;
      }

      let eventNameKey = `${event.name}_${node.data.id}`;

      // 页面片容器可以配置页面片内组件的事件，形式为“${nodeId}.${eventName}”
      const eventNames = event.name.split('.');
      if (eventNames.length > 1) {
        eventNameKey = `${eventNames[1]}_${eventNames[0]}`;
      }

      let eventName = Symbol(eventNameKey);
      if (node.eventKeys.has(eventNameKey)) {
        eventName = node.eventKeys.get(eventNameKey)!;
      } else {
        node.eventKeys.set(eventNameKey, eventName);
      }

      const eventHandler = (_fromCpt: TMagicNode, ...args: any[]) => {
        this.eventHandler(index, node, args);
      };

      this.nodeEventList.set(eventHandler, eventName);
      this.on(eventName, eventHandler);
    });
  }

  public removeNodeEvents() {
    Array.from(this.nodeEventList.keys()).forEach((handler) => {
      const name = this.nodeEventList.get(handler);
      name && this.off(name, handler);
    });

    this.nodeEventList.clear();
  }

  public bindDataSourceEvents(dataSourceList: DataSource[]) {
    this.removeDataSourceEvents(dataSourceList);

    dataSourceList.forEach((dataSource) => {
      const dataSourceEvent = this.dataSourceEventList.get(dataSource.id) ?? new Map<string, (args: any) => void>();

      (dataSource.schema.events || []).forEach((event) => {
        const [prefix, ...path] = event.name?.split('.') || [];
        if (!prefix) return;
        const handler = (...args: any[]) => {
          this.eventHandler(event, dataSource, args);
        };
        dataSourceEvent.set(event.name, handler);
        if (prefix === DATA_SOURCE_FIELDS_CHANGE_EVENT_PREFIX) {
          // 数据源数据变化
          dataSource?.onDataChange(path.join('.'), handler);
        } else {
          // 数据源自定义事件
          dataSource.on(prefix, handler);
        }
      });
      this.dataSourceEventList.set(dataSource.id, dataSourceEvent);
    });
  }

  public removeDataSourceEvents(dataSourceList: DataSource[]) {
    if (!this.dataSourceEventList.size) {
      return;
    }

    // 先清掉之前注册的事件，重新注册
    dataSourceList.forEach((dataSource) => {
      const dataSourceEvent = this.dataSourceEventList.get(dataSource.id)!;

      if (!dataSourceEvent) return;

      Array.from(dataSourceEvent.keys()).forEach((eventName) => {
        const [prefix, ...path] = eventName.split('.');
        if (prefix === DATA_SOURCE_FIELDS_CHANGE_EVENT_PREFIX) {
          dataSource.offDataChange(path.join('.'), dataSourceEvent.get(eventName)!);
        } else {
          dataSource.off(prefix, dataSourceEvent.get(eventName)!);
        }
      });
    });

    this.dataSourceEventList.clear();
  }

  public getEventQueue() {
    return this.eventQueue;
  }

  public addEventToQueue(event: EventCache) {
    this.eventQueue.push(event);
  }

  /**
   * 事件联动处理函数
   * @param eventsConfigIndex 事件配置索引，可以通过此索引从node.event中获取最新事件配置
   * @param fromCpt 触发事件的组件
   * @param args 事件参数
   */
  private async eventHandler(config: EventConfig | number, fromCpt: TMagicNode | DataSource | undefined, args: any[]) {
    const eventConfig = typeof config === 'number' ? (fromCpt as TMagicNode).events[config] : config;

    if (typeof this.beforeEventHandler === 'function') {
      this.beforeEventHandler({ eventConfig, source: fromCpt, args });
    }

    if (has(eventConfig, 'actions')) {
      // EventConfig类型
      const flowState = new FlowState();
      const { actions } = eventConfig as EventConfig;
      for (let i = 0; i < actions.length; i++) {
        if (flowState?.isAbort) break;
        if (typeof config === 'number') {
          // 事件响应中可能会有修改数据源数据的，会更新dsl，所以这里需要重新获取
          const actionItem = ((fromCpt as TMagicNode).events[config] as EventConfig).actions[i];
          await this.actionHandler(actionItem, fromCpt as TMagicNode, args, flowState);
        } else {
          await this.actionHandler(actions[i], fromCpt as DataSource, args, flowState);
        }
      }
      flowState.reset();
    } else {
      try {
        // 兼容DeprecatedEventConfig类型 组件动作
        await this.compActionHandler(eventConfig as unknown as CompItemConfig, fromCpt as TMagicNode, args);
      } catch (e: any) {
        if (this.app.errorHandler) {
          this.app.errorHandler(e, fromCpt, { type: 'action-handler', config: eventConfig, ...args });
        } else {
          throw e;
        }
      }
    }

    if (typeof this.afterEventHandler === 'function') {
      this.afterEventHandler({ eventConfig, source: fromCpt, args });
    }
  }

  private async actionHandler(
    actionItem: EventActionItem,
    fromCpt: TMagicNode | DataSource,
    args: any[],
    flowState: FlowState,
  ) {
    try {
      if (actionItem.actionType === ActionType.COMP) {
        const compActionItem = actionItem as CompItemConfig;
        // 组件动作
        await this.compActionHandler(compActionItem, fromCpt, args);
      } else if (actionItem.actionType === ActionType.CODE) {
        if (fromCpt.data[NODE_DISABLE_CODE_BLOCK_KEY]) {
          return;
        }
        const codeActionItem = actionItem as CodeItemConfig;
        // 执行代码块
        await this.app.runCode(codeActionItem.codeId, codeActionItem.params || {}, args, flowState);
      } else if (actionItem.actionType === ActionType.DATA_SOURCE) {
        if (fromCpt.data[NODE_DISABLE_DATA_SOURCE_KEY]) {
          return;
        }

        const dataSourceActionItem = actionItem as DataSourceItemConfig;

        const [dsId, methodName] = dataSourceActionItem.dataSourceMethod;

        await this.app.runDataSourceMethod(dsId, methodName, dataSourceActionItem.params || {}, args, flowState);
      }
    } catch (e: any) {
      if (this.app.errorHandler) {
        this.app.errorHandler(e, fromCpt, { type: 'action-handler', config: actionItem, flowState, ...args });
      } else {
        throw e;
      }
    }
  }

  /**
   * 执行联动组件动作
   * @param eventConfig 联动组件的配置
   * @returns void
   */
  private async compActionHandler(eventConfig: CompItemConfig, fromCpt: TMagicNode | DataSource, args: any[]) {
    if (!this.app.page) throw new Error('当前没有页面');

    let { method: methodName, to } = eventConfig;

    if (Array.isArray(methodName)) {
      [to, methodName] = methodName;
    }

    const toNodes = [];
    const toNode = this.app.getNode(to);
    if (toNode) {
      toNodes.push(toNode);
    }

    for (const [, page] of this.app.pageFragments) {
      const node = page.getNode(to);
      if (node) {
        toNodes.push(node);
      }
    }

    if (toNodes.length === 0) {
      this.addEventToQueue({
        toId: to,
        method: methodName,
        fromCpt,
        args,
      });
      return;
    }

    const instanceMethodPropmise = [];
    for (const node of toNodes) {
      if (node.instance) {
        if (typeof node.instance[methodName] === 'function') {
          instanceMethodPropmise.push(node.instance[methodName](fromCpt, ...args));
        }
      } else {
        node.addEventToQueue({
          method: methodName,
          fromCpt,
          args,
        });
      }
    }

    await Promise.all(instanceMethodPropmise);
  }
}
