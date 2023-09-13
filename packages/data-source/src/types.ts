import type { AppCore, DataSourceSchema, HttpOptions, RequestFunction } from '@tmagic/schema';

export interface DataSourceOptions {
  schema: DataSourceSchema;
  app: AppCore;
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
