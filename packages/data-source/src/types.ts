import type { DataSourceSchema, MApp } from '@tmagic/schema';

export interface AppCore {
  dsl?: MApp;
  platform?: string;
  jsEngine?: string;
  request?: RequestFunction;
}

export interface DataSourceOptions {
  schema: DataSourceSchema;
  app: AppCore;
}

export type Method = 'get' | 'GET' | 'delete' | 'DELETE' | 'post' | 'POST' | 'put' | 'PUT';

export type RequestFunction = (options: HttpOptions) => Promise<any>;

export interface HttpOptions {
  url: string;
  params?: Record<string, string>;
  data?: Record<string, any>;
  headers?: Record<string, string>;
  method?: Method;
}

export interface HttpDataSourceSchema extends DataSourceSchema {
  type: 'http';
  options: HttpOptions;
  responseOptions?: {
    dataPath?: string;
  };
  autoFetch?: boolean;
}

export interface HttpDataSourceOptions {
  schema: HttpDataSourceSchema;
  app: AppCore;
  request?: RequestFunction;
}

export interface DataSourceManagerOptions {
  app: AppCore;
}

export interface DataSourceManagerData {
  [key: string]: Record<string, any>;
}
