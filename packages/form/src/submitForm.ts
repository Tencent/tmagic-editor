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

import { type AppContext, type Component, createApp, defineComponent, h, nextTick, ref, watch } from 'vue';

import Form from './Form.vue';
import type { ChangeRecord, FormConfig, FormState } from './schema';

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
}
// #endregion SubmitFormOptions

// #region SubmitFormResult
/**
 * 开启 `returnChangeRecords` 时 submitForm 的返回结果
 */
export interface SubmitFormResult {
  /** 校验通过后的表单值 */
  values: any;
  /** 表单变更记录 */
  changeRecords: ChangeRecord[];
}
// #endregion SubmitFormResult

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

  return new Promise((resolve, reject) => {
    const container = document.createElement('div');
    // 调试模式下需要把表单展示出来，普通模式则隐藏挂载
    if (!debug) {
      container.style.display = 'none';
    }
    document.body.appendChild(container);

    let cleaned = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const wrapperComponent = defineComponent({
      name: 'MFormSubmitWrapper',
      setup() {
        const formRef = ref<any>(null);
        // 调试模式下用于展示校验失败信息
        const errorMsg = ref('');

        const doSubmit = async () => {
          try {
            // 等待子组件（FormItem 等）完成首次渲染，确保 validate 能拿到所有字段
            await nextTick();
            // submitForm 校验通过后会清空 changeRecords，需在调用前先做快照
            const changeRecords: ChangeRecord[] = [...(formRef.value?.changeRecords ?? [])];
            const result = await formRef.value.submitForm(native);
            resolve(returnChangeRecords ? { values: result, changeRecords } : result);
            cleanup();
          } catch (err) {
            // 调试模式下校验失败时保留弹层并展示错误，便于修正后重新提交
            if (debug) {
              errorMsg.value = err instanceof Error ? err.message : String(err);
              return;
            }
            reject(err);
            cleanup();
          }
        };

        // 调试模式：可见地渲染表单，点击「确定」才提交，点击「取消」则中断
        if (debug) {
          const handleCancel = () => {
            reject(new Error('submitForm canceled in debug mode.'));
            cleanup();
          };

          const btnBase = {
            padding: '8px 20px',
            fontSize: '14px',
            lineHeight: '1',
            border: '1px solid #dcdfe6',
            borderRadius: '4px',
            cursor: 'pointer',
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
                      'submitForm 调试',
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
                        h('button', { type: 'button', onClick: handleCancel, style: { ...btnBase } }, '取消'),
                        h(
                          'button',
                          {
                            type: 'button',
                            onClick: doSubmit,
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
        }

        // 普通模式：表单初始化完成后自动提交
        const stop = watch(
          () => formRef.value?.initialized,
          (initialized) => {
            if (!initialized) return;
            stop();
            doSubmit();
          },
          { flush: 'post', immediate: true },
        );

        return () => h(Form as Component, { ...formProps, ref: formRef });
      },
    });

    const app = createApp(wrapperComponent);

    // 继承父级应用上下文（components / directives / provides / config 等）
    if (appContext) {
      Object.assign(app._context, appContext);
    }

    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      try {
        app.unmount();
      } catch {
        // ignore
      }
      container.parentNode?.removeChild(container);
    };

    // 调试模式等待人工操作，不应用超时
    if (timeout > 0 && !debug) {
      timer = setTimeout(() => {
        if (!cleaned) {
          reject(new Error(`submitForm timeout after ${timeout}ms: form is not initialized.`));
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
