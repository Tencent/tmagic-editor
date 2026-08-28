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
 * 表单校验相关单测（validateValues / submitForm / validateForm）共用的脚手架。
 *
 * submitForm 与 validateForm 共用同一套实现（无渲染优先、dialog 弹层），
 * 因此定位弹层按钮、mock MForm 实例方法、模拟无 DOM 环境这些操作在各份用例里完全一致，
 * 统一收口在此。
 */
import { type AppContext, createApp, defineComponent, h } from 'vue';
import MagicForm from '@form/index';
import ElementPlus from 'element-plus';

/** 必填规则 */
export const required = (message = '必填') => [{ required: true, message }] as any;

/**
 * 构造一个装好 element-plus 与 m-form 的父级 app，返回其 appContext。
 *
 * dialog 弹层会真实挂载表单，需要这些全局注册。
 */
export const createFormAppContext = (register?: (_app: ReturnType<typeof createApp>) => void): AppContext => {
  const parentApp = createApp(defineComponent({ render: () => h('div') }));
  parentApp.use(ElementPlus);
  parentApp.use(MagicForm);
  register?.(parentApp);
  return parentApp._context;
};

/** 按文案定位调试弹层的按钮（「确定」/「取消」） */
export const findButton = (text: string): HTMLButtonElement =>
  Array.from(document.body.querySelectorAll('button')).find(
    (b) => (b.textContent || '').trim() === text,
  ) as HTMLButtonElement;

/**
 * 通过 Vue 渲染留下的内部指针定位 MForm 组件实例。
 *
 * 真实 element-plus 校验在 jsdom 下不可靠（form-item 未注册到 form），
 * 因此 dialog 弹层的校验失败分支只能通过 mock 实例方法来验证。
 */
export const findMFormInstance = (): any => {
  const formEl = document.body.querySelector('.m-form') as any;
  let comp: any = formEl?.__vueParentComponent;
  while (comp && comp.type?.name !== 'MForm' && comp.type?.__name !== 'MForm') comp = comp.parent;
  return comp;
};

/** 替换 MForm 实例 expose 出来的方法 */
export const mockExposed = (comp: any, method: string, fn: any): void => {
  Object.defineProperty(comp.exposed, method, { value: fn, configurable: true, writable: true });
};

/** 在「没有 document」的环境下执行 fn，用于模拟纯 Node 运行时 */
export const withoutDocument = async <T>(fn: () => Promise<T>): Promise<T> => {
  const originalDocument = globalThis.document;
  delete (globalThis as any).document;
  try {
    return await fn();
  } finally {
    (globalThis as any).document = originalDocument;
  }
};

/** 捕获 fn 抛出的异常（用于断言 reject 的具体内容） */
export const captureError = async (fn: () => Promise<unknown>): Promise<any> => {
  try {
    await fn();
  } catch (e) {
    return e;
  }
  return null;
};
