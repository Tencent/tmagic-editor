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
} from '@tmagic/schema';
import { DATA_SOURCE_FIELDS_CHANGE_EVENT_PREFIX, getIdFromEl } from '@tmagic/utils';

import type { default as TMagicApp } from './App';
import FlowState from './FlowState';
import type { default as TMagicNode } from './Node';
import { COMMON_EVENT_PREFIX, isCommonMethod, triggerCommonMethod } from './utils';

const getCommonEventName = (commonEventName: string) => {
  if (commonEventName.startsWith(COMMON_EVENT_PREFIX)) return commonEventName;
  return `${COMMON_EVENT_PREFIX}${commonEventName}`;
};

// 点击在组件内的某个元素上，需要向上寻找到当前组件
const getDirectComponent = (element: HTMLElement | null, app: TMagicApp): TMagicNode | undefined => {
  if (!element) {
    return;
  }

  const id = getIdFromEl()(element);

  if (!id) {
    return getDirectComponent(element.parentElement, app);
  }

  const node = app.getNode(
    id,
    element.dataset.tmagicIteratorContainerId?.split(','),
    element.dataset.tmagicIteratorIndex?.split(',').map((i) => globalThis.parseInt(i, 10)),
  );

  return node;
};

export default class EventHelper extends EventEmitter {
  public app: TMagicApp;

  private nodeEventList = new Map<(fromCpt: TMagicNode, ...args: any[]) => void, symbol>();
  private dataSourceEventList = new Map<string, Map<string, (...args: any[]) => void>>();

  constructor({ app }: { app: TMagicApp }) {
    super();

    this.app = app;

    if (app.jsEngine === 'browser') {
      globalThis.document.body.addEventListener('click', this.commonClickEventHandler);
    }
  }

  public destroy() {
    this.removeNodeEvents();
    this.removeAllListeners();

    if (this.app.jsEngine === 'browser') {
      globalThis.document.body.removeEventListener('click', this.commonClickEventHandler);
    }
  }

  public bindNodeEvents(node: TMagicNode) {
    node.events?.forEach((event, index) => {
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

  /**
   * 事件联动处理函数
   * @param eventsConfigIndex 事件配置索引，可以通过此索引从node.event中获取最新事件配置
   * @param fromCpt 触发事件的组件
   * @param args 事件参数
   */
  private async eventHandler(config: EventConfig | number, fromCpt: TMagicNode | DataSource | undefined, args: any[]) {
    const eventConfig = typeof config === 'number' ? (fromCpt as TMagicNode).events[config] : config;
    if (has(eventConfig, 'actions')) {
      // EventConfig类型
      const flowState = new FlowState();
      const { actions } = eventConfig as EventConfig;
      for (let i = 0; i < actions.length; i++) {
        if (flowState?.isAbort) break;
        if (typeof config === 'number') {
          // 事件响应中可能会有修改数据源数据的，会更新dsl，所以这里需要重新获取
          const actionItem = ((fromCpt as TMagicNode).events[config] as EventConfig).actions[i];
          this.actionHandler(actionItem, fromCpt as TMagicNode, args, flowState);
        } else {
          this.actionHandler(actions[i], fromCpt as DataSource, args, flowState);
        }
      }
      flowState.reset();
    } else {
      // 兼容DeprecatedEventConfig类型 组件动作
      await this.compActionHandler(eventConfig as unknown as CompItemConfig, fromCpt as TMagicNode, args);
    }
  }

  private async actionHandler(
    actionItem: EventActionItem,
    fromCpt: TMagicNode | DataSource,
    args: any[],
    flowState: FlowState,
  ) {
    if (actionItem.actionType === ActionType.COMP) {
      const compActionItem = actionItem as CompItemConfig;
      // 组件动作
      await this.compActionHandler(compActionItem, fromCpt, args);
    } else if (actionItem.actionType === ActionType.CODE) {
      const codeActionItem = actionItem as CodeItemConfig;
      // 执行代码块
      await this.app.runCode(codeActionItem.codeId, codeActionItem.params || {}, args, flowState);
    } else if (actionItem.actionType === ActionType.DATA_SOURCE) {
      const dataSourceActionItem = actionItem as DataSourceItemConfig;

      const [dsId, methodName] = dataSourceActionItem.dataSourceMethod;

      await this.app.runDataSourceMethod(dsId, methodName, dataSourceActionItem.params || {}, args, flowState);
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

    const toNode = this.app.getNode(to);
    if (!toNode) throw `ID为${to}的组件不存在`;

    if (isCommonMethod(methodName)) {
      return triggerCommonMethod(methodName, toNode);
    }

    if (toNode.instance) {
      if (typeof toNode.instance[methodName] === 'function') {
        await toNode.instance[methodName](fromCpt, ...args);
      }
    } else {
      toNode.addEventToQueue({
        method: methodName,
        fromCpt,
        args,
      });
    }
  }

  private commonClickEventHandler = (e: MouseEvent) => {
    if (!e.target) {
      return;
    }

    const node = getDirectComponent(e.target as HTMLElement, this.app);

    const eventName = `${getCommonEventName('click')}_${node?.data.id}`;
    if (node?.eventKeys.has(eventName)) {
      this.emit(node.eventKeys.get(eventName)!, node);
    }
  };
}
