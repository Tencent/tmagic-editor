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
 * @fileoverview `@tmagic/editor/sdk`：不依赖 DOM 的 DSL 操作 SDK。
 *
 * 每次调用 {@link createDslSdk} 得到一组独立的 service（editor / history / props / dataSource /
 * codeBlock / dep / storage / events / componentList），可在 Node 中运行。浏览器端的
 * `editorService` 等单例就是用同一个工厂创建的默认实例。
 *
 * @module @tmagic/editor/sdk
 */

import { nextTick, reactive, shallowReactive, toRaw } from 'vue';
import { cloneDeep, isEmpty } from 'lodash-es';

import type { MApp } from '@tmagic/core';

import type { PersistedHistoryState } from '@editor/type';

import CodeBlock from './services/CodeBlock';
import ComponentList from './services/ComponentList';
import DataSource from './services/DataSource';
import Dep from './services/Dep';
import Editor from './services/Editor';
import Events from './services/Events';
import History from './services/History';
import Props from './services/Props';
import WebStorage from './services/WebStorage';
import type { Reactivity, SdkContext, SdkOptions } from './type';
import { createValidator, type Validator } from './validate';
import { bindWiring, whenWiringSettled, type WiringHandle } from './wiring';

const SERVICE_NAMES = [
  'editor',
  'props',
  'history',
  'dataSource',
  'codeBlock',
  'dep',
  'storage',
  'events',
  'componentList',
] as const;

/**
 * Node 下默认的 DSL 反序列化：序列化出来的内容是被括号包起来的 JSON（函数、正则等需要自己传入 `parseDSL`）。
 * 刻意不使用 `eval`，避免执行调用方传入的历史快照里的任意代码。
 */
export const defaultParseDSL = (code: string): any => {
  const text = code.trim();
  const body = text.startsWith('(') && text.endsWith(')') ? text.slice(1, -1) : text;
  try {
    return JSON.parse(body);
  } catch (e: any) {
    throw new Error(
      `默认的 parseDSL 只能解析 JSON，无法还原含函数 / undefined 等的内容（${e?.message ?? e}）；请在 createDslSdk 的 parseDSL 选项中传入自己的实现`,
    );
  }
};

export interface DslSdk {
  readonly editor: Editor;
  readonly history: History;
  readonly props: Props;
  readonly dataSource: DataSource;
  readonly codeBlock: CodeBlock;
  readonly dep: Dep;
  readonly storage: WebStorage;
  readonly events: Events;
  readonly componentList: ComponentList;
  readonly validate: Validator;
  readonly ctx: SdkContext;

  /** 登记表（组件属性配置等，其中一部分是异步填充的）全部就绪后 resolve */
  ready: Promise<void>;

  /** 导出当前 DSL（深拷贝，含依赖收集结果） */
  getDsl(): MApp | null;
  /** 整体替换 DSL，会按 `set root` 的语义写入历史记录 */
  setDsl(dsl: MApp | null): Promise<void>;
  /** 绑定依赖收集连线；`autoWiring` 为 true 时创建时已绑定。返回解绑函数 */
  bindWiring(): () => void;
  /** 导出历史快照，下次 `createDslSdk({ history })` 时传回即可恢复 */
  serializeHistory(): PersistedHistoryState;
  destroy(): void;
}

type Services = Pick<
  SdkContext,
  'editor' | 'props' | 'history' | 'dataSource' | 'codeBlock' | 'dep' | 'storage' | 'events' | 'componentList'
>;

/** 把 options 里的登记表写入各 service，返回需要等待的异步任务（如属性表单配置） */
const registerOptions = (
  { editor, props, events, componentList, dataSource }: Services,
  options: SdkOptions,
): Promise<unknown>[] => {
  if (options.componentGroupList) componentList.setList(options.componentGroupList);
  if (options.datasourceList) dataSource.set('datasourceTypeList', options.datasourceList);

  props.setDisabledCodeBlock(options.disabledCodeBlock ?? false);
  props.setDisabledDataSource(options.disabledDataSource ?? false);

  const pending = [props.setPropsConfigs(options.propsConfigs ?? {}), props.setPropsValues(options.propsValues ?? {})];

  const eventMethodList = Object.entries(options.eventMethodList ?? {});
  events.setEvents(Object.fromEntries(eventMethodList.map(([type, item]) => [type, item.events])));
  events.setMethods(Object.fromEntries(eventMethodList.map(([type, item]) => [type, item.methods])));

  for (const [type, config] of Object.entries(options.datasourceConfigs ?? {})) {
    dataSource.setFormConfig(type, config);
  }
  for (const [type, value] of Object.entries(options.datasourceValues ?? {})) {
    dataSource.setFormValue(type, value);
  }
  for (const [type, item] of Object.entries(options.datasourceEventMethodList ?? {})) {
    dataSource.setFormEvent(type, item.events);
    dataSource.setFormMethod(type, item.methods);
  }

  editor.set('disabledMultiSelect', options.disabledMultiSelect ?? false);
  editor.set('alwaysMultiSelect', options.alwaysMultiSelect ?? false);
  editor.setConfig({
    disabledPageFragment: options.disabledPageFragment ?? false,
    canDropIn: options.canDropIn,
  });

  return pending;
};

/**
 * 创建一个相互连线、互相独立的 DSL SDK 实例。
 *
 * @param options 见 {@link SdkOptions}
 */
export const createDslSdk = (options: SdkOptions = {}): DslSdk => {
  const reactivity: Reactivity = {
    // Vue 的 reactive 返回 Reactive<T>，与接口中的 T 类型不完全一致，这里做断言

    reactive: reactive as Reactivity['reactive'],

    shallowReactive: shallowReactive as Reactivity['shallowReactive'],
    toRaw,
    nextTick,
    ...options.reactivity,
  };
  const parseDSL = options.parseDSL ?? defaultParseDSL;

  // service 之间互相访问用懒 getter，构造期互不依赖，从而解开 editor <-> props / history 的循环
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const services = {} as { -readonly [K in keyof Services]: Services[K] };

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const ctx = {
    reactivity,
    options,
    validateMode: options.validateMode ?? 'strict',
    parseDSL: (code: string) => parseDSL(code),
    ready: Promise.resolve(),
  } as SdkContext;

  for (const name of SERVICE_NAMES) {
    Object.defineProperty(ctx, name, { get: () => services[name], enumerable: true });
  }

  services.storage = new WebStorage(ctx, options.storage);
  services.history = new History(ctx);
  services.props = new Props(ctx);
  services.events = new Events(ctx);
  services.componentList = new ComponentList(ctx);
  services.dep = new Dep(ctx);
  services.codeBlock = new CodeBlock(ctx);
  services.dataSource = new DataSource(ctx);
  services.editor = new Editor(ctx);

  const { editor, history } = services;

  const validate = createValidator(ctx);
  ctx.validator = validate;

  const pending = registerOptions(services, options);

  let wiring: WiringHandle | null = null;
  const unbind = () => {
    wiring?.unbind();
    wiring = null;
  };
  const bind = () => {
    wiring ??= bindWiring(ctx);
    return unbind;
  };

  if (options.autoWiring ?? true) {
    bind();
  }

  // 先恢复历史再设置 root：恢复出的初始基线不会被 set root 重复创建
  if (options.history) {
    history.restore(options.history);
  }

  const setDsl = async (dsl: MApp | null) => {
    editor.set('root', dsl ? cloneDeep(dsl) : null);
    await whenWiringSettled(ctx);
  };

  if (options.dsl) {
    pending.push(setDsl(options.dsl));
  }

  ctx.ready = Promise.all(pending).then(() => undefined);

  return {
    ...services,
    validate,
    ctx,
    get ready() {
      return ctx.ready;
    },
    getDsl() {
      const root = reactivity.toRaw(editor.get('root'));
      return root && !isEmpty(root) ? cloneDeep(root) : null;
    },
    setDsl,
    bindWiring: bind,
    serializeHistory: () => history.serialize({ jsonSafe: true }),
    destroy() {
      unbind();
      for (const service of Object.values(services)) {
        service.destroy();
      }
    },
  };
};

export { default as BaseService } from './services/BaseService';
export { default as CodeBlockService } from './services/CodeBlock';
export { default as ComponentListService } from './services/ComponentList';
export { default as DataSourceService } from './services/DataSource';
export { default as DepService } from './services/Dep';
export { default as EditorService } from './services/Editor';
export { default as EventsService } from './services/Events';
export { default as HistoryService } from './services/History';
export { default as PropsService } from './services/Props';
export { default as StorageService, MemoryStorage, Protocol } from './services/WebStorage';
export * from './type';
export * from './validate';
export * from './wiring';
