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
  type DisplayCondsConfig,
  type EventSelectConfig,
  type FieldNestedConfig,
  filterFunction,
  type FormItemConfig,
  type HeadlessFieldOptions,
} from '@tmagic/form/headless';
import type { StyleSchema } from '@tmagic/schema';

import { editorTypeMatchRules, validateDataSourceFieldSelect } from '@editor/utils/type-match-rules';

import { createCodeSelectConfig, normalizeCodeSelectValue } from './configs/codeSelect';
import { createDisplayCondsConfig } from './configs/displayConds';
import { createActionsConfig, createEventNameConfig, isLegacyEventValue } from './configs/eventSelect';
import { createStyleSetterConfig } from './StyleSetter/configs';

const getName = (config: FormItemConfig): string => `${(config as any).name ?? ''}`;

/**
 * `code-select` 的嵌套配置。
 *
 * 对应 `fields/CodeSelect.vue` 内部
 * `<MContainer :config="codeConfig" :model="model[name]" :prop="prop">`。
 *
 * @param ctx - 嵌套配置回调入参
 * @returns 内部容器的 config / model / prop
 */
const codeSelectNestedConfig: FieldNestedConfig = ({ config, model, prop }) => {
  const name = getName(config);
  // 组件在 watch(immediate) 里做的旧数据兼容，发生在校验之前
  normalizeCodeSelectValue(model, name);

  return {
    config: createCodeSelectConfig(config as any),
    model: model?.[name],
    prop,
  };
};

/**
 * `display-conds` 的嵌套配置。
 *
 * 对应 `fields/DisplayConds.vue` 内部
 * `<MGroupList :config="config" :name="name" :model="model" :prop="prop">`。
 *
 * @param ctx - 嵌套配置回调入参
 * @returns 内部 group-list 配置；prop 基准为 parentProp，避免 name 被拼两次
 */
const displayCondsNestedConfig: FieldNestedConfig = ({ config, model, prop, parentProp, mForm }) => {
  const name = getName(config);
  const parentFields =
    filterFunction<string[]>(mForm, (config as DisplayCondsConfig).parentFields, {
      model,
      config,
      prop,
    }) || [];

  return {
    config: createDisplayCondsConfig(config as DisplayCondsConfig, name, parentFields),
    // 内部 group-list 复用了字段自身的 name，prop 基准要退回父级，否则 name 会被拼两次
    prop: parentProp,
  };
};

/**
 * `event-select` 的嵌套配置。
 *
 * 对应 `fields/EventSelect.vue` 按事件列表 `v-for` 出的卡片：每张卡片渲染
 * `<MFormContainer>` 与 `<MPanel>`，`:prop` 为 `${prop}.${index}`。
 * 用合成的 group-list 表达这层 `v-for`。
 *
 * @param ctx - 嵌套配置回调入参
 * @returns 合成的 group-list 配置；旧数据格式返回 null，不参与校验
 */
const eventSelectNestedConfig: FieldNestedConfig = ({ config, model, parentProp }) => {
  const name = getName(config);
  const events = model?.[name];

  // 旧数据格式走的是另一套表格配置，其中不含任何 rules，不参与校验
  if (!Array.isArray(events) || isLegacyEventValue(events)) return null;

  return {
    config: {
      type: 'group-list',
      name,
      items: [createEventNameConfig(config as EventSelectConfig), createActionsConfig(config as EventSelectConfig)],
    } as any as FormItemConfig,
    prop: parentProp,
  };
};

/**
 * `style-setter` 的嵌套配置。
 *
 * 对应 `fields/StyleSetter/Index.vue`：6 个面板共用 `:values="model[name]"`、`:prop="prop || name"`。
 * `theme` 按 `useTheme` 缺省空串传入，只改 flexWrap 的 UI childType，不影响校验字段。
 *
 * @param ctx - 嵌套配置回调入参
 * @returns style 面板配置及 styleModel
 */
const styleSetterNestedConfig: FieldNestedConfig = ({ config, model, prop }) => {
  const name = getName(config);
  const styleModel = (model?.[name] ?? {}) as Partial<StyleSchema>;

  return {
    config: createStyleSetterConfig(styleModel, '', validateDataSourceFieldSelect),
    model: styleModel,
    prop,
  };
};

/**
 * 编辑器字段的无渲染登记表（不含 Vue 组件）。
 *
 * Node 里 `registerFields(editorFields)` 即可配合 `validateForm` / `submitForm`。
 * 安装编辑器时由 plugin 把 `component` 叠上去再传给 `@tmagic/form`。
 *
 * - 叶子：内部只渲染叶子 UI，或把子表单渲染在独立的 MForm / MFormBox 实例里
 * - nested：内部再渲染 MContainer / MPanel / MGroupList，把运行期配置交出来
 * - typeMatch：该 type 自身的类型匹配校验
 *
 * nested 返回的 config / model / prop 与组件模板里传给内部容器的那一组保持一一对应，
 * 且配置本身与组件共用同一份工厂（`fields/configs/`）。
 */
export const editorFields: Record<string, HeadlessFieldOptions> = {
  'vs-code': {},
  'code-link': {},
  'ui-select': { typeMatch: editorTypeMatchRules['ui-select'] },
  'cond-op-select': { typeMatch: editorTypeMatchRules['cond-op-select'] },
  'page-fragment-select': { typeMatch: editorTypeMatchRules['page-fragment-select'] },
  'data-source-select': { typeMatch: editorTypeMatchRules['data-source-select'] },
  'data-source-input': { typeMatch: editorTypeMatchRules['data-source-input'] },
  'key-value': { typeMatch: editorTypeMatchRules['key-value'] },
  'code-select-col': { typeMatch: editorTypeMatchRules['code-select-col'] },
  'data-source-fields': { typeMatch: editorTypeMatchRules['data-source-fields'] },
  'data-source-mocks': { typeMatch: editorTypeMatchRules['data-source-mocks'] },
  'data-source-methods': { typeMatch: editorTypeMatchRules['data-source-methods'] },
  'data-source-method-select': { typeMatch: editorTypeMatchRules['data-source-method-select'] },
  'data-source-field-select': { typeMatch: editorTypeMatchRules['data-source-field-select'] },
  'code-select': { nested: codeSelectNestedConfig, typeMatch: editorTypeMatchRules['code-select'] },
  'display-conds': { nested: displayCondsNestedConfig, typeMatch: editorTypeMatchRules['display-conds'] },
  'event-select': { nested: eventSelectNestedConfig, typeMatch: editorTypeMatchRules['event-select'] },
  'style-setter': { nested: styleSetterNestedConfig, typeMatch: editorTypeMatchRules['style-setter'] },
};
