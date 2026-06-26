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
 * ```
 */
export const submitForm = (options: SubmitFormOptions): Promise<any> => {
  const { native, appContext, timeout = 10000, returnChangeRecords, ...formProps } = options;

  return new Promise((resolve, reject) => {
    const container = document.createElement('div');
    container.style.display = 'none';
    document.body.appendChild(container);

    let cleaned = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const wrapperComponent = defineComponent({
      name: 'MFormSubmitWrapper',
      setup() {
        const formRef = ref<any>(null);

        const stop = watch(
          () => formRef.value?.initialized,
          async (initialized) => {
            if (!initialized) return;
            stop();

            try {
              // 等待子组件（FormItem 等）完成首次渲染，确保 validate 能拿到所有字段
              await nextTick();
              // submitForm 校验通过后会清空 changeRecords，需在调用前先做快照
              const changeRecords: ChangeRecord[] = [...(formRef.value.changeRecords ?? [])];
              const result = await formRef.value.submitForm(native);
              resolve(returnChangeRecords ? { values: result, changeRecords } : result);
            } catch (err) {
              reject(err);
            } finally {
              cleanup();
            }
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

    if (timeout > 0) {
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
