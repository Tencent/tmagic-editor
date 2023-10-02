import type { AppCore, DataSourceSchema, HttpOptions, RequestFunction } from '@tmagic/schema';

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
