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

import { has, isEmpty } from 'lodash-es';

import { createDataSourceManager, DataSourceManager } from '@tmagic/data-source';
import {
  ActionType,
  type AppCore,
  type CodeBlockDSL,
  type CodeItemConfig,
  type CompItemConfig,
  type DataSourceItemConfig,
  type DeprecatedEventConfig,
  type EventConfig,
  type Id,
  type JsEngine,
  type MApp,
  type RequestFunction,
} from '@tmagic/schema';

import Env from './Env';
import { bindCommonEventListener, isCommonMethod, triggerCommonMethod } from './events';
import Node from './Node';
import Page from './Page';
import { fillBackgroundImage, isNumber, style2Obj } from './utils';

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
}

interface EventCache {
  eventConfig: CompItemConfig | DeprecatedEventConfig;
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
  public jsEngine = 'browser';
  public designWidth = 375;
  public request?: RequestFunction;

  public components = new Map();

  public eventQueueMap: Record<string, EventCache[]> = {};

  private eventList = new Map<(fromCpt: Node, ...args: any[]) => void, string>();

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

    if (typeof options.designWidth !== 'undefined') {
      this.setDesignWidth(options.designWidth);
    }

    if (options.transformStyle) {
      this.transformStyle = options.transformStyle;
    }

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
    this.designWidth = width;
    // 根据屏幕大小计算出跟节点的font-size，用于rem样式的适配
    if (this.jsEngine === 'browser') {
      this.calcFontsize();
      globalThis.removeEventListener('resize', this.calcFontsize);
      globalThis.addEventListener('resize', this.calcFontsize);
    }
  }

  /**
   * 将dsl中的style配置转换成css，主要是将数值转成rem为单位的样式值，例如100将被转换成1rem
   * @param style Object
   * @returns Object
   */
  public transformStyle(style: Record<string, any> | string) {
    if (!style) {
      return {};
    }

    let styleObj: Record<string, any> = {};
    const results: Record<string, any> = {};

    if (typeof style === 'string') {
      styleObj = style2Obj(style);
    } else {
      styleObj = { ...style };
    }

    const isHippy = this.jsEngine === 'hippy';

    const whiteList = ['zIndex', 'opacity', 'fontWeight'];
    Object.entries(styleObj).forEach(([key, value]) => {
      if (key === 'scale' && !results.transform && isHippy) {
        results.transform = [{ scale: value }];
      } else if (key === 'backgroundImage' && !isHippy) {
        value && (results[key] = fillBackgroundImage(value));
      } else if (key === 'transform' && typeof value !== 'string') {
        results[key] = this.getTransform(value);
      } else if (!whiteList.includes(key) && value && /^[-]?[0-9]*[.]?[0-9]*$/.test(value)) {
        results[key] = isHippy ? value : `${value / 100}rem`;
      } else {
        results[key] = value;
      }
    });

    return results;
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

  public resolveComponent(type: string) {
    return this.components.get(type);
  }

  public bindEvents() {
    Array.from(this.eventList.keys()).forEach((handler) => {
      const name = this.eventList.get(handler);
      name && this.off(name, handler);
    });

    this.eventList.clear();

    if (!this.page) return;

    for (const [, value] of this.page.nodes) {
      value.events?.forEach((event) => {
        const eventName = `${event.name}_${value.data.id}`;
        const eventHandler = (fromCpt: Node, ...args: any[]) => {
          this.eventHandler(event, fromCpt, args);
        };
        this.eventList.set(eventHandler, eventName);
        this.on(eventName, eventHandler);
      });
    }
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
    if (this.codeDsl![codeId] && typeof this.codeDsl![codeId]?.content === 'function') {
      await this.codeDsl![codeId].content({ app: this, params, eventParams: args });
    }
  }

  /**
   * 执行联动组件动作
   * @param eventConfig 联动组件的配置
   * @returns void
   */
  public async compActionHandler(eventConfig: CompItemConfig | DeprecatedEventConfig, fromCpt: any, args: any[]) {
    if (!this.page) throw new Error('当前没有页面');

    const { method: methodName, to } = eventConfig;
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

    if (this.jsEngine === 'browser') {
      globalThis.removeEventListener('resize', this.calcFontsize);
    }
  }

  /**
   * 事件联动处理函数
   * @param eventConfig 事件配置
   * @param fromCpt 触发事件的组件
   * @param args 事件参数
   */
  private async eventHandler(eventConfig: EventConfig | DeprecatedEventConfig, fromCpt: any, args: any[]) {
    if (has(eventConfig, 'actions')) {
      // EventConfig类型
      const { actions } = eventConfig as EventConfig;
      for (const actionItem of actions) {
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
    } else {
      // 兼容DeprecatedEventConfig类型 组件动作
      await this.compActionHandler(eventConfig as DeprecatedEventConfig, fromCpt, args);
    }
  }

  private addEventToMap(event: EventCache) {
    if (this.eventQueueMap[event.eventConfig.to]) {
      this.eventQueueMap[event.eventConfig.to].push(event);
    } else {
      this.eventQueueMap[event.eventConfig.to] = [event];
    }
  }

  private getTransform(value: Record<string, string>) {
    if (!value) return [];

    const transform = Object.entries(value).map(([transformKey, transformValue]) => {
      if (!transformValue.trim()) return '';
      if (transformKey === 'rotate' && isNumber(transformValue)) {
        transformValue = `${transformValue}deg`;
      }

      return this.jsEngine !== 'hippy' ? `${transformKey}(${transformValue})` : { [transformKey]: transformValue };
    });

    if (this.jsEngine === 'hippy') {
      return transform;
    }
    const values = transform.join(' ');
    return !values.trim() ? 'none' : values;
  }

  private calcFontsize() {
    const { width } = document.documentElement.getBoundingClientRect();
    const fontSize = width / (this.designWidth / 100);
    document.documentElement.style.fontSize = `${fontSize}px`;
  }
}

export default App;
