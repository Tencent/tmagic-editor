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

import { isEmpty } from 'lodash-es';

import { HookCodeType, HookType } from '@tmagic/core';
import type { CodeSelectConfig, FormValue, GroupListConfig } from '@tmagic/form/headless';

import codeBlockService from '@editor/services/codeBlock';
import dataSourceService from '@editor/services/dataSource';

import { stickyAddButton } from './stickyAddButton';

/**
 * `fields/CodeSelect.vue` 内部渲染的钩子列表配置。
 *
 * 由组件与无渲染校验的嵌套配置共用：组件用它渲染，嵌套配置用它让父表单校验到这些字段。
 */
export const createCodeSelectConfig = (config: CodeSelectConfig): GroupListConfig => {
  const groupListConfig: GroupListConfig = {
    type: 'group-list',
    name: 'hookData',
    enableToggleMode: false,
    expandAll: true,
    defaultAdd: () => ({
      codeType: HookCodeType.CODE,
      codeId: '',
    }),
    ...stickyAddButton(`添加${config.text || ''}`),
    title: (_mForm: any, { model, index }: any) => {
      if (model.codeType === HookCodeType.DATA_SOURCE_METHOD) {
        if (Array.isArray(model.codeId)) {
          if (model.codeId.length < 2) {
            return index;
          }

          const ds = dataSourceService.getDataSourceById(model.codeId[0]);
          return `${ds?.title} / ${model.codeId[1]}`;
        }

        return Array.isArray(model.codeId) ? model.codeId.join('/') : index;
      }

      const codeContent = codeBlockService.getCodeContentById(model.codeId);

      if (codeContent) {
        return codeContent.name;
      }

      return model.codeId || index;
    },
    titlePrefix: config.name === undefined ? undefined : String(config.name),
    items: [
      {
        text: '代码类型',
        type: 'select',
        name: 'codeType',
        rules: [{ typeMatch: true, trigger: 'change' }],
        options: [
          { value: HookCodeType.CODE, text: '代码块' },
          { value: HookCodeType.DATA_SOURCE_METHOD, text: '数据源方法' },
        ],
        defaultValue: HookCodeType.CODE,
        onChange: (_mForm: any, v: HookCodeType, { setModel }: any) => {
          if (v === HookCodeType.DATA_SOURCE_METHOD) {
            setModel('codeId', []);
          } else {
            setModel('codeId', '');
          }
          return v;
        },
      },
      {
        type: 'code-select-col',
        name: 'codeId',
        text: '代码块',
        rules: [{ typeMatch: true, trigger: 'change' }],

        display: (_mForm: any, { model }: any) => model.codeType !== HookCodeType.DATA_SOURCE_METHOD,
        notEditable: () => !codeBlockService.getEditStatus(),
      },
      {
        type: 'data-source-method-select',
        name: 'codeId',
        text: '数据源字段',
        rules: [{ typeMatch: true, trigger: 'change' }],
        display: (_mForm: any, { model }: any) => model.codeType === HookCodeType.DATA_SOURCE_METHOD,
        notEditable: () => !dataSourceService.get('editable'),
      },
    ],
  } as any as GroupListConfig;

  return groupListConfig;
};

/**
 * `fields/CodeSelect.vue` 挂载时的值兼容：旧数据结构里钩子值可能是空值或空数组，
 * 组件用 `watch(immediate)` 把它改写成 `{ hookType, hookData }`。
 *
 * 这个写入发生在校验之前，无渲染校验必须同样执行，否则内部字段的取值层级不一致。
 */
export const normalizeCodeSelectValue = (model: FormValue | undefined, name: string): void => {
  if (!model) return;

  // 空值或者空数组
  if (isEmpty(model[name])) {
    model[name] = {
      hookType: HookType.CODE,
      hookData: [],
    };
  }
};
