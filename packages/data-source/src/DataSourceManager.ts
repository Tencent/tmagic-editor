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
import { compiledCond, compiledNode } from '@tmagic/utils';

import { DataSource, HttpDataSource } from './data-sources';
import type { DataSourceManagerData, DataSourceManagerOptions, HttpDataSourceSchema } from './types';

class DataSourceManager extends EventEmitter {
  private static dataSourceClassMap = new Map<string, typeof DataSource>();

  public static registe(type: string, dataSource: typeof DataSource) {
    DataSourceManager.dataSourceClassMap.set(type, dataSource);
  }

  public static getDataSourceClass(type: string) {
    return DataSourceManager.dataSourceClassMap.get(type);
  }

  public app: AppCore;

  public dataSourceMap = new Map<string, DataSource>();

  public data: DataSourceManagerData = {};

  constructor({ app, useMock }: DataSourceManagerOptions) {
    super();

    this.app = app;

    app.dsl?.dataSources?.forEach((config) => {
      this.addDataSource(config, useMock);
    });
  }

  public get(id: string) {
    return this.dataSourceMap.get(id);
  }

  public async addDataSource(config?: DataSourceSchema, useMock?: boolean) {
    if (!config) return;

    let ds: DataSource;
    if (config.type === 'http') {
      ds = new HttpDataSource({
        app: this.app,
        schema: config as HttpDataSourceSchema,
        request: this.app.request,
        useMock,
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const DataSourceClass = DataSourceManager.dataSourceClassMap.get(config.type) || DataSource;

      ds = new DataSourceClass({
        app: this.app,
        schema: config,
        useMock,
      });
    }

    this.dataSourceMap.set(config.id, ds);

    this.data[ds.id] = ds.data;

    ds.on('change', () => {
      this.setData(ds);
    });

    const beforeInit: ((...args: any[]) => any)[] = [];
    const afterInit: ((...args: any[]) => any)[] = [];

    ds.getMethods().forEach((method) => {
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

  public setData(ds: DataSource) {
    Object.assign(this.data[ds.id], ds.data);
    this.emit('change', ds.id);
  }

  public removeDataSource(id: string) {
    this.get(id)?.destroy();
    delete this.data[id];
    this.dataSourceMap.delete(id);
  }

  public updateSchema(schemas: DataSourceSchema[]) {
    schemas.forEach((schema) => {
      const ds = this.dataSourceMap.get(schema.id);
      if (!ds) {
        return;
      }
      ds.setFields(schema.fields);
      ds.updateDefaultData();
      this.data[ds.id] = ds.data;
    });
  }

  public compiledNode(node: MNode, sourceId?: Id) {
    if (node.condResult === false) return node;
    if (node.visible === false) return node;

    return compiledNode(
      (value: any) => {
        if (typeof value === 'string') {
          return template(value)(this.data);
        }
        if (value?.isBindDataSource && value.dataSourceId) {
          return this.data[value.dataSourceId];
        }
        return value;
      },
      cloneDeep(node),
      this.app.dsl?.dataSourceDeps || {},
      sourceId,
    );
  }

  public compliedConds(node: MNode) {
    if (!node.displayConds || !Array.isArray(node.displayConds) || !node.displayConds.length) return true;

    for (const { cond } of node.displayConds) {
      if (!cond) continue;

      let result = true;
      for (const { op, value, range, field } of cond) {
        const [sourceId, fieldKey] = field;

        const dsData = this.data[sourceId];

        if (!dsData || !fieldKey) {
          break;
        }

        const fieldValue = dsData[fieldKey];
        if (!compiledCond(op, fieldValue, value, range)) {
          result = false;
          break;
        }
      }

      if (result) {
        return true;
      }
    }

    return false;
  }

  public destroy() {
    this.removeAllListeners();
    this.data = {};
    this.dataSourceMap.forEach((ds) => {
      ds.destroy();
    });
    this.dataSourceMap = new Map();
  }
}

export default DataSourceManager;
