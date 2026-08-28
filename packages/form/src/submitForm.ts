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

import { type AppContext, type Component, createApp, defineComponent, h, nextTick, type Ref, ref, watch } from 'vue';

import { applyExtendState } from './utils/form';
import {
  submitForm as submitFormHeadless,
  type SubmitFormOptions,
  type SubmitFormResult,
  validateForm as validateFormHeadless,
  type ValidateFormOptions,
} from './utils/submitHeadless';
import Form from './Form.vue';
import { type ChangeRecord, type FormConfig } from './schema';

export type { SubmitFormOptions, SubmitFormResult, ValidateFormOptions };

// #region mountFormInstance
/**
 * 构造 wrapper 组件的工厂：在合适时机调用 MForm 实例方法并 resolve/reject、清理实例。
 *
 * 由调用方决定「等待 `initialized` 后自动执行」还是「等待人工触发」（`dialog: true`），
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
  /** 外部中断信号：abort 时会 reject 并卸载实例、移除容器，用于取消等待人工操作的挂载 */
  signal?: AbortSignal;
  /** 构造 wrapper 组件 */
  createWrapper: FormWrapperFactory<T>;
}

/**
 * `dialog: true` 时 submitForm / validateForm 的公共脚手架：
 *
 * 创建临时容器 → 挂载一个 wrapper 组件（内含 MForm）→ 提供统一的 cleanup / appContext 继承 →
 * 由 `createWrapper` 决定「何时调用 MForm 的哪个方法、如何 resolve/reject」。
 *
 * 挂载出来的表单等待人工点击，因此没有超时兜底，靠「确定」/「取消」/`signal` 结束。
 */
const mountFormInstance = <T>(options: MountFormInstanceOptions<T>): Promise<T> => {
  const { formProps, appContext, signal, createWrapper } = options;

  return new Promise<T>((resolve, reject) => {
    // 已中断则直接 reject，不创建任何容器/实例
    if (signal?.aborted) {
      reject(signal.reason ?? new Error('mountFormInstance aborted'));
      return;
    }

    let cleaned = false;
    let onAbort: (() => void) | null = null;
    // 用 holder 持有 app，使 cleanup 可在 app 创建之前定义（const app + 无 TDZ / 无 use-before-define）
    const instance: { app: ReturnType<typeof createApp> | null } = { app: null };

    const container = document.createElement('div');
    document.body.appendChild(container);

    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      if (signal && onAbort) {
        signal.removeEventListener('abort', onAbort);
        onAbort = null;
      }
      try {
        instance.app?.unmount();
      } catch {
        // ignore
      }
      container.parentNode?.removeChild(container);
    };

    // 支持外部通过 AbortSignal 主动中断：弹层无超时兜底，若调用方放弃了该 Promise，
    // 可通过 abort 卸载实例、移除遮罩/容器，避免无限驻留在 DOM 中。
    if (signal) {
      onAbort = () => {
        if (cleaned) return;
        reject(signal.reason ?? new Error('mountFormInstance aborted'));
        cleanup();
      };
      signal.addEventListener('abort', onAbort);
    }

    // 从容器创建到 mount 的全流程统一 try/catch：任一步骤（createWrapper/createApp/上下文合并/mount）
    // 抛错都会走到 cleanup，避免已插入 body 的 container 及未挂载的 app 残留导致泄漏。
    try {
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

      const app = createApp(wrapperComponent);
      instance.app = app;

      // 继承父级应用上下文（components / directives / provides / config 等）
      if (appContext) {
        Object.assign(app._context, appContext);
      }

      app.mount(container);
    } catch (err) {
      reject(err);
      cleanup();
    }
  });
};
// #endregion mountFormInstance

// #region createDialogWrapper
interface DialogWrapperOptions {
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
 * 构造可见弹层 wrapper：以 fixed 遮罩居中渲染 MForm，提供「确定 / 取消」按钮与错误展示区。
 *
 * submitForm 与 validateForm 的弹层 UI 完全一致，仅「确定」时调用的实例方法、错误处理与取消文案不同，
 * 这些差异通过 `onConfirm` / `onCancel` 注入，弹层结构在此统一收口。
 */
const createDialogWrapper = (options: DialogWrapperOptions): Component => {
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
// #endregion createDialogWrapper

/**
 * 可见弹层提交：把表单渲染在弹层里，点击「确定」才调用挂载实例的 `submitForm`。
 *
 * 用于需要用户填写/确认的场景；默认路径仍是无渲染校验（见 `submitForm` 的说明）。
 */
const submitFormByDialogRender = (options: SubmitFormOptions): Promise<any> => {
  const { native, appContext, returnChangeRecords, signal, dialog, title, ...formProps } = options;

  return mountFormInstance<any>({
    formProps,
    appContext,
    signal,
    createWrapper: ({ formRef, formProps, cleanup, resolve, reject }) => {
      // 执行一次提交：nextTick 等待子组件渲染 → 快照 changeRecords → 调用实例 submitForm → resolve
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

      return createDialogWrapper({
        formRef,
        formProps,
        name: 'MFormSubmitWrapper',
        title: title ?? 'submitForm',
        onConfirm: (setError) =>
          doSubmit((err) => {
            // 校验失败时保留弹层并展示错误，便于修正后重新提交
            setError(err instanceof Error ? err.message : String(err));
          }),
        onCancel: () => {
          reject(new Error('submitForm canceled.'));
          cleanup();
        },
      });
    },
  });
};

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
 * 可见弹层校验：把表单渲染在弹层里，点击「确定」才调用挂载实例的 `validate`。
 *
 * 用于需要用户填写/确认的场景；默认路径仍是无渲染校验（见 `validateForm` 的说明）。
 */
const validateFormByDialogRender = (options: ValidateFormOptions): Promise<string> => {
  const { appContext, config, signal, dialog, title, ...rest } = options;

  // 去掉 tab 容器各标签页的 lazy，确保懒加载标签页内的字段也参与校验
  const formProps = { ...rest, config: stripTabItemsLazy(config) };

  return mountFormInstance<string>({
    formProps,
    appContext,
    signal,
    createWrapper: ({ formRef, formProps, cleanup, resolve, reject }) => {
      // 执行一次校验：nextTick 等待子组件渲染 → 调用实例 validate → 通过则 resolve ''，失败则在弹层展示错误
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

      return createDialogWrapper({
        formRef,
        formProps,
        name: 'MFormValidateWrapper',
        title: title ?? 'validateForm',
        onConfirm: (setError) =>
          doValidate((error) => {
            // 校验失败时保留弹层并展示错误，便于修正后重新校验
            setError(error);
          }),
        onCancel: () => {
          reject(new Error('validateForm canceled.'));
          cleanup();
        },
      });
    },
  });
};

// #region headless
/**
 * 以命令式方式对一份「表单配置 + 值」做一次校验并取回表单值。
 *
 * 默认走无渲染实现（见 `@tmagic/form/headless`）。`dialog: true` 会把表单以弹层渲染出来。
 */
export const submitForm = async (options: SubmitFormOptions): Promise<any> => {
  if (options.dialog) return submitFormByDialogRender(options);
  return submitFormHeadless(options);
};

/**
 * 以命令式方式对一份「表单配置 + 值」做一次静默校验。
 *
 * 默认走无渲染实现。`dialog: true` 的处理详见 `submitForm`。
 */
export const validateForm = async (options: ValidateFormOptions): Promise<string> => {
  if (options.dialog) return validateFormByDialogRender(options);
  return validateFormHeadless(options);
};
// #endregion headless
