/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.  All rights reserved.
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

/**
 * @fileoverview DSL SDK 的公共类型：响应式注入、适配器、上下文、校验结果。
 *
 * 这里只放类型，禁止引入运行时依赖（vue / stage / design 等）。
 */

import type { DataSourceSchema, EventOption, Id, MApp, MNode } from '@tmagic/core';
import type { FormConfig } from '@tmagic/form';

import type {
  CanDropInFunction,
  ComponentGroup,
  DatasourceTypeOption,
  PropsFormConfigFunction,
  PropsFormValueFunction,
} from '@editor/type';
import type { CollectWorkerPayload, CollectWorkerResult, DepsData } from '@editor/utils/dep/worker';

import type CodeBlock from './services/CodeBlock';
import type ComponentList from './services/ComponentList';
import type DataSource from './services/DataSource';
import type Dep from './services/Dep';
import type Editor from './services/Editor';
import type Events from './services/Events';
import type History from './services/History';
import type Props from './services/Props';
import type WebStorage from './services/WebStorage';
import type { Validator } from './validate';

// #region Reactivity
/**
 * 响应式实现，默认直接使用 Vue 的 `reactive` / `shallowReactive` / `toRaw` / `nextTick`；
 * 可通过 `SdkOptions.reactivity` 覆盖。
 */
export interface Reactivity {
  reactive: <T extends object>(target: T) => T;
  shallowReactive: <T extends object>(target: T) => T;
  toRaw: <T>(value: T) => T;
  nextTick: () => Promise<void>;
}
// #endregion Reactivity

// #region StorageLike
/** 存储适配器接口，`localStorage` 天然满足 */
export interface StorageLike {
  readonly length: number;
  clear(): void;
  getItem(key: string): string | null;
  key(index: number): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}
// #endregion StorageLike

// #region HistoryPersistence
/** 历史快照的持久化适配器（浏览器端对应 IndexedDB）。不提供则 `saveToIndexedDB` / `restoreFromIndexedDB` 会 reject */
export interface HistoryPersistence {
  get<T = unknown>(dbName: string, storeName: string, key: IDBValidKey): Promise<T | undefined>;
  set(dbName: string, storeName: string, key: IDBValidKey, value: unknown): Promise<void>;
}
// #endregion HistoryPersistence

// #region CollectWorkerLike
/**
 * 依赖收集 worker 适配器。浏览器端注入基于 Web Worker 的实现，Node 下不提供，
 * 依赖收集会退回主线程的空闲队列（`IdleTask`，Node 下由 setTimeout 驱动）。
 */
export interface CollectWorkerLike {
  readonly isSupported: boolean;
  collectDsl(dsl: MApp): Promise<DepsData | null>;
  collect(payload: CollectWorkerPayload): Promise<CollectWorkerResult | null>;
  terminate(): void;
  abort(): void;
}
// #endregion CollectWorkerLike

// #region ValidateMode
/**
 * 校验模式
 * - `strict`：修改前校验，不通过抛出 {@link DslValidationError}，DSL 不被修改
 * - `record`：只把校验结果写进 `invalidNodeIds`
 * - `off`：不做额外校验
 */
export type ValidateMode = 'strict' | 'record' | 'off';
// #endregion ValidateMode

// #region ValidationError
export interface DslValidationIssue {
  /** 出错对象类型 */
  target: 'node' | 'data-source' | 'code-block' | 'dsl';
  /** 出错对象 id */
  id?: Id;
  /** 出错属性路径，结构性错误时为空 */
  path?: string;
  /** 错误分类：structure 为结构合法性，props 为属性表单校验 */
  kind: 'structure' | 'props';
  message: string;
  /** 可选的修正建议（如可选值列表） */
  suggestion?: string;
}

export interface DslValidationResult {
  valid: boolean;
  errors: DslValidationIssue[];
}
// #endregion ValidationError

// #region SdkOptions
export interface SdkOptions {
  /** 初始 DSL，会被深拷贝，不会修改传入的对象 */
  dsl?: MApp | null;
  /** 此前通过 `history.serialize()` 导出的历史快照 */
  history?: import('@editor/type').PersistedHistoryState | null;

  reactivity?: Partial<Reactivity>;
  /** 存储适配器，默认内存实现 */
  storage?: StorageLike;
  /** 把序列化后的字符串还原成值（含函数），默认 `JSON.parse`；浏览器端传入 `eval` 实现 */
  parseDSL?: (code: string) => any;
  historyPersistence?: HistoryPersistence;
  collectWorker?: CollectWorkerLike;
  /** 提示信息，默认不做任何事 */
  notify?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  /** 复制文本到剪贴板，默认不做任何事 */
  copyText?: (text: string) => Promise<void> | void;

  /** 校验模式，默认 `strict` */
  validateMode?: ValidateMode;
  /** 是否自动绑定依赖收集连线，默认 true；浏览器默认实例传 false，由 initService 挂载时绑定 */
  autoWiring?: boolean;

  // 登记表，与 EditorProps 同名项一一对应
  componentGroupList?: ComponentGroup[];
  propsConfigs?: Record<string, FormConfig | PropsFormConfigFunction>;
  propsValues?: Record<string, Partial<MNode> | PropsFormValueFunction>;
  eventMethodList?: Record<string, { events: EventOption[]; methods: EventOption[] }>;
  datasourceList?: DatasourceTypeOption[];
  datasourceConfigs?: Record<string, FormConfig>;
  datasourceValues?: Record<string, Partial<DataSourceSchema>>;
  datasourceEventMethodList?: Record<string, { events: EventOption[]; methods: EventOption[] }>;
  disabledCodeBlock?: boolean;
  disabledDataSource?: boolean;
  disabledPageFragment?: boolean;
  disabledMultiSelect?: boolean;
  alwaysMultiSelect?: boolean;
  canDropIn?: CanDropInFunction;
}
// #endregion SdkOptions

// #region SdkContext
/** service 之间互相访问的上下文，用懒 getter 解开循环依赖 */
export interface SdkContext {
  readonly reactivity: Reactivity;
  readonly storage: WebStorage;
  readonly editor: Editor;
  readonly props: Props;
  readonly history: History;
  readonly dataSource: DataSource;
  readonly codeBlock: CodeBlock;
  readonly dep: Dep;
  readonly events: Events;
  readonly componentList: ComponentList;

  readonly options: Readonly<SdkOptions>;
  /** 校验模式，可在运行时通过 `sdk.ctx.validateMode = ...` 切换 */
  validateMode: ValidateMode;
  /** 校验器，`createDslSdk` 之后可用 */
  validator: Validator;
  /** 登记表全部就绪后 resolve */
  ready: Promise<void>;
  parseDSL: (code: string) => any;
}
// #endregion SdkContext
