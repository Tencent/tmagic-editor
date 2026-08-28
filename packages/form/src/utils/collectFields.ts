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

import type { ComputedRef } from 'vue';

import { toLine } from '@tmagic/utils';

import type { FormConfig, FormItemConfig, FormState, FormValue, Rule } from '../schema';

import { getFieldNestedConfig } from './fieldNestedConfig';
import { getFieldMountValueEffect, isLeafFieldType } from './fieldValueEffects';
import {
  appendProp,
  display as displayFunction,
  filterFunction,
  getItemProp,
  getNativeRules,
  isValidName,
  resolveItemType,
} from './form';
import {
  getGroupListRowConfig,
  isGroupListType,
  isTableColumnRendered,
  makeTableColumnConfig,
  toGroupListConfig,
  toTableConfig,
} from './tableGroupList';

// #region CollectedField
/** 一个参与校验的字段：与渲染式校验中「一个带 rules 的 TMagicFormItem」一一对应 */
export interface CollectedField {
  /** 字段的完整 prop 路径（从表单根 values 起算，与 FormItem 的 prop 一致） */
  prop: string;
  /** 经 `getNativeRules` 处理后的规则（validator 为 async-validator 原生签名） */
  rules: Rule[];
  /** 字段配置 */
  config: FormItemConfig;
  /** 字段所在层级的 model 切片 */
  model: FormValue;
}
// #endregion CollectedField

/** 已登记的嵌套配置回调自身抛错时抛出（机制故障，不是漏登记） */
export class FieldNestedConfigError extends Error {
  readonly code = 'FIELD_NESTED_CONFIG';
  readonly type: string;
  readonly prop: string;

  constructor(type: string, prop: string, cause: unknown) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    super(`[MForm] nested config for "${type}" at "${prop}" failed: ${reason}`);
    this.name = 'FieldNestedConfigError';
    this.type = type;
    this.prop = prop;
    if (cause instanceof Error) {
      (this as Error & { cause?: unknown }).cause = cause;
    }
  }
}

export const isFieldNestedConfigError = (error: unknown): error is FieldNestedConfigError =>
  error instanceof FieldNestedConfigError ||
  (typeof error === 'object' && error !== null && (error as { code?: string }).code === 'FIELD_NESTED_CONFIG');

interface WalkContext {
  mForm: FormState | undefined;
  typeMatchValid: ComputedRef<boolean> | undefined;
  fields: CollectedField[];
}

interface WalkNode {
  config: FormItemConfig;
  /** 所在层级的 model 切片（对应 Container 的 `props.model`） */
  model: FormValue;
  /** 父级 prop（对应 Container 的 `props.prop`） */
  prop: string;
}

export type ContainerWalker = (_ctx: WalkContext, _node: WalkNode, _itemProp: string) => void;

const extraContainerWalkers = new Map<string, ContainerWalker>();
const builtInContainerWalkers = new Map<string, ContainerWalker>();

export const registerContainerWalker = (type: string, walker: ContainerWalker, builtIn = false): void => {
  if (typeof type !== 'string' || !type || typeof walker !== 'function') return;
  const key = toLine(type);
  if (builtIn) {
    builtInContainerWalkers.set(key, walker);
    return;
  }
  extraContainerWalkers.set(key, walker);
};

export const getContainerWalker = (type: string): ContainerWalker | undefined => {
  const key = toLine(type);
  return extraContainerWalkers.get(key) ?? builtInContainerWalkers.get(key);
};

export const deleteContainerWalker = (type: string): boolean => extraContainerWalkers.delete(toLine(type));

export const clearContainerWalkers = (): void => extraContainerWalkers.clear();

const getItems = (config: any): FormItemConfig[] | undefined => config?.items;

/**
 * 复刻 `Container.vue` 的 `display`。
 *
 * 与渲染的唯一差异：`display: 'expand'`（「展开更多配置」按钮背后的字段）在此视为可见。
 * 「是否已展开」纯粹是交互状态，不改变字段是否属于这份配置，无渲染校验按配置声明的范围校验。
 */
const resolveDisplay = (ctx: WalkContext, config: any, nodeProps: any): boolean => {
  const value = displayFunction(ctx.mForm, config?.display, nodeProps);
  if (value === 'expand') return true;
  return Boolean(value);
};

const addField = (ctx: WalkContext, node: WalkNode, itemProp: string, nodeProps: any): void => {
  const rules = getNativeRules(ctx.mForm, (node.config as any).rules, nodeProps, ctx.typeMatchValid) as Rule[];
  if (!rules.length) return;

  ctx.fields.push({ prop: itemProp, rules, config: node.config, model: node.model });
};

const walkChildren = (ctx: WalkContext, items: FormItemConfig[] | undefined, model: FormValue, prop: string): void => {
  if (!Array.isArray(items)) return;
  for (const item of items) {
    if (!item) continue;
    walkNode(ctx, { config: item, model, prop });
  }
};

const getContainerScope = (node: WalkNode) => {
  const { config, model } = node;
  const name = (config as any).name || '';
  return {
    config,
    model,
    name,
    items: getItems(config),
    // 容器组件收到的是 Container 自身的 model（父级切片），再由组件内部按 name 下钻
    childModel: (name ? model?.[name] : model) as FormValue,
  };
};

/** containers/Tabs.vue */
export const expandTab = (ctx: WalkContext, node: WalkNode, itemProp: string): void => {
  const { config, model, name, items, childModel } = getContainerScope(node);
  const tabsProps = { model, config, prop: itemProp };
  if ((config as any).dynamic) {
    if (!name) return;
    const tabs = model?.[name] || [];
    tabs.forEach((_tab: any, tabIndex: number) => {
      walkChildren(ctx, items, childModel?.[tabIndex], appendProp(itemProp, tabIndex));
    });
    return;
  }

  const tabs = (items || []).filter((item: any) => displayFunction(ctx.mForm, item?.display, tabsProps));
  for (const tab of tabs) {
    const tabName = (tab as any).name;
    // tab.lazy 只影响渲染时机，不影响该标签页是否属于这份配置，无渲染校验一律遍历
    walkChildren(
      ctx,
      getItems(tab),
      tabName ? childModel?.[tabName] : childModel,
      tabName ? appendProp(itemProp, tabName) : itemProp,
    );
  }
};

/** containers/Row.vue → Col.vue：col 用 v-show 控制显隐，始终渲染 */
export const expandRow = (ctx: WalkContext, node: WalkNode, itemProp: string): void => {
  const { items, childModel } = getContainerScope(node);
  walkChildren(ctx, items, childModel, itemProp);
};

/** containers/Fieldset.vue */
export const expandFieldset = (ctx: WalkContext, node: WalkNode, itemProp: string): void => {
  const { config, items, childModel } = getContainerScope(node);
  if (!childModel) return;
  const { checkbox } = config as any;
  const checkboxName = typeof checkbox === 'object' && typeof checkbox.name === 'string' ? checkbox.name : 'value';
  const checkboxTrueValue =
    typeof checkbox === 'object' && typeof checkbox.trueValue !== 'undefined' ? checkbox.trueValue : 1;
  // 勾选框关闭时整个 fieldset 的子项不渲染，语义上等于「该段配置未启用」，不参与校验
  if ((config as any).expand && childModel?.[checkboxName] !== checkboxTrueValue) return;
  walkChildren(ctx, items, childModel, itemProp);
};

/** containers/Panel.vue：折叠仅 display:none，子项照常渲染 */
export const expandPanel = (ctx: WalkContext, node: WalkNode, itemProp: string): void => {
  const { items, childModel } = getContainerScope(node);
  if (!items?.length) return;
  walkChildren(ctx, items, childModel, itemProp);
};

/** containers/Step.vue：非当前步仅 v-show 隐藏，子项照常渲染；prop 基准被重置为 step.name */
export const expandStep = (ctx: WalkContext, node: WalkNode, _itemProp: string): void => {
  const { model, items } = getContainerScope(node);
  for (const step of items || []) {
    const stepName = (step as any)?.name;
    walkChildren(ctx, getItems(step), stepName ? model?.[stepName] : model, `${stepName}`);
  }
};

/**
 * 遍历 table / group-list。
 *
 * `TableGroupList.vue` 按原始 `config.type` 决定初始展示形态（table 或 groupList），
 * 两种形态的子项结构不同，这里分别复刻（形态间的配置派生复用 `utils/tableGroupList`，
 * 与渲染式实现同源）：
 * - table：逐列（跳过 hidden 列与 display 为假的列）× 逐行渲染 Container，行 prop 为 `${prop}.${index}`；
 * - groupList：逐行渲染一个 row 容器，包含 `items` 全部字段。
 *
 * 与渲染的差异：不做分页截断（table）、不跳过折叠行（groupList）。二者都是列表的视图状态，
 * 与「这些行的值是否合法」无关，无渲染校验覆盖全部行。
 */
export const expandTableGroupList = (ctx: WalkContext, node: WalkNode, itemProp: string): void => {
  const { config, model } = node;
  const name = (config as any).name || '';
  const rows = model?.[name];
  if (!Array.isArray(rows)) return;

  if (isGroupListType((config as any).type)) {
    const groupListConfig = toGroupListConfig(config as any);

    rows.forEach((row, index) => {
      walkNode(ctx, {
        config: getGroupListRowConfig(groupListConfig, index, ctx.mForm?.keyProp) as FormItemConfig,
        model: row,
        prop: appendProp(itemProp, index),
      });
    });
    return;
  }

  const tableItems = toTableConfig(config as any).items;
  if (!Array.isArray(tableItems)) return;

  // 列的 display 在 Table 层用「表格自身的 props」求值，随后 makeTableColumnConfig 会删掉 display
  const tableProps = { model, config, prop: itemProp };
  const evalDisplay = (display: any) => displayFunction(ctx.mForm, display, tableProps);

  rows.forEach((row, index) => {
    for (const column of tableItems) {
      if (!column || !isTableColumnRendered(column, evalDisplay)) continue;

      walkNode(ctx, {
        config: makeTableColumnConfig(column, row) as FormItemConfig,
        model: row,
        prop: appendProp(itemProp, index),
      });
    }
  });
};

/** 遍历已登记嵌套配置的复合字段 */
const walkNestedConfig = (ctx: WalkContext, type: string, node: WalkNode, itemProp: string): boolean => {
  const resolve = getFieldNestedConfig(type);
  if (!resolve) return false;

  let result;
  try {
    result = resolve({
      config: node.config,
      model: node.model,
      prop: itemProp,
      parentProp: node.prop,
      mForm: ctx.mForm,
    });
  } catch (e) {
    throw new FieldNestedConfigError(type, itemProp, e);
  }

  if (!result) return true;

  const nestedModel = result.model ?? node.model;
  const nestedProp = result.prop ?? itemProp;
  const nestedConfig = Array.isArray(result.config) ? result.config : [result.config];
  walkChildren(ctx, nestedConfig, nestedModel, nestedProp);
  return true;
};

/**
 * 遍历一个 Container 节点，分支顺序与 `Container.vue` 的模板保持一致。
 *
 * 对比模式（`isCompare`）在此被忽略：它只改变同一个 prop 渲染几份 FormItem，
 * 规则与取值完全相同，对校验结果没有影响。
 */
const walkNode = (ctx: WalkContext, node: WalkNode): void => {
  const { config, prop } = node;
  const model = node.model ?? {};
  // 与 Container 的 props 对齐：`prop` 是父级 prop，供 display / rules 的上下文使用
  const nodeProps = { model, config, prop };

  const name = (config as any).name || '';
  const items = getItems(config);
  const type = resolveItemType(ctx.mForm, config, nodeProps);
  const itemProp = getItemProp(prop, name);
  const text = filterFunction(ctx.mForm, (config as any).text, nodeProps);

  // hidden 不看 display，始终渲染一个隐藏的 FormItem
  if (type === 'hidden') {
    addField(ctx, { ...node, model }, itemProp, nodeProps);
    return;
  }

  const display = resolveDisplay(ctx, config, nodeProps);

  // 容器分支：不渲染自身的 FormItem，只渲染容器组件。
  // 容器自身的 rules 只有在带 text、会包一层 FormItem 时才会生效（见下一分支），与 Container.vue 一致。
  if (items && !text && type && display) {
    dispatchByType(ctx, type, { ...node, model }, itemProp);
    return;
  }

  // FormItem 分支：只要会包 FormItem，有 rules 就会校验，不要求 type 已登记为叶子。
  if (type && display) {
    addField(ctx, { ...node, model }, itemProp, nodeProps);
    dispatchByType(ctx, type, { ...node, model }, itemProp);
    return;
  }

  // 无 type 的纯嵌套配置：直接递归子项
  if (items && display) {
    const childModel = isValidName(name) ? model[name] : model;
    if (!childModel) return;
    walkChildren(ctx, items, childModel, itemProp);
  }
};

/**
 * 按 type 分派：已登记 walk 的容器 → 按容器模板遍历；登记了嵌套配置的复合字段 → 遍历其内部配置；
 * 叶子字段 → 无子树（先复刻其挂载副作用，若登记了的话）。
 *
 * 未登记的 type：配置里若有 `items` 则按普通容器下钻；否则视为没有嵌套表单项。
 * 自身 rules 已在 FormItem 分支收集，有 rules 就会校验。
 */
const dispatchByType = (ctx: WalkContext, type: string, node: WalkNode, itemProp: string): void => {
  const walkContainer = getContainerWalker(type);
  if (walkContainer) {
    walkContainer(ctx, node, itemProp);
    return;
  }

  if (walkNestedConfig(ctx, type, node, itemProp)) return;

  if (isLeafFieldType(type)) {
    getFieldMountValueEffect(type)?.({ config: node.config, model: node.model, prop: itemProp, mForm: ctx.mForm });
    return;
  }

  const items = getItems(node.config);
  if (items?.length) {
    const { childModel } = getContainerScope(node);
    walkChildren(ctx, items, childModel, itemProp);
  }
};

/**
 * 纯逻辑收集「一份 config + 一份 values」中所有参与校验的字段。
 *
 * 遍历规则与 `Container.vue` 及各容器组件的模板一一对应，因此产出的 prop / rules
 * 与渲染式校验（挂载 MForm 后调用 `validate()`）等价，无需任何 DOM 或组件实例。
 *
 * 注意：`values` 会被就地修改（复刻少数字段组件挂载时的值初始化副作用），
 * 调用方若不希望污染原对象应先自行拷贝。
 *
 * @param mForm - 表单状态；无渲染时由 `createHeadlessFormState` 构造
 * @param config - 表单配置
 * @param values - 表单值（会被就地修改）
 * @param [typeMatchValid] - 是否启用 typeMatch 校验
 * @returns 带规则的字段列表
 */
export const collectValidatableFields = (
  mForm: FormState | undefined,
  config: FormConfig,
  values: FormValue,
  typeMatchValid?: ComputedRef<boolean>,
): CollectedField[] => {
  const ctx: WalkContext = {
    mForm,
    typeMatchValid,
    fields: [],
  };

  if (Array.isArray(config)) {
    walkChildren(ctx, config as FormItemConfig[], values, '');
  }

  return ctx.fields;
};
