import type { AppCore, DataSourceSchema, HttpOptions, RequestFunction } from '@tmagic/schema';

import HttpDataSource from './data-sources/Http';

export interface DataSourceOptions {
  schema: DataSourceSchema;
  app: AppCore;
  useMock?: boolean;
}

export interface HttpDataSourceSchema extends DataSourceSchema {
  type: 'http';
  options: HttpOptions;
  responseOptions?: {
    dataPath?: string;
  };
  autoFetch?: boolean;
  beforeRequest:
    | string
    | ((options: HttpOptions, content: { app: AppCore; dataSource: HttpDataSource }) => HttpOptions);
  afterResponse: string | ((response: any, content: { app: AppCore; dataSource: HttpDataSource }) => any);
}

export interface HttpDataSourceOptions extends DataSourceOptions {
  schema: HttpDataSourceSchema;
  request?: RequestFunction;
}

export interface DataSourceManagerOptions {
  app: AppCore;
  useMock?: boolean;
}

export interface DataSourceManagerData {
  [key: string]: Record<string, any>;
}
