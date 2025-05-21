import type { DataSource, DataSourceManagerData, ObservedDataClass } from '@tmagic/data-source';
import type { DataSourceSchema, EventConfig, Id, JsEngine, MApp, RequestFunction } from '@tmagic/schema';

import type Env from './Env';
import type TMagicNode from './Node';

export type ErrorHandler = (
  err: Error,
  node: DataSource<DataSourceSchema> | TMagicNode | undefined,
  info: Record<string, any>,
) => void;

export interface AppOptionsConfig {
  ua?: string;
  env?: Env;
  config?: MApp;
  platform?: 'editor' | 'mobile' | 'tv' | 'pc';
  jsEngine?: JsEngine;
  designWidth?: number;
  curPage?: Id;
  useMock?: boolean;
  disabledFlexible?: boolean;
  pageFragmentContainerType?: string | string[];
  iteratorContainerType?: string | string[];
  transformStyle?: (style: Record<string, any>) => Record<string, any>;
  request?: RequestFunction;
  DataSourceObservedData?: ObservedDataClass;
  dataSourceManagerInitialData?: DataSourceManagerData;
  nodeStoreInitialData?: () => any;
  errorHandler?: ErrorHandler;
  beforeEventHandler?: BeforeEventHandler;
  afterEventHandler?: AfterEventHandler;
}

export type BeforeEventHandler = (args: {
  eventConfig: EventConfig;
  source: TMagicNode | DataSource | undefined;
  args: any[];
}) => void;

export type AfterEventHandler = (args: {
  eventConfig: EventConfig;
  source: TMagicNode | DataSource | undefined;
  args: any[];
}) => void;
