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

import { tMagicMessage } from '@tmagic/design';
import { defineFormConfig, defineFormItem, type FormConfig, type TableColumnConfig } from '@tmagic/form';

import { getEditorConfig } from './config';

/**
 * 代码块编辑表单配置的统一入口。
 *
 * 用于：
 * - `CodeBlockEditor.vue`：作为代码块新增/编辑的表单结构；
 * - `CompareForm.vue`：在历史差异对比中以"代码块"形态展示前后值。
 *
 * 通过参数控制两端的细微差异（是否启用必填校验 / vs-code onChange 校验 / dataSource 相关字段显示规则等），
 * 避免两边同步两份相同的 schema 而造成漂移。
 */
export interface GetCodeBlockFormConfigOptions {
  /**
   * 自定义 `params` 表格的"参数类型"列配置。优先级高于内置默认值；
   * 通常由 `codeBlockService.getParamsColConfig()` 注入业务侧的扩展。
   */
  paramColConfig?: TableColumnConfig;
  /**
   * 是否在「数据源代码块」语境下使用：
   * - true：`执行时机` 字段会展示，`请求前 / 请求后` 选项仅在 `dataSourceType !== 'base'` 时出现；
   * - false：`执行时机` 字段隐藏（普通代码块没有时机概念）。
   *
   * 注意这里以函数形式传入是为了让 `display` / `options` 在每次渲染时实时取值，
   * 例如外部 `props.isDataSource` 切换或 `dataSourceType` 变更都能立即生效。
   */
  isDataSource?: () => boolean;
  /** 当 isDataSource 为 true 时使用：返回当前数据源类型（`base` / `http` / ...），决定时机选项是否包含请求前后。 */
  dataSourceType?: () => string | undefined;
  /** vs-code 编辑器的额外 monaco options。一般传 `inject('codeOptions', {})` 的结果。 */
  codeOptions?: Record<string, any>;
  /**
   * 是否启用编辑态特性：
   * - true（默认）：`name` 字段加必填校验；vs-code 的 `onChange` 会调用 `parseDSL` 检查语法，出错时弹消息并抛错；
   * - false：纯只读/对比场景，不加校验逻辑。
   */
  editable?: boolean;
}

/** 默认的"参数类型"列配置：数字 / 字符串 / 组件 三选一。 */
const defaultParamColConfig = () =>
  defineFormItem<TableColumnConfig>({
    type: 'row',
    label: '参数类型',
    items: [
      {
        text: '参数类型',
        labelWidth: '70px',
        type: 'select',
        name: 'type',
        options: [
          { text: '数字', label: '数字', value: 'number' },
          { text: '字符串', label: '字符串', value: 'text' },
          { text: '组件', label: '组件', value: 'ui-select' },
        ],
      },
    ],
  });

/**
 * 生成代码块表单配置。返回的是普通对象数组，可直接传给 `<MForm :config>`；
 * 如需响应式的 props 变化（如切换 dataSourceType），调用方在 `computed` 中再次调用本函数即可。
 */
export const getCodeBlockFormConfig = (options: GetCodeBlockFormConfigOptions = {}): FormConfig => {
  const { paramColConfig, isDataSource, dataSourceType, codeOptions = {}, editable = true } = options;

  return defineFormConfig([
    {
      text: '名称',
      name: 'name',
      ...(editable ? { rules: [{ required: true, message: '请输入名称', trigger: 'blur' }] } : {}),
    },
    {
      text: '描述',
      name: 'desc',
    },
    {
      text: '执行时机',
      name: 'timing',
      type: 'select',
      options: () => {
        const list = [
          { text: '初始化前', value: 'beforeInit' },
          { text: '初始化后', value: 'afterInit' },
        ];
        if (dataSourceType?.() !== 'base') {
          list.push({ text: '请求前', value: 'beforeRequest' });
          list.push({ text: '请求后', value: 'afterRequest' });
        }
        return list;
      },
      display: () => Boolean(isDataSource?.()),
    },
    {
      type: 'table',
      border: true,
      text: '参数',
      enableFullscreen: false,
      enableToggleMode: false,
      name: 'params',
      dropSort: false,
      items: [
        { type: 'text', label: '参数名', name: 'name' },
        { type: 'text', label: '描述', name: 'extra' },
        paramColConfig || defaultParamColConfig(),
      ],
    },
    {
      name: 'content',
      type: 'vs-code',
      options: codeOptions,
      autosize: { minRows: 10, maxRows: 30 },
      ...(editable
        ? {
            onChange: (_formState: any, code: string) => {
              try {
                // 检测 js 代码是否存在语法错误
                getEditorConfig('parseDSL')(code);
                return code;
              } catch (error: any) {
                tMagicMessage.error(error.message);
                throw error;
              }
            },
          }
        : {}),
    },
  ]) as FormConfig;
};
