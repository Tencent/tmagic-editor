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

import { cloneDeep, template } from 'lodash-es';

import type { AppCore, DataSourceSchema, Id, MNode } from '@tmagic/schema';
import {
  compiledNode,
  DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX,
  DSL_NODE_KEY_COPY_PREFIX,
  getValueByKeyPath,
} from '@tmagic/utils';

import { DataSource, HttpDataSource } from './data-sources';
import type { ChangeEvent, DataSourceManagerData, DataSourceManagerOptions } from './types';
import { compliedConditions, createIteratorContentData } from './utils';

class DataSourceManager extends EventEmitter {
  private static dataSourceClassMap = new Map<string, typeof DataSource>();

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

    Promise.all(Array.from(this.dataSourceMap).map(async ([, ds]) => this.init(ds)));
  }

  public async init(ds: DataSource) {
    if (ds.isInit) {
      return;
    }

    if (this.app.jsEngine && ds.schema.disabledInitInJsEngine?.includes(this.app.jsEngine)) {
      return;
    }

    const beforeInit: ((...args: any[]) => any)[] = [];
    const afterInit: ((...args: any[]) => any)[] = [];

    ds.methods.forEach((method) => {
      if (typeof method.content !== 'function') return;
      if (method.timing === 'beforeInit') {
        beforeInit.push(method.content);
      }
      if (method.timing === 'afterInit') {
        afterInit.push(method.content);
      }
    });

    for (const method of beforeInit) {
      await method({ params: {}, dataSource: ds, app: this.app });
    }

    await ds.init();

    for (const method of afterInit) {
      await method({ params: {}, dataSource: ds, app: this.app });
    }
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
      (value: any) => {
        // 使用data-source-input等表单控件配置的字符串模板，如：`xxx${id.field}xxx`
        if (typeof value === 'string') {
          return template(value)(this.data);
        }

        // 使用data-source-select等表单控件配置的数据源，如：{ isBindDataSource: true, dataSourceId: 'xxx'}
        if (value?.isBindDataSource && value.dataSourceId) {
          return this.data[value.dataSourceId];
        }

        // 指定数据源的字符串模板，如：{ isBindDataSourceField: true, dataSourceId: 'id', template: `xxx${field}xxx`}
        if (value?.isBindDataSourceField && value.dataSourceId && typeof value.template === 'string') {
          return template(value.template)(this.data[value.dataSourceId]);
        }

        // 使用data-source-field-select等表单控件的数据源字段，如：[`${DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX}${id}`, 'field']
        if (Array.isArray(value) && typeof value[0] === 'string') {
          const [prefixId, ...fields] = value;
          const prefixIndex = prefixId.indexOf(DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX);

          if (prefixIndex > -1) {
            const dsId = prefixId.substring(prefixIndex + DATA_SOURCE_FIELDS_SELECT_VALUE_PREFIX.length);

            const data = this.data[dsId];

            if (!data) return value;

            return getValueByKeyPath(fields.join('.'), data);
          }
        }

        return value;
      },
      newNode,
      this.app.dsl?.dataSourceDeps || {},
      sourceId,
    );
  }

  public compliedConds(node: MNode) {
    return compliedConditions(node, this.data);
  }

  public compliedIteratorItems(itemData: any, items: MNode[], dataSourceField: string[] = []) {
    return items.map((item) => {
      const keys: string[] = [];
      const [dsId, ...fields] = dataSourceField;

      Object.entries(item).forEach(([key, value]) => {
        if (
          typeof value === 'string' &&
          !key.startsWith(DSL_NODE_KEY_COPY_PREFIX) &&
          value.includes(`${dsId}`) &&
          /\$\{([\s\S]+?)\}/.test(value)
        ) {
          keys.push(key);
        }
      });

      return compiledNode(
        (value: string) => template(value)(createIteratorContentData(itemData, dsId, fields)),
        item,
        {
          [dsId]: {
            [item.id]: {
              name: '',
              keys,
            },
          },
        },
        dsId,
      );
    });
  }

  public destroy() {
    this.removeAllListeners();
    this.data = {};
    this.dataSourceMap.forEach((ds) => {
      ds.destroy();
    });
    this.dataSourceMap.clear();
  }
}

DataSourceManager.register('http', HttpDataSource as any);

export default DataSourceManager;
