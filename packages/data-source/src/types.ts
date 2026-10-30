import type { DataSourceSchema, default as TMagicApp, HttpOptions, Method, RequestFunction } from '@tmagic/core';

import type DataSource from './data-sources/Base';
import type HttpDataSource from './data-sources/Http';
import type { ObservedData } from './observed-data/ObservedData';

export type ObservedDataClass = new (...args: any[]) => ObservedData;

export interface DataSourceOptions<T extends DataSourceSchema = DataSourceSchema> {
  schema: T;
  app: TMagicApp;
  initialData?: Record<string, any>;
  useMock?: boolean;
  request?: RequestFunction;
  ObservedDataClass?: ObservedDataClass;
  [key: string]: any;
}

export interface HttpOptionsSchema {
  /** 请求链接 */
  url: string | ((data: { app: TMagicApp; dataSource: HttpDataSource }) => string);
  /** query参数 */
  params?: Record<string, string> | ((data: { app: TMagicApp; dataSource: HttpDataSource }) => Record<string, string>);
  /** body数据 */
  data?: Record<string, any> | ((data: { app: TMagicApp; dataSource: HttpDataSource }) => Record<string, string>);
  /** 请求头 */
  headers?: Record<string, string> | ((data: { app: TMagicApp; dataSource: HttpDataSource }) => Record<string, string>);
  /** 请求方法 GET/POST */
  method?: Method;
  [key: string]: any;
}

export interface HttpDataSourceSchema extends DataSourceSchema {
  type: 'http';
  options: HttpOptionsSchema;
  responseOptions?: {
    dataPath?: string;
  };
  autoFetch?: boolean;
  beforeRequest:
    string | ((options: HttpOptions, content: { app: TMagicApp; dataSource: HttpDataSource }) => HttpOptions);
  afterResponse:
    | string
    | ((response: any, content: { app: TMagicApp; dataSource: HttpDataSource; options: Partial<HttpOptions> }) => any);
}

export interface DataSourceManagerOptions {
  app: TMagicApp;
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

/** DataSourceManager.batch 期间收集到的数据变化 */
export interface BatchChange {
  sourceId: string;
  changeEvent: ChangeEvent;
}

export interface BatchOptions {
  /**
   * 是否把同一数据源在 batch 中的多次变化合并成一次 update-data，默认 true。
   * - true：每个数据源只触发一次 update-data，changeEvent 为该数据源最后一次变化（中间变化会丢失）
   * - false：每次变化各触发一次 update-data，各自携带自己的 changeEvent（如 path / updateData），
   *   页面节点仍然只编译、替换一次
   */
  mergeChangeEvents?: boolean;
}

export type AsyncDataSourceResolveResult<T = typeof DataSource> = {
  default: T;
};

export interface SchemaListMap {
  [key: string]: DataSourceSchema[];
}
