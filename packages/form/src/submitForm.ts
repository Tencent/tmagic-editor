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

import {
  type AppContext,
  type Component,
  createApp,
  defineComponent,
  h,
  nextTick,
  provide,
  type Ref,
  ref,
  watch,
} from 'vue';

import { applyExtendState } from './utils/form';
import Form from './Form.vue';
import { type ChangeRecord, FORM_SILENT_MODE_KEY, type FormConfig, type FormState } from './schema';

// #region SubmitFormOptions
/**
 * submitForm 函数参数（与 Form.vue 组件 props 对齐）
 */
export interface SubmitFormOptions {
  /** 表单配置 */
  config: FormConfig;
  /** 表单初始值 */
  initValues?: Record<string, any>;
  /** 需对比的值（开启对比模式时传入） */
  lastValues?: Record<string, any>;
  /** 是否开启对比模式 */
  isCompare?: boolean;
  parentValues?: Record<string, any>;
  labelWidth?: string;
  disabled?: boolean;
  height?: string;
  stepActive?: string | number;
  size?: 'small' | 'default' | 'large';
  inline?: boolean;
  labelPosition?: string;
  keyProp?: string;
  popperClass?: string;
  preventSubmitDefault?: boolean;
  /**
   * 表单校验失败时，错误提示前缀是否使用字段的 text 文案（通过 `getTextByName` 从 config 中查找）。
   * 默认 `true`，置为 `false` 时直接使用字段 name。
   */
  useFieldTextInError?: boolean;
  extendState?: (_state: FormState) => Record<string, any> | Promise<Record<string, any>>;
  /** 透传给 Form.submitForm 的参数：是否直接返回原始响应式 values */
  native?: boolean;
  /**
   * 是否在 resolve 结果中携带 changeRecords（变更记录）。
   * 开启后 resolve 的结果为 `{ values, changeRecords }`，否则仅 resolve values。
   */
  returnChangeRecords?: boolean;
  /**
   * 父级应用上下文，用于继承全局组件、指令、provide 等。
   * 通常通过 `app._context` 或 `getCurrentInstance()?.appContext` 获取。
   */
  appContext?: AppContext | null;
  /** 等待表单初始化的最长时间（毫秒），超时将以错误 reject。默认 10000ms */
  timeout?: number;
  /**
   * 调试模式。默认 `false`。
   *
   * - `false`：表单以隐藏方式挂载，初始化完成后自动提交（原有行为）。
   * - `true`：将表单以弹层形式可见地渲染在页面上，需手动点击「确定」才会触发校验/提交，
   *   点击「取消」则以 reject 中断；校验失败时保留弹层并展示错误信息，便于修正后重试。
   *   调试模式下 `timeout` 不生效（等待人工操作）。
   */
  debug?: boolean;
  typeMatchValid?: boolean;
}
// #endregion SubmitFormOptions

// #region SubmitFormResult
/**
 * 开启 `returnChangeNodes` 时 submitForm 的返回结果
 */
export interface SubmitFormResult {
  /** 校验通过后的表单值 */
  values: any;
  /** 表单变更记录 */
  changeRecords: ChangeRecord[];
}
// #endregion SubmitFormResult

// #region mountFormInstance
/**
 * 构造 wrapper 组件的工厂：在合适时机调用 MForm 实例方法并 resolve/reject、清理实例。
 *
 * 由调用方决定「等待 `initialized` 后自动执行」还是「等待人工触发」（debug 模式），
 * 以及「调用 `submitForm` 还是 `validate`」「结果如何包装」，从而复用公共脚手架。
 */
type FormWrapperFactory<T> = (ctx: {
  /** 透传给 Form 组件的 props（由工厂统一注入，避免调用方重复闭包） */
  formProps: Record<string, any>;
  /** 指向挂载的 MForm 实例 */
  formRef: Ref<any>;
  /** 卸载实例并移除容器，resolve/reject 后必须调用以避免泄漏 */
  cleanup: () => void;
  /** resolve 外层 Promise */
  resolve: (value: T | PromiseLike<T>) => void;
  /** reject 外层 Promise */
  reject: (reason?: any) => void;
}) => Component;

interface MountFormInstanceOptions<T> {
  /** 透传给 Form 组件的 props */
  formProps: Record<string, any>;
  /** 父级应用上下文，用于继承全局组件、指令、provide 等 */
  appContext?: AppContext | null;
  /** 等待表单初始化的最长时间（毫秒），<=0 表示不注册超时 */
  timeout: number;
  /** 超时 reject 的错误文案 */
  timeoutMessage: string;
  /** 是否以 `display:none` 隐藏容器。调试模式需可见，应传 `false` */
  hidden?: boolean;
  /** 是否跳过超时注册。调试模式等待人工操作，应传 `true` */
  skipTimeout?: boolean;
  /** 构造 wrapper 组件 */
  createWrapper: FormWrapperFactory<T>;
}

/**
 * submitForm / validateForm 的公共脚手架：
 *
 * 创建临时容器 → 挂载一个 wrapper 组件（内含 MForm）→ 提供统一的 cleanup / timeout / appContext 继承 →
 * 由 `createWrapper` 决定「何时调用 MForm 的哪个方法、如何 resolve/reject」。
 *
 * 调用方只需关注差异逻辑（调用 `submitForm` 还是 `validate`、结果如何包装、是否需要调试弹层），
 * 容器创建、卸载、超时、上下文注入等模板代码在此统一收口。
 */
const mountFormInstance = <T>(options: MountFormInstanceOptions<T>): Promise<T> => {
  const { formProps, appContext, timeout, timeoutMessage, hidden = true, skipTimeout = false, createWrapper } = options;

  return new Promise<T>((resolve, reject) => {
    const container = document.createElement('div');
    if (hidden) {
      container.style.display = 'none';
    }
    document.body.appendChild(container);

    let cleaned = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    // 用 holder 持有 app，使 cleanup 可在 app 创建之前定义（const app + 无 TDZ / 无 use-before-define）
    const instance: { app: ReturnType<typeof createApp> | null } = { app: null };

    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      try {
        instance.app?.unmount();
      } catch {
        // ignore
      }
      container.parentNode?.removeChild(container);
    };

    const formRef = ref<any>(null);

    // 将 extendState 从 formProps 中剥离：不由 Form.vue 的 async watchEffect 异步应用，
    // 而是在 wrapper 中通过 sync watch 在 formRef 就绪后直接写入 formState，
    // 避免 display 等 filterFunction 在首次渲染时读到 undefined。
    // 与 CompareForm / FormPanel 中「formRef.value.formState.services = ...」的做法一致。
    const { extendState, ...restFormProps } = formProps;

    const userWrapper = createWrapper({ formRef, formProps: restFormProps, cleanup, resolve, reject });

    const wrapperComponent =
      typeof extendState === 'function'
        ? defineComponent({
            name: 'MFormExtendStateInjector',
            setup() {
              watch(
                () => formRef.value,
                (form) => {
                  if (!form) return;
                  let result: any;
                  try {
                    result = extendState(form.formState);
                  } catch (e) {
                    console.error('[MForm] extendState failed:', e);
                    return;
                  }
                  // formState 的内置 key 快照：在 extendState 合并前捕获，
                  // 供 applyExtendState 禁止 extendState 覆盖这些已有字段（只能新增），
                  // 与 Form.vue 中 reservedStateKeys 的语义保持一致。
                  const reservedStateKeys = new Set<string | symbol>(Reflect.ownKeys(form.formState));
                  // 合并逻辑收口在 applyExtendState：props 派生的只读 getter 字段
                  // （keyProp 等）以普通字段形式返回时会被跳过并告警，避免 proxy set 抛错
                  const apply = (state: Record<string, any> | null | undefined) =>
                    applyExtendState(form.formState, state, reservedStateKeys);
                  if (result && typeof result.then === 'function') {
                    result.then(apply, (e: any) => console.error('[MForm] extendState failed:', e));
                  } else {
                    apply(result);
                  }
                },
                { flush: 'sync', immediate: true },
              );
              return () => h(userWrapper);
            },
          })
        : userWrapper;

    // 静默（隐藏挂载）模式下注入静默标记：vs-code 等重型字段组件可据此跳过自身渲染，
    // 校验/取值依赖 FormItem 与 model 值，与叶子 UI 组件无关（见 FORM_SILENT_MODE_KEY 注释）。
    // 用组件级 provide 而非 app.provide：appContext 合并后 app._context.provides 与父级应用
    // 共享引用，app.provide 会把标记泄漏到父级应用。
    const rootComponent = hidden
      ? defineComponent({
          name: 'MFormSilentProvider',
          setup() {
            provide(FORM_SILENT_MODE_KEY, true);
            return () => h(wrapperComponent);
          },
        })
      : wrapperComponent;

    const app = createApp(rootComponent);
    instance.app = app;

    // 继承父级应用上下文（components / directives / provides / config 等）
    if (appContext) {
      Object.assign(app._context, appContext);
    }

    if (timeout > 0 && !skipTimeout) {
      timer = setTimeout(() => {
        if (!cleaned) {
          reject(new Error(timeoutMessage));
          cleanup();
        }
      }, timeout);
    }

    try {
      app.mount(container);
    } catch (err) {
      reject(err);
      cleanup();
    }
  });
};
// #endregion mountFormInstance

// #region createDebugWrapper
interface DebugWrapperOptions {
  /** 指向挂载的 MForm 实例 */
  formRef: Ref<any>;
  /** 透传给 Form 组件的 props */
  formProps: Record<string, any>;
  /** 弹层标题 */
  title: string;
  /** wrapper 组件名 */
  name: string;
  /**
   * 点击「确定」触发；接收 `setError`，校验失败时可调用以在弹层展示错误并保留弹层供修正后重试，
   * 校验通过则由调用方自行 resolve + cleanup。
   */
  onConfirm: (setError: (msg: string) => void) => void | Promise<void>;
  /** 点击「取消」触发（通常 reject + cleanup） */
  onCancel: () => void;
}

/**
 * 构造调试模式下的可见弹层 wrapper：以 fixed 遮罩居中渲染 MForm，提供「确定 / 取消」按钮与错误展示区。
 *
 * submitForm 与 validateForm 的调试弹层 UI 完全一致，仅「确定」时调用的实例方法、错误处理与取消文案不同，
 * 这些差异通过 `onConfirm` / `onCancel` 注入，弹层结构在此统一收口。
 */
const createDebugWrapper = (options: DebugWrapperOptions): Component => {
  const { formRef, formProps, title, name, onConfirm, onCancel } = options;

  const btnBase = {
    padding: '8px 20px',
    fontSize: '14px',
    lineHeight: '1',
    border: '1px solid #dcdfe6',
    borderRadius: '4px',
    cursor: 'pointer',
  };

  return defineComponent({
    name,
    setup() {
      // 校验失败信息展示区
      const errorMsg = ref('');
      const setError = (msg: string) => {
        errorMsg.value = msg;
      };

      return () =>
        h(
          'div',
          {
            style: {
              position: 'fixed',
              inset: '0',
              zIndex: '10000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.5)',
            },
          },
          [
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  width: '600px',
                  maxWidth: '90vw',
                  maxHeight: '85vh',
                  background: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                  overflow: 'hidden',
                },
              },
              [
                h(
                  'div',
                  {
                    style: {
                      padding: '16px 20px',
                      fontSize: '16px',
                      fontWeight: '600',
                      borderBottom: '1px solid #ebeef5',
                    },
                  },
                  title,
                ),
                h(
                  'div',
                  {
                    style: {
                      flex: '1',
                      padding: '20px',
                      overflow: 'auto',
                    },
                  },
                  [
                    h(Form as Component, { ...formProps, ref: formRef }),
                    errorMsg.value
                      ? h('div', {
                          style: {
                            marginTop: '12px',
                            color: '#f56c6c',
                            fontSize: '13px',
                            lineHeight: '1.5',
                          },
                          innerHTML: errorMsg.value,
                        })
                      : null,
                  ],
                ),
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '12px',
                      padding: '12px 20px',
                      borderTop: '1px solid #ebeef5',
                    },
                  },
                  [
                    h('button', { type: 'button', onClick: onCancel, style: { ...btnBase } }, '取消'),
                    h(
                      'button',
                      {
                        type: 'button',
                        onClick: () => onConfirm(setError),
                        style: {
                          ...btnBase,
                          color: '#fff',
                          background: '#409eff',
                          borderColor: '#409eff',
                        },
                      },
                      '确定',
                    ),
                  ],
                ),
              ],
            ),
          ],
        );
    },
  });
};
// #endregion createDebugWrapper

/**
 * 以命令式方式调用 Form.vue 完成一次表单校验/提交。
 *
 * 类似 ElMessage 的用法：传入 props（包含 `config`/`initValues` 等），函数内部会临时挂载
 * 一个不可见的 Form 组件实例，等待初始化完成后调用其 `submitForm` 方法，
 * 校验通过则 resolve 表单值，校验失败则 reject 错误信息，最后自动卸载实例。
 *
 * @example
 * ```ts
 * import { submitForm } from '@tmagic/form';
 *
 * try {
 *   const values = await submitForm({
 *     config: [...],
 *     initValues: { name: 'foo' },
 *   });
 *   console.log(values);
 * } catch (e) {
 *   console.error(e);
 * }
 *
 * // 需要同时获取变更记录时：
 * const { values, changeRecords } = await submitForm({
 *   config: [...],
 *   initValues: { name: 'foo' },
 *   returnChangeRecords: true,
 * });
 *
 * // 调试模式：可见地渲染表单，点击「确定」才提交：
 * const values = await submitForm({
 *   config: [...],
 *   initValues: { name: 'foo' },
 *   debug: true,
 * });
 * ```
 */
export const submitForm = (options: SubmitFormOptions): Promise<any> => {
  const { native, appContext, timeout = 10000, returnChangeRecords, debug = false, ...formProps } = options;

  return mountFormInstance<any>({
    formProps,
    appContext,
    timeout,
    // 调试模式需把表单展示出来；普通模式隐藏挂载
    hidden: !debug,
    // 调试模式等待人工操作，不应用超时
    skipTimeout: debug,
    timeoutMessage: `submitForm timeout after ${timeout}ms: form is not initialized.`,
    createWrapper: ({ formRef, formProps, cleanup, resolve, reject }) => {
      /**
       * 执行一次提交：nextTick 等待子组件渲染 → 快照 changeRecords → 调用实例 submitForm → resolve。
       * 校验失败时交给 `onValidateError` 决定「保留弹层展示错误（debug）」还是「reject 并清理（普通）」，
       * 从而让 debug 与普通模式共享同一份提交逻辑。
       */
      const doSubmit = async (onValidateError: (err: any) => void) => {
        try {
          // 等待子组件（FormItem 等）完成首次渲染，确保 validate 能拿到所有字段
          await nextTick();
          // submitForm 校验通过后会清空 changeRecords，需在调用前先做快照
          const changeRecords: ChangeRecord[] = [...(formRef.value?.changeRecords ?? [])];
          const result = await formRef.value.submitForm(native);
          resolve(returnChangeRecords ? { values: result, changeRecords } : result);
          cleanup();
        } catch (err) {
          onValidateError(err);
        }
      };

      // 调试模式：可见地渲染表单，点击「确定」才提交，点击「取消」则中断
      if (debug) {
        return createDebugWrapper({
          formRef,
          formProps,
          name: 'MFormSubmitWrapper',
          title: 'submitForm 调试',
          onConfirm: (setError) =>
            doSubmit((err) => {
              // 校验失败时保留弹层并展示错误，便于修正后重新提交
              setError(err instanceof Error ? err.message : String(err));
            }),
          onCancel: () => {
            reject(new Error('submitForm canceled in debug mode.'));
            cleanup();
          },
        });
      }

      // 普通模式：表单初始化完成后自动提交
      return defineComponent({
        name: 'MFormSubmitWrapper',
        setup() {
          const stop = watch(
            () => formRef.value?.initialized,
            (initialized) => {
              if (!initialized) return;
              stop();
              doSubmit((err) => {
                reject(err);
                cleanup();
              });
            },
            { flush: 'post', immediate: true },
          );

          return () => h(Form as Component, { ...formProps, ref: formRef });
        },
      });
    },
  });
};

// #region ValidateFormOptions
/**
 * validateForm 函数参数（与 Form.vue 组件 props 对齐，取校验所需子集）
 */
export interface ValidateFormOptions {
  /** 表单配置 */
  config: FormConfig;
  /** 待校验的表单值 */
  initValues?: Record<string, any>;
  parentValues?: Record<string, any>;
  labelWidth?: string;
  keyProp?: string;
  /**
   * 校验失败时，错误提示前缀是否使用字段的 text 文案（通过 `getTextByName` 从 config 中查找）。
   * 默认 `true`，置为 `false` 时直接使用字段 name。
   */
  useFieldTextInError?: boolean;
  extendState?: (_state: FormState) => Record<string, any> | Promise<Record<string, any>>;
  /**
   * 父级应用上下文，用于继承全局组件、指令、provide 等。
   * 通常通过 `app._context` 或 `getCurrentInstance()?.appContext` 获取。
   */
  appContext?: AppContext | null;
  /** 等待表单初始化的最长时间（毫秒），超时将以错误 reject。默认 10000ms */
  timeout?: number;
  /**
   * 调试模式。默认 `false`。
   *
   * - `false`：以隐藏方式挂载，初始化完成后自动校验并 resolve 错误文案（原有静默行为）。
   * - `true`：将表单以弹层形式可见地渲染在页面上，需手动点击「确定」才会触发校验，
   *   点击「取消」则以 reject 中断；校验失败时在弹层内展示错误信息并保留弹层，便于修正后重试，
   *   校验通过则 resolve 空字符串。调试模式下 `timeout` 不生效（等待人工操作）。
   */
  debug?: boolean;
  typeMatchValid?: boolean;
}
// #endregion ValidateFormOptions

// #region stripTabLazy
/**
 * 深拷贝配置值，保留函数（display / onTabClick 等回调）引用，避免破坏配置中的回调。
 */
const cloneConfigValue = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map(cloneConfigValue);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).reduce<Record<string, any>>((acc, key) => {
      acc[key] = cloneConfigValue(value[key]);
      return acc;
    }, {});
  }
  return value;
};

/**
 * 深度遍历配置，去掉所有 type 为 'tab' 的容器中各标签页（items）的 lazy 配置。
 */
const removeTabItemsLazy = (node: any): void => {
  if (Array.isArray(node)) {
    node.forEach(removeTabItemsLazy);
    return;
  }
  if (!node || typeof node !== 'object') return;

  if (node.type === 'tab' && Array.isArray(node.items)) {
    node.items.forEach((pane: any) => {
      if (pane && typeof pane === 'object') {
        delete pane.lazy;
      }
    });
  }

  Object.keys(node).forEach((key) => {
    removeTabItemsLazy(node[key]);
  });
};

/**
 * 返回一份去除了 tab 标签页 lazy 的配置副本。
 *
 * tab 容器开启 lazy 时，非激活标签页的内容不会渲染，导致 validateForm 静默挂载后
 * 无法校验到这些标签页内的字段。校验场景需要一次性渲染全部字段，故在此统一去除 lazy。
 * 处理基于深拷贝，不会污染调用方传入的原始 config。
 */
export const stripTabItemsLazy = (config: FormConfig): FormConfig => {
  const cloned = cloneConfigValue(config);
  removeTabItemsLazy(cloned);
  return cloned;
};
// #endregion stripTabLazy

/**
 * 以命令式方式对一份「表单配置 + 值」做一次静默校验，**不依赖也不影响任何已渲染的表单**。
 *
 * 与 `submitForm` 类似，内部会临时挂载一个不可见的 MForm 实例，等待其初始化完成后调用
 * 实例的 `validate` 方法，返回汇总后的错误文案，随后自动卸载实例。
 *
 * 与 `submitForm` 的区别：
 * - 「静默」：校验失败不抛异常、不触发 `error` 事件、不返回表单值；
 * - 仅用于「探测」配置是否合法，适合源码保存后校验、批量校验组件配置等场景。
 *
 * 由于每次都新建一个独立的 MForm 实例，调用方无需持有任何表单 ref，也不会污染
 * 页面上正在展示的表单状态。
 *
 * @returns 校验通过返回空字符串 `''`，否则返回以 `<br>` 拼接的错误文案。
 *   仅在初始化超时或挂载失败等异常情况下才会 reject。
 *
 * @example
 * ```ts
 * import { validateForm } from '@tmagic/form';
 *
 * const error = await validateForm({
 *   config: [...],
 *   initValues: { name: 'foo' },
 *   appContext: getCurrentInstance()?.appContext,
 * });
 * if (error) {
 *   // 配置不合法，error 为错误文案
 * }
 *
 * // 调试模式：可见地渲染表单，点击「确定」才校验，校验失败保留弹层可修正重试：
 * const error = await validateForm({
 *   config: [...],
 *   initValues: { name: 'foo' },
 *   debug: true,
 * });
 * ```
 */
export const validateForm = (options: ValidateFormOptions): Promise<string> => {
  const { appContext, timeout = 10000, debug = false, config, ...rest } = options;

  // 去掉 tab 容器各标签页的 lazy，确保懒加载标签页内的字段也参与校验
  const formProps = { ...rest, config: stripTabItemsLazy(config) };

  return mountFormInstance<string>({
    formProps,
    appContext,
    timeout,
    // 调试模式需把表单展示出来；普通模式隐藏挂载
    hidden: !debug,
    // 调试模式等待人工操作，不应用超时
    skipTimeout: debug,
    timeoutMessage: `validateForm timeout after ${timeout}ms: form is not initialized.`,
    createWrapper: ({ formRef, formProps, cleanup, resolve, reject }) => {
      /**
       * 执行一次校验：nextTick 等待子组件渲染 → 调用实例 validate → 通过则 resolve ''。
       * 校验失败（返回非空错误文案）时交给 `onInvalid` 决定「静默 resolve 错误文案（普通）」
       * 还是「在弹层展示错误并保留供重试（debug）」，从而让两种模式共享同一份校验逻辑。
       */
      const doValidate = async (onInvalid: (error: string) => void) => {
        try {
          // 等待子组件（FormItem 等）完成首次渲染，确保 validate 能拿到所有字段
          await nextTick();
          // 复用 Form.vue 实例的静默校验方法：校验通过返回 ''，失败返回错误文案，均不抛异常
          const error = await formRef.value.validate();
          if (error) {
            onInvalid(error);
          } else {
            resolve('');
            cleanup();
          }
        } catch (err) {
          reject(err);
          cleanup();
        }
      };

      // 调试模式：可见地渲染表单，点击「确定」才校验，点击「取消」则中断
      if (debug) {
        return createDebugWrapper({
          formRef,
          formProps,
          name: 'MFormValidateWrapper',
          title: 'validateForm 调试',
          onConfirm: (setError) =>
            doValidate((error) => {
              // 校验失败时保留弹层并展示错误，便于修正后重新校验
              setError(error);
            }),
          onCancel: () => {
            reject(new Error('validateForm canceled in debug mode.'));
            cleanup();
          },
        });
      }

      // 普通模式：表单初始化完成后自动校验（静默 resolve 错误文案）
      return defineComponent({
        name: 'MFormValidateWrapper',
        setup() {
          const stop = watch(
            () => formRef.value?.initialized,
            (initialized) => {
              if (!initialized) return;
              stop();
              doValidate((error) => {
                // 静默：校验失败也以错误文案 resolve（不抛异常）
                resolve(error);
                cleanup();
              });
            },
            { flush: 'post', immediate: true },
          );

          return () => h(Form as Component, { ...formProps, ref: formRef });
        },
      });
    },
  });
};
