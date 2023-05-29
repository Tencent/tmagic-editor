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

import { DataSourceSchema } from '@tmagic/schema';

import { DataSource, HttpDataSource } from './data-sources';
import type { DataSourceManagerData, DataSourceManagerOptions, HttpDataSourceSchema, RequestFunction } from './types';

class DataSourceManager extends EventEmitter {
  public static dataSourceClassMap = new Map<string, typeof DataSource>();
  public static registe(type: string, dataSource: typeof DataSource) {
    DataSourceManager.dataSourceClassMap.set(type, dataSource);
  }

  public dataSourceMap = new Map<string, DataSource>();

  public data: DataSourceManagerData = {};

  private request?: RequestFunction;

  constructor(options: DataSourceManagerOptions) {
    super();

    if (options.httpDataSourceOptions?.request) {
      this.request = options.httpDataSourceOptions.request;
    }

    options.dataSourceConfigs.forEach((config) => {
      this.addDataSource(config);
    });
  }

  public get(id: string) {
    return this.dataSourceMap.get(id);
  }

  public addDataSource(config?: DataSourceSchema) {
    if (!config) return;

    let ds: DataSource;
    if (config.type === 'http') {
      ds = new HttpDataSource({
        schema: config as HttpDataSourceSchema,
        request: this.request,
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const DataSourceClass = DataSourceManager.dataSourceClassMap.get(config.type) || DataSource;

      ds = new DataSourceClass({
        schema: config,
      });
    }

    this.dataSourceMap.set(config.id, ds);

    this.data[ds.id] = ds.data;

    ds.init().then(() => {
      this.data[ds.id] = ds.data;
    });

    ds.on('change', () => {
      Object.assign(this.data[ds.id], ds.data);

      this.emit('change', ds.id);
    });
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
