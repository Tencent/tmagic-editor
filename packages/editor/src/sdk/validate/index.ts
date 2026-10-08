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

/**
 * @fileoverview DSL 校验：
 *
 * - 结构合法性：组件类型是否在组件列表中、父节点是否是容器、`canDropIn`、
 *   页面片是否被禁用、id 是否重复、数据源类型是否可用；
 * - 属性合法性：用 `@tmagic/form/headless` 的 `validateForm` 校验节点 / 数据源的表单配置。
 *
 * 模式见 {@link ValidateMode}：`strict` 抛 {@link DslValidationError}，`record` 写入
 * `editor.state.invalidNodeIds`，`off` 什么也不做。
 */

import { cloneDeep, mergeWith } from 'lodash-es';

import type { DataSourceSchema, Id, MContainer, MNode } from '@tmagic/core';
import { NodeType } from '@tmagic/core';
import type { FormConfig } from '@tmagic/form/headless';
import { builtInFields, registerBuiltInFields, validateForm } from '@tmagic/form/headless';
import { isPage, isPageFragment, isPageOrFragment, toLine, traverseNode } from '@tmagic/utils';

import type { CanDropInScene } from '@editor/type';
import { editorNodeMergeCustomizer } from '@editor/utils/editor';

import type { DslValidationIssue, DslValidationResult, SdkContext } from '../type';

/** 校验不通过时抛出，`errors` 里是全部问题，调用方（如 agent）可据此修正后重试 */
export class DslValidationError extends Error {
  public readonly errors: DslValidationIssue[];

  constructor(errors: DslValidationIssue[]) {
    super(
      `DSL 校验失败：${errors
        .map((item) => `${item.id !== undefined ? `[${item.target}:${item.id}] ` : ''}${item.message}`)
        .join('；')}`,
    );
    this.name = 'DslValidationError';
    this.errors = errors;
  }
}

/** 内置的、不需要出现在组件列表里也合法的节点类型 */
const BUILTIN_NODE_TYPES = new Set<string>([NodeType.ROOT, NodeType.PAGE, NodeType.PAGE_FRAGMENT, 'container']);

/** 内置的数据源类型 */
const BUILTIN_DATA_SOURCE_TYPES = new Set<string>(['base', 'http']);

const BR_REG = /<br\s*\/?>/gi;

/** `validateForm` 返回的是以 `<br>` 分隔的文案，拆成单条问题 */
const splitErrorText = (error: string): string[] =>
  error
    .split(BR_REG)
    .map((item) => item.trim())
    .filter(Boolean);

/**
 * `record` 模式下，校验结果要等到修改落进 DSL 之后再写入 `invalidNodeIds`（修改过程中会先清掉旧记录），
 * 因此 guard 返回一个提交函数交给调用方在合适的时机调用；`strict` 抛错，`off` 返回空。
 */
export type GuardCommit = (() => void) | undefined;

export interface Validator {
  /** 校验 DSL 中已有节点：结构（类型 / 父子关系）+ 属性表单 */
  node(id: Id): Promise<DslValidationResult>;
  /** 校验 DSL 中已有的数据源 */
  dataSource(id: Id): Promise<DslValidationResult>;
  /** 校验整份 DSL */
  dsl(): Promise<DslValidationResult>;

  /** 校验一个节点配置的属性表单（不要求它已经在 DSL 中） */
  checkNodeProps(node: MNode): Promise<DslValidationIssue[]>;
  /** 同步的结构校验：新增 */
  checkAddStructure(node: MNode, parent: MContainer | null | undefined): DslValidationIssue[];
  /** 同步的结构校验：移动 */
  checkMoveStructure(sourceIds: Id[], target: MContainer, scene: CanDropInScene): DslValidationIssue[];
  /** 同步的结构校验：数据源配置 */
  checkDataSourceStructure(config: DataSourceSchema, isNew: boolean): DslValidationIssue[];

  /** 供 service 在修改前调用：按 `validateMode` 抛出 / 记录 / 忽略。 */
  guardAdd(items: { node: MNode; parentNode: MContainer }[]): Promise<GuardCommit>;
  /** `replace` 与 `editor.update` 的同名选项一致：为 true 时整节点替换，否则与旧节点深合并 */
  guardUpdate(nodes: MNode[], options?: { replace?: boolean }): Promise<GuardCommit>;
  guardMove(sourceIds: Id[], target: MContainer, scene: CanDropInScene): Promise<void>;
  guardDataSource(config: DataSourceSchema, isNew: boolean): void;
}

const toResult = (errors: DslValidationIssue[]): DslValidationResult => ({
  valid: errors.length === 0,
  errors,
});

const structureIssue = (
  target: DslValidationIssue['target'],
  id: Id | undefined,
  message: string,
  extra: Partial<DslValidationIssue> = {},
): DslValidationIssue => ({ target, id, kind: 'structure', message, ...extra });

const nodeIssue = (id: Id | undefined, message: string, extra?: Partial<DslValidationIssue>) =>
  structureIssue('node', id, message, extra);

/** 节点及其所有子孙（先序） */
const flattenNode = (node: MNode): MNode[] => {
  const nodes: MNode[] = [];
  traverseNode(node, (item) => {
    nodes.push(item);
  });
  return nodes;
};

const isEmptyId = (id: Id | undefined) => id === undefined || id === null || id === '';

const DUPLICATE_ID_SUGGESTION = '请使用唯一的 id，或不传 id 由编辑器自动生成';

export const createValidator = (ctx: SdkContext): Validator => {
  const mode = () => ctx.validateMode;

  let builtInRegistered = false;
  const ensureFields = () => {
    if (builtInRegistered) return;
    registerBuiltInFields(builtInFields);
    builtInRegistered = true;
  };

  let cachedFormContext: object | undefined;
  const formContext = () =>
    (cachedFormContext ??= {
      services: {
        editorService: ctx.editor,
        propsService: ctx.props,
        historyService: ctx.history,
        dataSourceService: ctx.dataSource,
        codeBlockService: ctx.codeBlock,
        depService: ctx.dep,
        storageService: ctx.storage,
        eventsService: ctx.events,
        componentListService: ctx.componentList,
      },
      stage: null,
    });

  const knownTypes = (): Set<string> | null => {
    const set = new Set<string>();
    for (const group of ctx.componentList.getList()) {
      for (const item of group.items ?? []) {
        set.add(toLine(item.type));
      }
    }
    // 没有登记组件列表时无从判断，不做类型校验
    return set.size ? set : null;
  };

  const isKnownType = (type: string, known: Set<string> | null) =>
    BUILTIN_NODE_TYPES.has(type) || BUILTIN_NODE_TYPES.has(toLine(type)) || !known || known.has(toLine(type));

  /** 节点类型合法性：在组件列表中、没有被禁用的页面片 */
  const checkNodeType = (node: MNode, known = knownTypes()): DslValidationIssue[] => {
    const issues: DslValidationIssue[] = [];

    if (!isKnownType(node.type || '', known)) {
      issues.push(
        nodeIssue(node.id, `组件类型「${node.type}」不在组件列表中`, {
          path: 'type',
          suggestion: `可用类型：${[...(known ?? [])].join('、')}`,
        }),
      );
    }

    if (isPageFragment(node) && ctx.editor.getConfig().disabledPageFragment) {
      issues.push(nodeIssue(node.id, '当前配置禁用了页面片（disabledPageFragment）', { path: 'type' }));
    }

    return issues;
  };

  /** 新增的节点 id 在这批节点内、或与当前 DSL 里已有节点重复 */
  const findDuplicateIds = (nodes: MNode[]): DslValidationIssue[] => {
    const issues: DslValidationIssue[] = [];
    const seen = new Set<Id>();

    for (const { id } of nodes.flatMap(flattenNode)) {
      if (isEmptyId(id)) continue;

      if (seen.has(id)) {
        issues.push(nodeIssue(id, `节点 id「${id}」重复`, { suggestion: DUPLICATE_ID_SUGGESTION }));
        continue;
      }

      seen.add(id);
      if (ctx.editor.getNodeById(id, false)) {
        issues.push(nodeIssue(id, `节点 id「${id}」已存在于当前 DSL`, { suggestion: DUPLICATE_ID_SUGGESTION }));
      }
    }

    return issues;
  };

  const canDropIn = (sourceIds: Id[], target: MContainer, scene: CanDropInScene): DslValidationIssue | null => {
    const fn = ctx.editor.getConfig().canDropIn;
    if (!fn) return null;

    const result = fn(sourceIds, target.id, scene);
    if (result === false) {
      return nodeIssue(target.id, `不允许放入容器「${target.id}」（canDropIn 返回 false）`);
    }

    if (typeof result !== 'string' && typeof result !== 'number') return null;

    // 重定向：被重定向的目标必须存在，且同样是容器
    const redirected = ctx.editor.getNodeById(result, false);
    if (redirected && Array.isArray((redirected as MContainer).items)) return null;

    return nodeIssue(target.id, `canDropIn 将容器「${target.id}」重定向到「${result}」，但该节点不存在或不是容器`);
  };

  /** 新增节点对父节点的要求 */
  const checkAddParent = (node: MNode, parent: MContainer | null | undefined): DslValidationIssue | null => {
    if (!parent) return nodeIssue(node.id, '未找到父节点');
    if (!Array.isArray(parent.items)) return nodeIssue(node.id, `父节点「${parent.id}」不是容器（没有 items）`);

    if (isPageOrFragment(node)) {
      return parent.type === NodeType.ROOT ? null : nodeIssue(node.id, '页面 / 页面片只能添加到 app 下');
    }

    if (parent.type === NodeType.ROOT) return nodeIssue(node.id, 'app 下只能添加页面或页面片');

    return canDropIn([], parent, 'stage-add');
  };

  const checkAddStructure: Validator['checkAddStructure'] = (node, parent) => {
    const known = knownTypes();

    const issues = flattenNode(node).flatMap((item) =>
      item.type ? checkNodeType(item, known) : [nodeIssue(item.id, '组件类型不能为空')],
    );

    const parentIssue = checkAddParent(node, parent);
    if (parentIssue) issues.push(parentIssue);

    return issues;
  };

  /** 被移动的节点：必须存在，且不能移动到自己或子孙里 */
  const checkMoveSource = (id: Id, target: MContainer): DslValidationIssue[] => {
    const source = ctx.editor.getNodeById(id, false);
    if (!source) return [nodeIssue(id, `要移动的节点「${id}」不存在`)];
    if (isPageOrFragment(source)) return [];

    return flattenNode(source).some((item) => item.id === target.id)
      ? [nodeIssue(id, `不能把节点「${id}」移动到它自己或子节点里`)]
      : [];
  };

  const checkMoveStructure: Validator['checkMoveStructure'] = (sourceIds, target, scene) => {
    if (!Array.isArray(target.items)) {
      return [nodeIssue(target.id, `目标节点「${target.id}」不是容器（没有 items）`)];
    }

    const issues = sourceIds.flatMap((id) => checkMoveSource(id, target));

    const targetIssue =
      target.type === NodeType.ROOT
        ? nodeIssue(target.id, 'app 下只能放页面或页面片')
        : canDropIn(sourceIds, target, scene);
    if (targetIssue) issues.push(targetIssue);

    return issues;
  };

  // add 在 id 冲突时会自动重新生成 id，不算错误，所以不区分是否新增
  const checkDataSourceStructure: Validator['checkDataSourceStructure'] = (config) => {
    const type = config.type || 'base';

    const known = new Set<string>([
      ...BUILTIN_DATA_SOURCE_TYPES,
      ...ctx.dataSource.get('datasourceTypeList').map((item) => toLine(item.type)),
      ...Object.keys(ctx.dataSource.get('configs')),
    ]);

    if (known.has(toLine(type))) return [];

    return [
      structureIssue('data-source', config.id, `数据源类型「${type}」不可用`, {
        path: 'type',
        suggestion: `可用类型：${[...known].join('、')}`,
      }),
    ];
  };

  /** 用 `validateForm` 校验属性表单，配置不存在时不校验；校验本身出错也作为一条问题返回 */
  const checkProps = async (
    target: 'node' | 'data-source',
    id: Id,
    values: MNode | DataSourceSchema,
    getConfig: () => Promise<FormConfig | undefined> | FormConfig | undefined,
    options: { useFieldTextInError?: boolean } = {},
  ): Promise<DslValidationIssue[]> => {
    const toIssues = (messages: string[]): DslValidationIssue[] =>
      messages.map((message) => ({ target, id, kind: 'props', message }));

    try {
      const config = await getConfig();
      if (!config?.length) return [];

      ensureFields();

      const error = await validateForm({
        config,
        typeMatchValid: true,
        initValues: values,
        context: formContext() as any,
        ...options,
      });

      return toIssues(splitErrorText(error));
    } catch (e: any) {
      return toIssues([`属性校验异常：${e?.message ?? e}`]);
    }
  };

  const checkNodeProps: Validator['checkNodeProps'] = async (node) => {
    if (!node.type || node.type === NodeType.ROOT) return [];

    return checkProps('node', node.id, node, () => ctx.props.getPropsConfig(node.type!, { node }), {
      useFieldTextInError: true,
    });
  };

  const checkDataSourceProps = (config: DataSourceSchema) =>
    checkProps('data-source', config.id, config, () => ctx.dataSource.getFormConfig(config.type || 'base'));

  /** 已存在节点的结构校验：类型合法 */
  const checkExistingNodeStructure = (node: MNode) => checkNodeType(node);

  const validateNode = async (id: Id): Promise<DslValidationIssue[]> => {
    const node = ctx.editor.getNodeById(id, false);
    if (!node) return [nodeIssue(id, `节点「${id}」不存在`)];

    const propsIssues = !isPage(node) || node.items ? await checkNodeProps(node) : [];
    return [...checkExistingNodeStructure(node), ...propsIssues];
  };

  const validateDataSource = async (id: Id): Promise<DslValidationIssue[]> => {
    const ds = ctx.dataSource.getDataSourceById(`${id}`);
    if (!ds) return [structureIssue('data-source', id, `数据源「${id}」不存在`)];

    return [...checkDataSourceStructure(ds, false), ...(await checkDataSourceProps(ds))];
  };

  /** 按模式处理问题：strict 抛错；record 返回写入 invalidNodeIds 的提交函数 */
  const handle = (issues: DslValidationIssue[], recordIds: Id[] = []): GuardCommit => {
    if (mode() === 'strict') {
      if (issues.length) throw new DslValidationError(issues);
      return undefined;
    }

    if (mode() !== 'record') return undefined;

    return () => {
      for (const id of recordIds) {
        ctx.editor.deleteInvalidNode(id, 'props');
      }

      const grouped = new Map<Id, string[]>();
      for (const issue of issues) {
        if (issue.target !== 'node' || issue.id === undefined) continue;
        grouped.set(issue.id, [...(grouped.get(issue.id) ?? []), issue.message]);
      }
      for (const [id, messages] of grouped) {
        ctx.editor.setInvalidNode(id, 'props', messages.join('<br>'));
      }
    };
  };

  /** update 的单个节点：类型不可变，并校验 update 实际会写入的结果 */
  const checkUpdatedNode = async (
    node: MNode,
    replace: boolean,
  ): Promise<{ id?: Id; issues: DslValidationIssue[] }> => {
    const old = ctx.editor.getNodeById(node.id, false);
    if (!old) return { issues: [nodeIssue(node.id, `节点「${node.id}」不存在`)] };
    if (old.type === NodeType.ROOT) return { issues: [] };

    const issues: DslValidationIssue[] = [];

    if (node.type && node.type !== old.type) {
      issues.push(nodeIssue(node.id, `不允许修改节点类型（${old.type} -> ${node.type}）`, { path: 'type' }));
    }

    // 与 `Editor.doUpdate` 一致：replace 时整节点替换，否则深合并
    const merged: MNode = replace
      ? cloneDeep(node)
      : mergeWith(cloneDeep(ctx.reactivity.toRaw(old)), cloneDeep(node), editorNodeMergeCustomizer);
    issues.push(...checkExistingNodeStructure(merged), ...(await checkNodeProps(merged)));

    return { id: node.id, issues };
  };

  return {
    async node(id) {
      return toResult(await validateNode(id));
    },

    async dataSource(id) {
      return toResult(await validateDataSource(id));
    },

    async dsl() {
      const root = ctx.editor.get('root');
      if (!root) return toResult([structureIssue('dsl', undefined, 'DSL 为空')]);

      const ids = flattenNode(root)
        .filter((node) => node.type !== NodeType.ROOT)
        .map((node) => node.id);

      // 重复 id：同一个 DSL 内出现两次
      const seen = new Set<Id>();
      const issues = ids
        .filter((id) => {
          const duplicated = seen.has(id);
          seen.add(id);
          return duplicated;
        })
        .map((id) => nodeIssue(id, `节点 id「${id}」重复`, { suggestion: DUPLICATE_ID_SUGGESTION }));

      for (const id of seen) {
        issues.push(...(await validateNode(id)));
      }

      for (const ds of ctx.dataSource.get('dataSources')) {
        issues.push(...(await validateDataSource(ds.id)));
      }

      return toResult(issues);
    },

    checkNodeProps,
    checkAddStructure,
    checkMoveStructure,
    checkDataSourceStructure,

    async guardAdd(items) {
      if (mode() === 'off') return undefined;

      const nodes = items.flatMap(({ node }) => flattenNode(node));

      const issues = [
        ...findDuplicateIds(items.map(({ node }) => node)),
        ...items.flatMap(({ node, parentNode }) => checkAddStructure(node, parentNode)),
      ];

      for (const node of nodes) {
        issues.push(...(await checkNodeProps(node)));
      }

      return handle(
        issues,
        nodes.map((node) => node.id),
      );
    },

    async guardUpdate(nodes, { replace = false } = {}) {
      if (mode() === 'off') return undefined;

      const results = await Promise.all(nodes.map((node) => checkUpdatedNode(node, replace)));

      return handle(
        results.flatMap(({ issues }) => issues),
        results.flatMap(({ id }) => (id === undefined ? [] : [id])),
      );
    },

    // 移动 / 数据源只有结构问题，没有可挂载到节点属性上的错误，因此只在 strict 模式下生效
    async guardMove(sourceIds, target, scene) {
      if (mode() !== 'strict') return;
      handle(checkMoveStructure(sourceIds, target, scene));
    },

    guardDataSource(config, isNew) {
      if (mode() !== 'strict') return;
      handle(checkDataSourceStructure(config, isNew));
    },
  };
};
