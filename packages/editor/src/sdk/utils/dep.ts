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
 * @fileoverview 依赖收集的纯规则：哪些变化需要重新收集、依赖目标怎么建、依赖信息怎么写回 root。
 *
 * SDK 的 `wiring`（同步收集）与浏览器端 `initService`（空闲队列收集 + 画布同步）共用，
 * 两边只在「怎么收集」上不同，规则必须保持一致。
 */

import type { CodeBlockDSL, DataSourceSchema, Id, MApp, MComponent, Target } from '@tmagic/core';
import {
  createCodeBlockTarget,
  createDataSourceCondTarget,
  createDataSourceMethodTarget,
  createDataSourceTarget,
  DepTargetType,
  NODE_CONDS_KEY,
  NodeType,
} from '@tmagic/core';
import type { ChangeRecord } from '@tmagic/form';
import { isValueIncludeDataSource } from '@tmagic/utils';

import { isIncludeDataSource } from '@editor/utils/editor';

import type Dep from '../services/Dep';
import type { Reactivity } from '../type';

type DataSourceDepType = DepTargetType.DATA_SOURCE | DepTargetType.DATA_SOURCE_COND | DepTargetType.DATA_SOURCE_METHOD;

/** 数据源依赖类型 -> 写回 root 的字段 */
const DEPS_KEY = {
  [DepTargetType.DATA_SOURCE]: 'dataSourceDeps',
  [DepTargetType.DATA_SOURCE_COND]: 'dataSourceCondDeps',
  [DepTargetType.DATA_SOURCE_METHOD]: 'dataSourceMethodDeps',
} as const;

const DATA_SOURCE_DEP_TYPES: DataSourceDepType[] = [
  DepTargetType.DATA_SOURCE,
  DepTargetType.DATA_SOURCE_COND,
  DepTargetType.DATA_SOURCE_METHOD,
];

const DATA_SOURCE_TARGET_CREATORS = {
  [DepTargetType.DATA_SOURCE]: createDataSourceTarget,
  [DepTargetType.DATA_SOURCE_COND]: createDataSourceCondTarget,
  [DepTargetType.DATA_SOURCE_METHOD]: createDataSourceMethodTarget,
};

const isDataSourceDepType = (type: string): type is DataSourceDepType => type in DEPS_KEY;

type UpdatedItem = { newNode: MComponent; oldNode: MComponent; changeRecords?: ChangeRecord[] };

/** 显示条件（`NODE_CONDS_KEY`）相关的字段 */
const isCondsPath = (propPath: string) =>
  new RegExp(`${NODE_CONDS_KEY}.(\\d)+.cond`).test(propPath) ||
  new RegExp(`${NODE_CONDS_KEY}.(\\d)+.cond.(\\d)+.value`).test(propPath) ||
  propPath === NODE_CONDS_KEY;

/**
 * 判断一批已更新的节点哪些需要重新收集数据源依赖。
 *
 * - 根节点、数据源相关的字段变化、修改的 key 已经在收集到的依赖中：需要重新收集
 * - 其余只需要收集代码块、数据源方法依赖
 */
export const classifyUpdatedNodes = (
  ctx: { dep: Pick<Dep, 'getTargets'> },
  data: UpdatedItem[],
): { needRecollectNodes: MComponent[]; normalNodes: MComponent[] } => {
  const needRecollectNodes: MComponent[] = [];
  const normalNodes: MComponent[] = [];

  const needRecollect = ({ newNode, oldNode, changeRecords }: UpdatedItem) => {
    if (!changeRecords?.length) return isIncludeDataSource(newNode, oldNode);

    const dataSourceTargets = Object.values(ctx.dep.getTargets(DepTargetType.DATA_SOURCE) || {});

    return changeRecords.some(({ propPath, value }) => {
      if (!propPath || isCondsPath(propPath) || isValueIncludeDataSource(value)) return true;

      // 修改的key在收集的依赖中，则需要触发重新收集
      return dataSourceTargets.some((target) => target.deps[newNode.id]?.keys.includes(propPath));
    });
  };

  for (const item of data) {
    // 同一节点只归入其中一类
    const isRecollect = item.newNode.type !== NodeType.ROOT && needRecollect(item);
    (isRecollect ? needRecollectNodes : normalNodes).push(item.newNode);
  }

  return { needRecollectNodes, normalNodes };
};

/** 数据源变化规则：命中的 propPath 需要重建并重新收集哪些依赖 */
const DATA_SOURCE_RECOLLECT_RULES: { types: DataSourceDepType[]; test: (propPath: string) => boolean }[] = [
  {
    types: [DepTargetType.DATA_SOURCE, DepTargetType.DATA_SOURCE_COND],
    test: (path) =>
      path === 'fields' ||
      /fields.(\d)+.name/.test(path) ||
      /fields.(\d)+.defaultValue/.test(path) ||
      /fields.(\d)+$/.test(path),
  },
  { types: [DepTargetType.DATA_SOURCE], test: (path) => path === 'mocks' },
  {
    types: [DepTargetType.DATA_SOURCE_METHOD],
    test: (path) => path === 'methods' || /methods.(\d)+.name/.test(path) || /methods.(\d)+$/.test(path),
  },
];

/**
 * 数据源更新后需要重建 / 重新收集的依赖类型；没有影响依赖的变化时返回 `null`。
 * 按变更记录顺序，取第一条命中规则的记录。
 */
export const getDataSourceRecollectTypes = (changeRecords: ChangeRecord[]): DataSourceDepType[] | null => {
  for (const { propPath } of changeRecords) {
    if (!propPath) continue;

    const rule = DATA_SOURCE_RECOLLECT_RULES.find(({ test }) => test(propPath));
    if (rule) return rule.types;
  }

  return null;
};

/** 为数据源创建依赖目标（默认三类都建），`reactive` 用于使依赖结果在浏览器端可被订阅 */
export const addDataSourceTargets = (
  dep: Pick<Dep, 'addTarget'>,
  ds: DataSourceSchema,
  reactive: Reactivity['reactive'],
  types: DataSourceDepType[] = DATA_SOURCE_DEP_TYPES,
) => {
  for (const type of types) {
    dep.addTarget(DATA_SOURCE_TARGET_CREATORS[type](ds, reactive({})));
  }
};

export const removeDataSourceTargets = (
  dep: Pick<Dep, 'removeTarget'>,
  id: string,
  types: DataSourceDepType[] = DATA_SOURCE_DEP_TYPES,
) => {
  for (const type of types) {
    dep.removeTarget(id, type);
  }
};

/** root 变化后重建所有依赖目标：代码块 + 数据源 */
export const resetDepTargets = (
  dep: Pick<Dep, 'clearTargets' | 'addTarget'>,
  codeBlocks: CodeBlockDSL,
  dataSources: DataSourceSchema[],
  reactive: Reactivity['reactive'],
) => {
  dep.clearTargets();

  for (const [id, code] of Object.entries(codeBlocks)) {
    dep.addTarget(createCodeBlockTarget(id, code));
  }

  for (const ds of dataSources) {
    addDataSourceTargets(dep, ds, reactive);
  }
};

/** 依赖目标新增后，把依赖信息写回 root */
export const writeTargetDeps = (root: MApp | null | undefined, target: Target) => {
  if (!root || !isDataSourceDepType(target.type)) return;

  const key = DEPS_KEY[target.type];
  root[key] = root[key] || {};
  root[key]![target.id] = target.deps;
};

/** 依赖目标移除后，从 root 上清掉对应的依赖信息 */
export const removeTargetDeps = (root: MApp | null | undefined, id: Id, type: string) => {
  if (!root || !isDataSourceDepType(type)) return;

  delete root[DEPS_KEY[type]]?.[id];
};
