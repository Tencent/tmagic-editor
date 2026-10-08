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

import { has } from 'lodash-es';

import { ActionType, type MNode } from '@tmagic/core';
import type {
  CodeSelectColConfig,
  DataSourceMethodSelectConfig,
  DynamicTypeConfig,
  EventSelectConfig,
  FormState,
  GroupListConfig,
  TableConfig,
  UISelectConfig,
} from '@tmagic/form/headless';
import { defineFormItem } from '@tmagic/form/headless';

import type { Services } from '@editor/type';
import {
  getCompActionAllowedValues,
  getCompActionOptions,
  getEventNameAllowedValues,
  getEventNameOptions,
  normalizeCompActionValue,
} from '@editor/utils/event';

import { stickyAddButton } from './stickyAddButton';

/**
 * `fields/EventSelect.vue` 内部渲染的各段配置。
 *
 * 由组件与无渲染校验的嵌套配置共用：组件用它们渲染，嵌套配置用它们让父表单校验到这些字段。
 * 每段都支持通过 `config.xxxConfig` 覆盖，覆盖逻辑也必须两边一致，因此一并收口在此。
 */

/** 事件名称下拉框配置，渲染在每张事件卡片的头部 */
export const createEventNameConfig = (config: EventSelectConfig) => {
  const defaultEventNameConfig = {
    name: 'name',
    text: '事件类型',
    type: (_mForm: FormState | undefined, { formValue }: any) => {
      if (config.src !== 'component' || (formValue.type === 'page-fragment-container' && formValue.pageFragmentId)) {
        return 'cascader';
      }
      return 'select';
    },
    labelWidth: '70px',
    checkStrictly: () => config.src !== 'component',
    valueSeparator: '.',
    options: (mForm: FormState, { formValue }: any) =>
      mForm?.services ? getEventNameOptions(config.src, formValue, mForm.services) : [],
    rules: [
      {
        validator: ({ value, callback }: any, { formValue }: any, mForm?: FormState) => {
          const allowedNames = mForm?.services
            ? getEventNameAllowedValues(config as any, formValue, mForm.services)
            : null;
          if (allowedNames && allowedNames.size > 0 && value && !allowedNames.has(value)) {
            return callback(`事件名(${value})不存在`);
          }
          callback();
        },
        trigger: 'blur',
      },
    ],
  };
  return { ...defaultEventNameConfig, ...config.eventNameConfig };
};

const createActionTypeOptions = (services?: Services) => {
  const o: {
    text: string;
    label: string;
    value: string;
    disabled?: boolean;
  }[] = [
    {
      text: '组件',
      label: '组件',
      value: ActionType.COMP,
    },
  ];

  if (!services) {
    return o;
  }

  const { propsService, codeBlockService } = services;

  if (!propsService.getDisabledCodeBlock()) {
    o.push({
      text: '代码',
      label: '代码',
      disabled: !Object.keys(codeBlockService.getCodeDsl() || {}).length,
      value: ActionType.CODE,
    });
  }

  if (!propsService.getDisabledDataSource()) {
    o.push({
      text: '数据源',
      label: '数据源',
      value: ActionType.DATA_SOURCE,
    });
  }

  return o;
};

/** 联动类型 */
const createActionTypeConfig = (config: EventSelectConfig) => {
  const defaultActionTypeConfig = {
    name: 'actionType',
    text: '联动类型',
    type: 'select',
    defaultValue: ActionType.COMP,
    options: (mForm: FormState | undefined) => createActionTypeOptions(mForm?.services),
    rules: [
      {
        required: true,
        message: '联动类型不能为空',
      },
      {
        typeMatch: true,
        trigger: 'blur',
      },
    ],
    onChange: (_mForm: FormState, _v: string, { setModel }: any) => {
      setModel('to', '');
      setModel('method', '');
      setModel('codeId', '');
      setModel('dataSourceMethod', []);
    },
  };
  return { ...defaultActionTypeConfig, ...config.actionTypeConfig };
};

/** 联动组件 */
const createTargetCompConfig = (config: EventSelectConfig) => {
  const defaultTargetCompConfig: UISelectConfig = {
    name: 'to',
    text: '联动组件',
    type: 'ui-select',
    display: (_mForm, { model }) => model.actionType === ActionType.COMP,
    onChange: (_mForm, _v, { setModel }) => {
      setModel('method', '');
    },
    rules: [
      {
        typeMatch: true,
        trigger: 'blur',
      },
    ],
  };
  return { ...defaultTargetCompConfig, ...config.targetCompConfig };
};

/** 联动组件动作 */
const createCompActionConfig = (config: EventSelectConfig) => {
  const defaultCompActionConfig: DynamicTypeConfig = {
    name: 'method',
    text: '动作',
    type: (mForm: FormState | undefined, { model }: any) => {
      const to = mForm?.services?.editorService.getNodeById(model.to);

      if (to?.type === 'page-fragment-container' && to.pageFragmentId) {
        return 'cascader';
      }

      return 'select';
    },
    checkStrictly: () => config.src !== 'component',
    display: (_mForm: FormState | undefined, { model }: any) => model.actionType === ActionType.COMP,
    options: (mForm: FormState, { model }: any) =>
      mForm?.services ? getCompActionOptions(model.to, mForm.services) : [],
    rules: [
      {
        trigger: 'blur',
        validator: ({ value, callback }: any, { model }: any, mForm?: FormState) => {
          const allowedMethods = mForm?.services
            ? getCompActionAllowedValues(config as any, model, mForm.services)
            : null;
          const normalized = normalizeCompActionValue(value);
          if (allowedMethods && allowedMethods.size > 0 && normalized && !allowedMethods.has(normalized)) {
            return callback(`动作名(${normalized})不存在`);
          }
          callback();
        },
      },
    ],
  };
  return { ...defaultCompActionConfig, ...config.compActionConfig };
};

/** 代码联动 */
const createCodeActionConfig = (config: EventSelectConfig) => {
  const defaultCodeActionConfig: CodeSelectColConfig = {
    type: 'code-select-col',
    text: '代码块',
    name: 'codeId',
    notEditable: (mForm: FormState | undefined) => !mForm?.services?.codeBlockService.getEditStatus(),
    display: (_mForm, { model }) => model.actionType === ActionType.CODE,
  };
  return { ...defaultCodeActionConfig, ...config.codeActionConfig };
};

/** 数据源联动 */
const createDataSourceActionConfig = (config: EventSelectConfig) => {
  const defaultDataSourceActionConfig: DataSourceMethodSelectConfig = {
    type: 'data-source-method-select',
    text: '数据源方法',
    name: 'dataSourceMethod',
    notEditable: (mForm: FormState | undefined) => !mForm?.services?.dataSourceService.get('editable'),
    display: (_mForm, { model }) => model.actionType === ActionType.DATA_SOURCE,
  };
  return { ...defaultDataSourceActionConfig, ...config.dataSourceActionConfig };
};

/** 单张事件里的动作组 */
export const createActionsConfig = (config: EventSelectConfig): GroupListConfig =>
  defineFormItem({
    type: 'group-list',
    name: 'actions',
    expandAll: true,
    enableToggleMode: false,
    titlePrefix: '动作',
    labelPosition: 'top',
    flat: true,
    ...stickyAddButton('新增动作'),
    items: [
      createActionTypeConfig(config),
      createTargetCompConfig(config),
      createCompActionConfig(config),
      createCodeActionConfig(config),
      createDataSourceActionConfig(config),
    ],
  }) as GroupListConfig;

/** 事件列表（外层 group-list）。事件名走 title slot，body 只放动作组。 */
export const createEventSelectConfig = (
  config: EventSelectConfig,
  name: string,
  options?: { includeEventName?: boolean },
): GroupListConfig =>
  defineFormItem({
    type: 'group-list',
    name,
    titlePrefix: '事件',
    expandAll: true,
    enableToggleMode: false,
    movable: false,
    defaultAdd: { name: '', actions: [] },
    ...stickyAddButton('添加事件'),
    items: [...(options?.includeEventName ? [createEventNameConfig(config)] : []), createActionsConfig(config)],
  }) as GroupListConfig;

/** 兼容旧数据格式（事件列表里没有 actions）时渲染的表格配置，本身不带校验规则 */
export const createLegacyTableConfig = (config: EventSelectConfig): TableConfig =>
  defineFormItem({
    type: 'table',
    name: 'events',
    items: [
      {
        name: 'name',
        label: '事件名',
        type: createEventNameConfig(config).type,
        options: (mForm: FormState, { formValue }: any) => {
          const services = mForm?.services;
          if (!services) return [];

          return services.eventsService
            .getEvent(formValue.type, { node: services.editorService.getNodeById(formValue.id) })
            .map((option: any) => ({
              text: option.label,
              value: option.value,
            }));
        },
      },
      {
        name: 'to',
        label: '联动组件',
        type: 'ui-select',
      },
      {
        name: 'method',
        label: '动作',
        type: createCompActionConfig(config).type,
        options: (mForm: FormState, { model, formValue }: any) => {
          const services = mForm?.services;
          if (!services) return [];

          const node = services.editorService.getNodeById(model.to) || (formValue as MNode);
          if (!node?.type) return [];

          return services.eventsService.getMethod(node.type, { targetId: model.to, node }).map((option: any) => ({
            text: option.label,
            value: option.value,
          }));
        },
      },
    ],
  }) as TableConfig;

/** 事件列表是否为旧数据格式（列表项里没有 actions） */
export const isLegacyEventValue = (events: any): boolean => {
  if (!Array.isArray(events) || events.length === 0) return false;
  return !has(events[0], 'actions');
};
