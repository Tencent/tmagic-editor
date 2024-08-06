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

import EventEmitter from 'events';

import { cloneDeep } from 'lodash-es';

import type { AppCore, DataSourceSchema, DisplayCond, Id, MNode } from '@tmagic/schema';
import { compiledNode } from '@tmagic/utils';

import { SimpleObservedData } from './observed-data/SimpleObservedData';
import { DataSource, HttpDataSource } from './data-sources';
import type { ChangeEvent, DataSourceManagerData, DataSourceManagerOptions, ObservedDataClass } from './types';
import { compiledNodeField, compliedConditions, compliedIteratorItemConditions, compliedIteratorItems } from './utils';

class DataSourceManager extends EventEmitter {
  private static dataSourceClassMap = new Map<string, typeof DataSource>();
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private static ObservedDataClass: ObservedDataClass = SimpleObservedData;

  public static register<T extends typeof DataSource = typeof DataSource>(type: string, dataSource: T) {
    DataSourceManager.dataSourceClassMap.set(type, dataSource);
  }

  /**
   * @deprecated
   */
  public static registe<T extends typeof DataSource = typeof DataSource>(type: string, dataSource: T) {
    DataSourceManager.register(type, dataSource);
  }

  public static getDataSourceClass(type: string) {
    return DataSourceManager.dataSourceClassMap.get(type);
  }

  public static registerObservedData(ObservedDataClass: ObservedDataClass) {
    DataSourceManager.ObservedDataClass = ObservedDataClass;
  }

  public app: AppCore;

  public dataSourceMap = new Map<string, DataSource>();

  public data: DataSourceManagerData = {};
  public useMock?: boolean = false;

  constructor({ app, useMock, initialData }: DataSourceManagerOptions) {
    super();

    this.app = app;
    this.useMock = useMock;

    if (initialData) {
      this.data = initialData;
    }

    app.dsl?.dataSources?.forEach((config) => {
      this.addDataSource(config);
    });

    const dataSourceList = Array.from(this.dataSourceMap);

    if (typeof Promise.allSettled === 'function') {
      Promise.allSettled<Record<string, any>>(dataSourceList.map(([, ds]) => this.init(ds))).then((values) => {
        const data: DataSourceManagerData = {};
        const errors: Record<string, Error> = {};

        values.forEach((value, index) => {
          const dsId = dataSourceList[index][0];
          if (value.status === 'fulfilled') {
            data[dsId] = this.data[dsId];
          } else if (value.status === 'rejected') {
            errors[dsId] = value.reason;
          }
        });

        this.emit('init', data, errors);
      });
    } else {
      Promise.all<Record<string, any>>(dataSourceList.map(([, ds]) => this.init(ds)))
        .then(() => {
          this.emit('init', this.data);
        })
        .catch(() => {
          this.emit('init', this.data);
        });
    }
  }

  public async init(ds: DataSource) {
    if (ds.isInit) {
      return;
    }

    if (this.app.jsEngine && ds.schema.disabledInitInJsEngine?.includes(this.app.jsEngine)) {
      return;
    }

    for (const method of ds.methods) {
      if (typeof method.content !== 'function') return;
      if (method.timing === 'beforeInit') {
        method.content({ params: {}, dataSource: ds, app: this.app });
      }
    }

    await ds.init();

    ds.methods.forEach((method) => {
      if (typeof method.content !== 'function') return;
      if (method.timing === 'afterInit') {
        method.content({ params: {}, dataSource: ds, app: this.app });
      }
    });
  }

  public get(id: string) {
    return this.dataSourceMap.get(id);
  }

  public async addDataSource(config?: DataSourceSchema) {
    if (!config) return;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const DataSourceClass = DataSourceManager.dataSourceClassMap.get(config.type) || DataSource;

    const ds = new DataSourceClass({
      app: this.app,
      schema: config,
      request: this.app.request,
      useMock: this.useMock,
      initialData: this.data[config.id],
      ObservedDataClass: DataSourceManager.ObservedDataClass,
    });

    this.dataSourceMap.set(config.id, ds);

    this.data[ds.id] = ds.data;

    ds.on('change', (changeEvent: ChangeEvent) => {
      this.setData(ds, changeEvent);
    });
  }

  public setData(ds: DataSource, changeEvent: ChangeEvent) {
    this.data[ds.id] = ds.data;
    this.emit('change', ds.id, changeEvent);
  }

  public removeDataSource(id: string) {
    this.get(id)?.destroy();
    delete this.data[id];
    this.dataSourceMap.delete(id);
  }

  public updateSchema(schemas: DataSourceSchema[]) {
    schemas.forEach((schema) => {
      const ds = this.get(schema.id);
      if (!ds) {
        return;
      }

      this.removeDataSource(schema.id);

      this.addDataSource(schema);
      const newDs = this.get(schema.id);
      if (newDs) {
        this.init(newDs);
      }
    });
  }

  public compiledNode({ items, ...node }: MNode, sourceId?: Id, deep = false) {
    const newNode = cloneDeep(node);

    if (items) {
      newNode.items =
        Array.isArray(items) && deep ? items.map((item) => this.compiledNode(item, sourceId, deep)) : items;
    }

    if (node.condResult === false) return newNode;
    if (node.visible === false) return newNode;

    return compiledNode(
      (value: any) => compiledNodeField(value, this.data),
      newNode,
      this.app.dsl?.dataSourceDeps || {},
      sourceId,
    );
  }

  public compliedConds(node: MNode) {
    return compliedConditions(node, this.data);
  }

  public compliedIteratorItemConds(itemData: any, displayConds: DisplayCond[] = []) {
    return compliedIteratorItemConditions(displayConds, itemData);
  }

  public compliedIteratorItems(itemData: any, items: MNode[], dataSourceField: string[] = []) {
    const [dsId, ...keys] = dataSourceField;
    const ds = this.get(dsId);
    if (!ds) return items;
    return compliedIteratorItems(itemData, items, dsId, keys, this.data, this.app.platform === 'editor');
  }

  public destroy() {
    this.removeAllListeners();
    this.data = {};
    this.dataSourceMap.forEach((ds) => {
      ds.destroy();
    });
    this.dataSourceMap.clear();
  }

  public onDataChange(id: string, path: string, callback: (newVal: any) => void) {
    return this.get(id)?.onDataChange(path, callback);
  }

  public offDataChange(id: string, path: string, callback: (newVal: any) => void) {
    return this.get(id)?.offDataChange(path, callback);
  }
}

DataSourceManager.register('http', HttpDataSource as any);

export default DataSourceManager;
