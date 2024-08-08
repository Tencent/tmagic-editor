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

import { isEmpty } from 'lodash-es';

import { createDataSourceManager, DataSourceManager, ObservedDataClass } from '@tmagic/data-source';
import type { CodeBlockDSL, Id, JsEngine, MApp, RequestFunction } from '@tmagic/schema';

import Env from './Env';
import EventHelper from './EventHelper';
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
  pageFragmentContainerType?: string | string[];
  iteratorContainerType?: string | string[];
  transformStyle?: (style: Record<string, any>) => Record<string, any>;
  request?: RequestFunction;
  DataSourceObservedData?: ObservedDataClass;
}

class App extends EventEmitter {
  public env: Env = new Env();
  public dsl?: MApp;
  public codeDsl?: CodeBlockDSL;
  public dataSourceManager?: DataSourceManager;
  public page?: Page;
  public useMock = false;
  public platform = 'mobile';
  public jsEngine: JsEngine = 'browser';
  public components = new Map();
  public pageFragmentContainerType = new Set(['page-fragment-container']);
  public iteratorContainerType = new Set(['iterator-container']);
  public request?: RequestFunction;
  public transformStyle: (style: Record<string, any>) => Record<string, any>;
  public eventHelper?: EventHelper;

  private flexible?: Flexible;

  constructor(options: AppOptionsConfig) {
    super();

    this.setEnv(options.ua);
    // 代码块描述内容在dsl codeBlocks字段
    this.codeDsl = options.config?.codeBlocks;
    options.platform && (this.platform = options.platform);
    options.jsEngine && (this.jsEngine = options.jsEngine);

    if (options.pageFragmentContainerType) {
      const pageFragmentContainerType = Array.isArray(options.pageFragmentContainerType)
        ? options.pageFragmentContainerType
        : [options.pageFragmentContainerType];
      pageFragmentContainerType.forEach((type) => {
        this.pageFragmentContainerType.add(type);
      });
    }

    if (options.iteratorContainerType) {
      const iteratorContainerType = Array.isArray(options.iteratorContainerType)
        ? options.iteratorContainerType
        : [options.iteratorContainerType];
      iteratorContainerType.forEach((type) => {
        this.iteratorContainerType.add(type);
      });
    }

    if (typeof options.useMock === 'boolean') {
      this.useMock = options.useMock;
    }

    if (this.jsEngine === 'browser') {
      this.flexible = new Flexible({ designWidth: options.designWidth });
    }

    if (this.platform !== 'editor') {
      this.eventHelper = new EventHelper({ app: this });
    }

    this.transformStyle =
      options.transformStyle || ((style: Record<string, any>) => defaultTransformStyle(style, this.jsEngine));

    if (options.request) {
      this.request = options.request;
    }

    if (options.config) {
      this.setConfig(options.config, options.curPage);
    }
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

    const dataSourceList = Array.from(this.dataSourceManager!.dataSourceMap.values());
    this.eventHelper?.bindDataSourceEvents(dataSourceList);
  }

  public setPage(id?: Id) {
    const pageConfig = this.dsl?.items.find((page) => `${page.id}` === `${id}`);

    if (!pageConfig) {
      this.deletePage();

      super.emit('page-change');
      return;
    }

    if (pageConfig === this.page?.data) return;

    this.page?.destroy();

    this.page = new Page({
      config: pageConfig,
      app: this,
    });

    this.eventHelper?.removeNodeEvents();
    this.page.nodes.forEach((node) => {
      this.eventHelper?.bindNodeEvents(node);
    });

    super.emit('page-change', this.page);
  }

  public deletePage() {
    this.page?.destroy();
    this.eventHelper?.removeNodeEvents();
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

  public getNode<T extends Node = Node>(id: Id, iteratorContainerId?: Id[], iteratorIndex?: number[]) {
    return this.page?.getNode<T>(id, iteratorContainerId, iteratorIndex);
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

  public emit(name: string | symbol, ...args: any[]): boolean {
    const [node, ...otherArgs] = args;
    if (
      this.eventHelper &&
      node instanceof Node &&
      node.data?.id &&
      node.eventKeys.has(`${String(name)}_${node.data.id}`)
    ) {
      return this.eventHelper?.emit(node.eventKeys.get(`${String(name)}_${node.data.id}`)!, node, ...otherArgs);
    }
    return super.emit(name, ...args);
  }

  /**
   * 执行代码块动作
   * @param eventConfig 代码动作的配置
   * @returns void
   */
  public async runCode(codeId: Id, params: Record<string, any>, args: any[]) {
    if (!codeId || isEmpty(this.codeDsl)) return;
    const content = this.codeDsl?.[codeId]?.content;
    if (typeof content === 'function') {
      await content({ app: this, params, eventParams: args });
    }
  }

  public async runDataSourceMethod(dsId: string, methodName: string, params: Record<string, any>, args: any[]) {
    if (!dsId || !methodName) return;

    const dataSource = this.dataSourceManager?.get(dsId);

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

    this.eventHelper?.destroy();
  }
}

export default App;
