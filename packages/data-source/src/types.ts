import type { AppCore, DataSourceSchema, HttpOptions, RequestFunction } from '@tmagic/schema';

import type DataSource from './data-sources/Base';
import type HttpDataSource from './data-sources/Http';
import { ObservedData } from './observed-data/ObservedData';

export type ObservedDataClass = new (...args: any[]) => ObservedData;

export interface DataSourceOptions<T extends DataSourceSchema = DataSourceSchema> {
  schema: T;
  app: AppCore;
  initialData?: Record<string, any>;
  useMock?: boolean;
  request?: RequestFunction;
  ObservedDataClass?: ObservedDataClass;
  [key: string]: any;
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
  afterResponse:
    | string
    | ((response: any, content: { app: AppCore; dataSource: HttpDataSource; options: Partial<HttpOptions> }) => any);
}

export interface DataSourceManagerOptions {
  app: AppCore;
  /** 初始化数据，ssr数据可以由此传入 */
  initialData?: DataSourceManagerData;
  /** 是否使用mock数据 */
  useMock?: boolean;
}

export interface DataSourceManagerData {
  [key: string]: Record<string, any>;
}

export interface ChangeEvent {
  path?: string;
  updateData: any;
}

export type AsyncDataSourceResolveResult<T = typeof DataSource> = {
  default: T;
};
