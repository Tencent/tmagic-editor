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

import { has, isArray, isEmpty } from 'lodash-es';

import { createDataSourceManager, DataSource, DataSourceManager, ObservedDataClass } from '@tmagic/data-source';
import {
  ActionType,
  type AppCore,
  type CodeBlockDSL,
  type CodeItemConfig,
  type CompItemConfig,
  type DataSourceItemConfig,
  type EventActionItem,
  type EventConfig,
  type Id,
  type JsEngine,
  type MApp,
  type RequestFunction,
} from '@tmagic/schema';
import { DATA_SOURCE_FIELDS_CHANGE_EVENT_PREFIX } from '@tmagic/utils';

import Env from './Env';
import { bindCommonEventListener, isCommonMethod, triggerCommonMethod } from './events';
import Flexible from './Flexible';
import Node from './Node';
import Page from './Page';
import { transformStyle as defaultTransformStyle } from './utils';

interface AppOptionsConfig {
  ua?: string;
  config?: MApp;
  platform?: 'editor' | 'mobile' | 'tv' | 'pc';
  jsEngine?: JsEngine;
  designWidth?: number;
  curPage?: Id;
  useMock?: boolean;
  transformStyle?: (style: Record<string, any>) => Record<string, any>;
  request?: RequestFunction;
  DataSourceObservedData?: ObservedDataClass;
}

interface EventCache {
  eventConfig: CompItemConfig;
  fromCpt: any;
  args: any[];
}

class App extends EventEmitter implements AppCore {
  public env: Env = new Env();
  public dsl?: MApp;
  public codeDsl?: CodeBlockDSL;
  public dataSourceManager?: DataSourceManager;

  public page?: Page;

  public useMock = false;
  public platform = 'mobile';
  public jsEngine: JsEngine = 'browser';
  public request?: RequestFunction;

  public components = new Map();

  public eventQueueMap: Record<string, EventCache[]> = {};
  public transformStyle: (style: Record<string, any>) => Record<string, any>;

  public flexible?: Flexible;

  private eventList = new Map<(fromCpt: Node, ...args: any[]) => void, string>();
  private dataSourceEventList = new Map<string, Map<string, (...args: any[]) => void>>();

  constructor(options: AppOptionsConfig) {
    super();

    this.setEnv(options.ua);
    // 代码块描述内容在dsl codeBlocks字段
    this.codeDsl = options.config?.codeBlocks;
    options.platform && (this.platform = options.platform);
    options.jsEngine && (this.jsEngine = options.jsEngine);

    if (typeof options.useMock === 'boolean') {
      this.useMock = options.useMock;
    }

    if (this.jsEngine === 'browser') {
      this.flexible = new Flexible({ designWidth: options.designWidth });
    }

    this.transformStyle =
      options.transformStyle || ((style: Record<string, any>) => defaultTransformStyle(style, this.jsEngine));

    if (options.request) {
      this.request = options.request;
    }

    if (options.config) {
      this.setConfig(options.config, options.curPage);
    }

    bindCommonEventListener(this);
  }

  public setEnv(ua?: string) {
    this.env = new Env(ua);
  }

  public setDesignWidth(width: number) {
    this.flexible?.setDesignWidth(width);
  }

  /**
   * 设置dsl
   * @param config dsl跟节点
   * @param curPage 当前页面id
   */
  public setConfig(config: MApp, curPage?: Id) {
    this.dsl = config;

    if (!curPage && config.items.length) {
      curPage = config.items[0].id;
    }

    if (this.dataSourceManager) {
      this.dataSourceManager.destroy();
    }

    this.dataSourceManager = createDataSourceManager(this, this.useMock);

    this.codeDsl = config.codeBlocks;
    this.setPage(curPage || this.page?.data?.id);
  }

  /**
   * 留着为了兼容，不让报错
   * @deprecated
   */
  public addPage() {
    console.info('addPage 已经弃用');
  }

  public setPage(id?: Id) {
    const pageConfig = this.dsl?.items.find((page) => `${page.id}` === `${id}`);

    if (!pageConfig) {
      if (this.page) {
        this.page.destroy();
        this.page = undefined;
      }

      super.emit('page-change');
      return;
    }

    if (pageConfig === this.page?.data) return;

    if (this.page) {
      this.page.destroy();
    }

    this.page = new Page({
      config: pageConfig,
      app: this,
    });

    super.emit('page-change', this.page);

    this.bindEvents();
  }

  public deletePage() {
    this.page = undefined;
  }

  /**
   * 兼容id参数
   * @param id 节点id
   * @returns Page | void
   */
  public getPage(id?: Id) {
    if (!id) return this.page;
    if (this.page && `${this.page.data.id}` === `${id}`) {
      return this.page;
    }
  }

  public registerComponent(type: string, Component: any) {
    this.components.set(type, Component);
  }

  public unregisterComponent(type: string) {
    this.components.delete(type);
  }

  public resolveComponent<T = any>(type: string) {
    return this.components.get(type) as T;
  }

  public bindEvents() {
    Array.from(this.eventList.keys()).forEach((handler) => {
      const name = this.eventList.get(handler);
      name && this.off(name, handler);
    });

    this.eventList.clear();

    if (!this.page) return;

    for (const [, value] of this.page.nodes) {
      value.events?.forEach((event, index) => {
        let eventName = `${event.name}_${value.data.id}`;
        let eventHandler = (fromCpt: Node, ...args: any[]) => {
          this.eventHandler(index, fromCpt, args);
        };

        // 页面片容器可以配置页面片内组件的事件，形式为“${nodeId}.${eventName}”
        const eventNames = event.name.split('.');
        if (eventNames.length > 1) {
          eventName = `${eventNames[1]}_${eventNames[0]}`;
          eventHandler = (fromCpt: Node, ...args: any[]) => {
            this.eventHandler(index, value, args);
          };
        }

        this.eventList.set(eventHandler, eventName);
        this.on(eventName, eventHandler);
      });
    }
    this.bindDataSourceEvents();
  }

  public emit(name: string | symbol, ...args: any[]): boolean {
    const [node, ...otherArgs] = args;
    if (node instanceof Node && node?.data?.id) {
      return super.emit(`${String(name)}_${node.data.id}`, node, ...otherArgs);
    }
    return super.emit(name, ...args);
  }

  /**
   * 执行代码块动作
   * @param eventConfig 代码动作的配置
   * @returns void
   */
  public async codeActionHandler(eventConfig: CodeItemConfig, args: any[]) {
    const { codeId = '', params = {} } = eventConfig;
    if (!codeId || isEmpty(this.codeDsl)) return;
    const content = this.codeDsl?.[codeId]?.content;
    if (typeof content === 'function') {
      await content({ app: this, params, eventParams: args });
    }
  }

  /**
   * 执行联动组件动作
   * @param eventConfig 联动组件的配置
   * @returns void
   */
  public async compActionHandler(eventConfig: CompItemConfig, fromCpt: Node | DataSource, args: any[]) {
    if (!this.page) throw new Error('当前没有页面');

    let { method: methodName, to } = eventConfig;

    if (isArray(methodName)) {
      [to, methodName] = methodName;
    }

    const toNode = this.page.getNode(to);
    if (!toNode) throw `ID为${to}的组件不存在`;

    if (isCommonMethod(methodName)) {
      return triggerCommonMethod(methodName, toNode);
    }

    if (toNode.instance) {
      if (typeof toNode.instance[methodName] === 'function') {
        await toNode.instance[methodName](fromCpt, ...args);
      }
    } else {
      this.addEventToMap({
        eventConfig,
        fromCpt,
        args,
      });
    }
  }

  public async dataSourceActionHandler(eventConfig: DataSourceItemConfig, args: any[]) {
    const { dataSourceMethod = [], params = {} } = eventConfig;

    const [id, methodName] = dataSourceMethod;

    if (!id || !methodName) return;

    const dataSource = this.dataSourceManager?.get(id);

    if (!dataSource) return;

    const methods = dataSource.methods || [];

    const method = methods.find((item) => item.name === methodName);

    if (!method) return;

    if (typeof method.content === 'function') {
      await method.content({ app: this, params, dataSource, eventParams: args });
    }
  }

  public destroy() {
    this.removeAllListeners();
    this.page = undefined;

    this.flexible?.destroy();
    this.flexible = undefined;
  }

  private bindDataSourceEvents() {
    if (this.platform === 'editor') return;

    // 先清掉之前注册的事件，重新注册
    Array.from(this.dataSourceEventList.keys()).forEach((dataSourceId) => {
      const dataSourceEvent = this.dataSourceEventList.get(dataSourceId)!;
      Array.from(dataSourceEvent.keys()).forEach((eventName) => {
        const [prefix, ...path] = eventName.split('.');
        if (prefix === DATA_SOURCE_FIELDS_CHANGE_EVENT_PREFIX) {
          this.dataSourceManager?.offDataChange(dataSourceId, path.join('.'), dataSourceEvent.get(eventName)!);
        } else {
          this.dataSourceManager?.get(dataSourceId)?.off(prefix, dataSourceEvent.get(eventName)!);
        }
      });
    });

    (this.dsl?.dataSources || []).forEach((dataSource) => {
      const dataSourceEvent = this.dataSourceEventList.get(dataSource.id) ?? new Map<string, (args: any) => void>();
      (dataSource.events || []).forEach((event) => {
        const [prefix, ...path] = event.name?.split('.') || [];
        if (!prefix) return;
        const handler = (...args: any[]) => {
          this.eventHandler(event, this.dataSourceManager?.get(dataSource.id), args);
        };
        dataSourceEvent.set(event.name, handler);
        if (prefix === DATA_SOURCE_FIELDS_CHANGE_EVENT_PREFIX) {
          // 数据源数据变化
          this.dataSourceManager?.onDataChange(dataSource.id, path.join('.'), handler);
        } else {
          // 数据源自定义事件
          this.dataSourceManager?.get(dataSource.id)?.on(prefix, handler);
        }
      });
      this.dataSourceEventList.set(dataSource.id, dataSourceEvent);
    });
  }

  private async actionHandler(actionItem: EventActionItem, fromCpt: Node | DataSource, args: any[]) {
    if (actionItem.actionType === ActionType.COMP) {
      // 组件动作
      await this.compActionHandler(actionItem as CompItemConfig, fromCpt, args);
    } else if (actionItem.actionType === ActionType.CODE) {
      // 执行代码块
      await this.codeActionHandler(actionItem as CodeItemConfig, args);
    } else if (actionItem.actionType === ActionType.DATA_SOURCE) {
      await this.dataSourceActionHandler(actionItem as DataSourceItemConfig, args);
    }
  }

  /**
   * 事件联动处理函数
   * @param eventsConfigIndex 事件配置索引，可以通过此索引从node.event中获取最新事件配置
   * @param fromCpt 触发事件的组件
   * @param args 事件参数
   */
  private async eventHandler(config: EventConfig | number, fromCpt: Node | DataSource | undefined, args: any[]) {
    const eventConfig = typeof config === 'number' ? (fromCpt as Node).events[config] : config;
    if (has(eventConfig, 'actions')) {
      // EventConfig类型
      const { actions } = eventConfig as EventConfig;
      for (let i = 0; i < actions.length; i++) {
        if (typeof config === 'number') {
          // 事件响应中可能会有修改数据源数据的，会更新dsl，所以这里需要重新获取
          const actionItem = ((fromCpt as Node).events[config] as EventConfig).actions[i];
          this.actionHandler(actionItem, fromCpt as Node, args);
        } else {
          this.actionHandler(actions[i], fromCpt as DataSource, args);
        }
      }
    } else {
      // 兼容DeprecatedEventConfig类型 组件动作
      await this.compActionHandler(eventConfig as unknown as CompItemConfig, fromCpt as Node, args);
    }
  }

  private addEventToMap(event: EventCache) {
    if (this.eventQueueMap[event.eventConfig.to]) {
      this.eventQueueMap[event.eventConfig.to].push(event);
    } else {
      this.eventQueueMap[event.eventConfig.to] = [event];
    }
  }
}

export default App;
