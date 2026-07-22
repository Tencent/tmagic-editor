/* eslint-disable @typescript-eslint/naming-convention */
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

import type { AppContext } from 'vue';

import {
  HookType,
  NODE_CONDS_KEY,
  NODE_CONDS_RESULT_KEY,
  NODE_DISABLE_CODE_BLOCK_KEY,
  NODE_DISABLE_DATA_SOURCE_KEY,
} from '@tmagic/core';
import { tMagicMessage } from '@tmagic/design';
import type {
  ChildConfig,
  DisplayCondsConfig,
  FormConfig,
  FormState,
  FormValue,
  TabConfig,
  TabPaneConfig,
} from '@tmagic/form';
import { validateForm } from '@tmagic/form';

import type { Services } from '@editor/type';

export const arrayOptions = [
  { text: '包含', value: 'include' },
  { text: '不包含', value: 'not_include' },
];

export const eqOptions = [
  { text: '等于', value: '=' },
  { text: '不等于', value: '!=' },
];

export const numberOptions = [
  { text: '大于', value: '>' },
  { text: '大于等于', value: '>=' },
  { text: '小于', value: '<' },
  { text: '小于等于', value: '<=' },
  { text: '在范围内', value: 'between' },
  { text: '不在范围内', value: 'not_between' },
];

export const booleanOptions = [
  { text: '是', value: 'is' },
  { text: '不是', value: 'not' },
];

/** 按字段类型返回条件运算符选项（UI 与 typeMatch 校验共用） */
export const getCondOpOptionsByFieldType = (type: string) => {
  if (type === 'array') {
    return arrayOptions;
  }

  if (type === 'boolean' || type === 'null') {
    return booleanOptions;
  }

  if (type === 'number') {
    return [...eqOptions, ...numberOptions];
  }

  if (type === 'string') {
    return [...arrayOptions, ...eqOptions];
  }

  return [...arrayOptions, ...eqOptions, ...numberOptions];
};

export const styleTabConfig: TabPaneConfig = {
  title: '样式',
  lazy: true,
  display: ({ services }: any) => !(services?.uiService?.get('showStylePanel') ?? true),
  items: [
    {
      name: 'style',
      labelWidth: '100px',
      type: 'style-setter',
      items: [
        {
          names: [
            'display',
            'flexDirection',
            'justifyContent',
            'alignItems',
            'flexWrap',
            'marginTop',
            'marginRight',
            'marginBottom',
            'marginLeft',
            'paddingTop',
            'paddingRight',
            'paddingBottom',
            'paddingLeft',
            'width',
            'height',
            'overflow',
            'fontSize',
            'lineHeight',
            'fontWeight',
            'color',
            'textAlign',
            'backgroundColor',
            'backgroundImage',
            'backgroundSize',
            'backgroundPosition',
            'backgroundRepeat',
            'position',
            'zIndex',
            'top',
            'right',
            'bottom',
            'left',
            'borderRadius',
            'borderTopWidth',
            'borderTopStyle',
            'borderTopColor',
            'borderRightColor',
            'borderRightWidth',
            'borderRightStyle',
            'borderRightColor',
            'borderBottomWidth',
            'borderBottomStyle',
            'borderBottomColor',
            'borderLeftStyle',
            'borderLeftWidth',
            'borderLeftColor',
            'borderWidth',
            'borderStyle',
            'borderColor',
            'opacity',
          ],
        } as unknown as ChildConfig,
        {
          name: 'transform',
          defaultValue: () => ({}),
        },
      ],
    },
  ],
};

export const eventTabConfig: TabPaneConfig = {
  title: '事件',
  lazy: true,
  items: [
    {
      name: 'events',
      src: 'component',
      labelWidth: '100px',
      type: 'event-select',
      rules: [{ typeMatch: true }],
    },
  ],
};

export const advancedTabConfig: TabPaneConfig = {
  title: '高级',
  lazy: true,
  items: [
    {
      name: NODE_DISABLE_CODE_BLOCK_KEY,
      text: '禁用代码块',
      type: 'switch',
      labelPosition: 'left',
      defaultValue: false,
      extra: '开启后，配置的代码块将不会被执行',
    },
    {
      name: NODE_DISABLE_DATA_SOURCE_KEY,
      text: '禁用数据源',
      type: 'switch',
      labelPosition: 'left',
      defaultValue: false,
      extra: '开启后，组件内配置的数据源相关配置将不会被编译，显隐条件将失效',
    },
    {
      name: 'created',
      text: 'Created',
      labelPosition: 'top',
      type: 'code-select',
      titleExtra: '组件初始化时执行',
      rules: [
        { typeMatch: true, trigger: 'change' },
        {
          validator: ({ value, callback }: any) => {
            if (value && value.hookType !== HookType.CODE) {
              return callback('hookType 必须是 code');
            }
            callback();
          },
        },
      ],
    },
    {
      name: 'mounted',
      text: 'Mounted',
      labelPosition: 'top',
      type: 'code-select',
      titleExtra: '组件挂载到dom时执行',
      rules: [
        { typeMatch: true, trigger: 'change' },
        {
          validator: ({ value, callback }: any) => {
            if (value && value.hookType !== HookType.CODE) {
              return callback('hookType 必须是 code');
            }
            callback();
          },
        },
      ],
    },
    {
      name: 'display',
      text: 'Display',
      titleExtra: '控制组件是否渲染，关系的代码块返回值为false时不渲染',
      labelPosition: 'top',
      type: 'code-select',
      rules: [
        { typeMatch: true, trigger: 'change' },
        {
          validator: ({ value, callback }: any) => {
            if (value && value.hookType !== HookType.CODE) {
              return callback('hookType 必须是 code');
            }
            callback();
          },
        },
      ],
    },
  ],
};

export const displayTabConfig: TabPaneConfig<DisplayCondsConfig> = {
  title: '显示条件',
  display: (_state, { model }) => model.type !== 'page',
  items: [
    {
      name: NODE_CONDS_RESULT_KEY,
      type: 'select',
      text: '条件成立时',
      defaultValue: false,
      options: [
        { text: '显示', value: false },
        { text: '隐藏', value: true },
      ],
      extra: (_state, { model }) =>
        `条件成立时${model[NODE_CONDS_RESULT_KEY] ? '隐藏' : '显示'}，不成立时${model[NODE_CONDS_RESULT_KEY] ? '显示' : '隐藏'}；<br />同一条件组内的所有条件配置同时成立时表示该条件组成立，任意一个条件组成立时表示条件成立(条件组内为且的关系，条件组间为或的关系)；<br />条件为空时表示成立；`,
    },
    {
      text: '条件组配置',
      static: true,
      className: 'display-conds-title',
    },
    {
      type: 'display-conds',
      name: NODE_CONDS_KEY,
      titlePrefix: '条件组',
      fixed: 'right',
      operateColWidth: 112,
      defaultValue: [],
      rules: [{ typeMatch: true }],
    },
  ],
};

/**
 * 统一为组件属性表单加上事件、高级、样式配置
 * @param config 组件属性配置
 * @returns Object
 */
export const fillConfig = (
  config: FormConfig = [],
  {
    labelWidth = '80px',
    disabledDataSource = false,
    disabledCodeBlock = false,
  }: { labelWidth?: string; disabledDataSource?: boolean; disabledCodeBlock?: boolean } = {},
): FormConfig => {
  const propsConfig: FormConfig = [];

  // 组件类型，必须要有
  if (!config.find((item) => 'name' in item && item.name === 'type')) {
    propsConfig.push({
      text: 'type',
      name: 'type',
      type: 'hidden',
    });
  }

  if (!config.find((item) => 'name' in item && item.name === 'id')) {
    // 组件id，必须要有
    propsConfig.push({
      name: 'id',
      text: 'ID',
      type: 'text',
      // 走纯文本渲染，避免出现 disabled 的灰底输入框；append 仍正常显示。
      static: true,

      append: {
        type: 'icon',
        text: 'https://vip.image.video.qpic.cn/vupload/20260615/36cf7e1781493669935.svg',
        extra: '复制',
        handler: (vm, { model }) => {
          navigator.clipboard
            .writeText(`${model.id}`)
            .then(() => {
              tMagicMessage.success('已复制');
            })
            .catch(() => {
              tMagicMessage.error('复制失败');
            });
        },
      },
    });
  }

  if (!config.find((item) => 'name' in item && item.name === 'name')) {
    propsConfig.push({
      name: 'name',
      text: '组件名称',
    });
  }

  const noCodeAdvancedTabItems = advancedTabConfig.items.filter(
    (item) => 'type' in item && item.type !== 'code-select',
  );

  if (noCodeAdvancedTabItems.length > 0 && disabledCodeBlock) {
    advancedTabConfig.items = noCodeAdvancedTabItems;
  }

  const tabConfig: TabConfig = {
    type: 'tab',
    labelWidth,
    className: 'magic-right-panel-tabs-top',
    items: [
      {
        title: '属性',
        items: [...propsConfig, ...config],
      },
      { ...styleTabConfig },
      { ...eventTabConfig },
    ],
  };

  if (!disabledCodeBlock) {
    tabConfig.items.push({ ...advancedTabConfig });
  } else if (noCodeAdvancedTabItems.length > 0) {
    tabConfig.items.push({ ...advancedTabConfig });
  }

  if (!disabledDataSource) {
    tabConfig.items.push({ ...displayTabConfig });
  }

  return [tabConfig];
};

/**
 * 将属性表单配置中「样式」tab-pane 的 `display` 强制置为 `true`。
 *
 * `propsService.getPropsConfig` 返回的样式 tab 默认带有
 * `display: ({ services }) => !(services?.uiService?.get('showStylePanel') ?? true)`，
 * 在对比 / 只读展示场景（CompareForm / ViewForm）下并不需要跟随 uiService 状态隐藏，
 * 这里统一放开，保证样式 tab 始终可见。
 *
 * @param formConfig 组件属性表单配置
 * @returns 处理后的表单配置（不修改入参，返回浅拷贝）
 */
export const removeStyleDisplayConfig = (formConfig: FormConfig): FormConfig =>
  formConfig.map((item) => {
    if (!('type' in item)) return item;
    if (item?.type !== 'tab' || !Array.isArray(item.items)) return item;

    return {
      ...item,
      items: item.items.map((tabPane) => {
        if (tabPane?.title !== '样式' || !Array.isArray(tabPane.items)) return tabPane;

        return {
          ...tabPane,
          display: true,
        };
      }),
    };
  });

// #region ValidatePropsFormOptions
/**
 * validatePropsForm 参数
 */
export interface ValidatePropsFormOptions {
  /** 组件属性表单配置 */
  config: FormConfig;
  /** 待校验的表单值 */
  values: FormValue;
  /**
   * 当前组件实例的 appContext（通常为 `getCurrentInstance()?.appContext`）。
   * 会与 services 一并合入临时 MForm 的 appContext，使编辑器字段组件（DataSourceInput 等）能正常 inject。
   */
  appContext?: AppContext | null;
  /** 编辑器服务集合，注入到临时表单的 formState */
  services?: Services;
  /** stage 实例，注入到临时表单的 formState */
  stage?: any;
  /** 外部扩展的 formState */
  extendState?: (_state: FormState) => Record<string, any> | Promise<Record<string, any>>;
  /**
   * 调试模式，默认 `true`：以弹层形式可见地渲染表单，点击「确定」才触发校验。
   * 置为 `false` 时静默挂载后自动校验。
   */
  debug?: boolean;
  typeMatchValid?: boolean;
}
// #endregion ValidatePropsFormOptions

/**
 * 对一份「组件属性表单配置 + 值」做一次独立的校验，**不复用也不污染页面上正在展示的表单**。
 *
 * 内部基于 `@tmagic/form` 的 `validateForm` 另建一个独立的 MForm 实例完成校验，并统一处理
 * 编辑器场景所需的上下文注入：将当前组件实例的 provides 合入 appContext，并向 formState 注入
 * stage / services 及外部扩展状态，保证校验规则依赖的上下文可用。
 *
 * 常用于源码编辑器保存后，对最新配置做一次校验，并将校验结果（错误信息）随提交一并抛给上层记录，
 * 使源码保存的错误状态与表单编辑保持一致。
 *
 * @returns 校验通过返回空字符串 `''`，否则返回以 `<br>` 拼接的错误文案。
 *   仅在初始化超时或挂载失败等异常情况下才会 reject。
 *
 * @example
 * ```ts
 * const error = await validatePropsForm({
 *   config,
 *   values,
 *   appContext: getCurrentInstance()?.appContext,
 *   services,
 *   stage: editorService.get('stage'),
 *   extendState,
 * });
 * if (error) {
 *   // 配置不合法，error 为错误文案
 * }
 * ```
 */
export const validatePropsForm = ({
  config,
  values,
  appContext = null,
  services,
  stage,
  extendState,
  debug,
  typeMatchValid,
}: ValidatePropsFormOptions): Promise<string> =>
  validateForm({
    config,
    debug,
    typeMatchValid,
    initValues: values,
    // 将当前组件实例的 provides（含 Editor 顶层的 services / codeOptions 等组件级 provide）
    // 合入 appContext，使临时 MForm 中的编辑器字段组件（DataSourceInput 等）能正常 inject
    appContext: appContext ? { ...appContext, provides: { services } } : null,
    // 与页面表单保持一致：注入 stage/services 及外部扩展状态，保证校验规则依赖的上下文可用
    extendState: async (state) => ({
      ...((await extendState?.(state)) || {}),
      stage,
      services,
    }),
  });
