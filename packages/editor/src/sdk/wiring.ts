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
 * @fileoverview 依赖收集连线（只处理 DSL，不碰画布 / runtime）。
 *
 * 数据源、代码块的依赖信息（`dataSourceDeps` / `dataSourceCondDeps` / `dataSourceMethodDeps`）
 * 会写回 DSL。这里把「节点变化 -> 重新收集 -> 写回 root」的链路连起来，使 Node 下导出的 DSL
 * 依赖信息完整。浏览器端画布同步仍由 `initService` 负责，两边共用 `./utils/dep` 里的规则。
 *
 * 收集用的是同步的 `dep.collect`，不经过空闲队列，所以操作返回时依赖已经是最新的。
 */

import type { CodeBlockContent, DataSourceSchema, Id, MApp, MComponent, MNode, Target } from '@tmagic/core';
import { createCodeBlockTarget, DepTargetType, NodeType } from '@tmagic/core';
import type { ChangeRecord } from '@tmagic/form';
import { getNodes, isPage } from '@tmagic/utils';

import {
  addDataSourceTargets,
  classifyUpdatedNodes,
  getDataSourceRecollectTypes,
  removeDataSourceTargets,
  removeTargetDeps,
  resetDepTargets,
  writeTargetDeps,
} from './utils/dep';
import type { SdkContext } from './type';

export { classifyUpdatedNodes } from './utils/dep';

export interface WiringHandle {
  unbind(): void;
}

const pendingSelects = new WeakMap<object, Promise<unknown>>();

/** root 变化后自动选中节点是异步的，需要时可以等它完成 */
export const whenWiringSettled = (ctx: SdkContext): Promise<unknown> => pendingSelects.get(ctx) ?? Promise.resolve();

export const bindWiring = (ctx: SdkContext): WiringHandle => {
  const { editor, codeBlock, dataSource, dep, reactivity } = ctx;

  const getPageIdByNode = (node: MComponent): Id | undefined => {
    if (isPage(node)) return node.id;
    return editor.getNodeInfo(node.id).page?.id;
  };

  const collect = (nodes: MComponent[], deep: boolean, type?: DepTargetType) => {
    for (const node of nodes) {
      if (node.type === NodeType.ROOT) continue;
      dep.collect([node], { pageId: getPageIdByNode(node) }, deep, type);
    }
  };

  /** root 变化后选中原来的节点，没有则选中第一个页面（与浏览器端一致） */
  const selectAfterRootChange = (root: MApp) => {
    const nodeId = editor.get('node')?.id;
    const node = nodeId ? editor.getNodeById(nodeId) : null;

    let selecting: Promise<unknown> | undefined;
    if (node && node !== root) {
      selecting = editor.select(node.id);
    } else if (root.items?.length) {
      selecting = editor.select(root.items[0]);
    } else if (root.id) {
      editor.set('nodes', [root]);
      editor.set('parent', null);
      editor.set('page', null);
    }

    if (selecting) {
      pendingSelects.set(
        ctx,
        selecting.catch(() => {}),
      );
    }
  };

  const rootChangeHandler = (root: MApp | null) => {
    if (!root) return;

    root.codeBlocks = root.codeBlocks || {};
    root.dataSources = root.dataSources || [];

    codeBlock.setCodeDsl(root.codeBlocks);
    dataSource.set('dataSources', root.dataSources);

    resetDepTargets(dep, root.codeBlocks, dataSource.get('dataSources'), reactivity.reactive);

    if (Array.isArray(root.items)) {
      dep.clearIdleTasks();
      collect(root.items, true);
    } else {
      dep.clear();
      delete root.dataSourceDeps;
      delete root.dataSourceCondDeps;
    }

    selectAfterRootChange(root);
  };

  const nodeAddHandler = (nodes: MComponent[]) => collect(nodes, true);

  const nodeUpdateHandler = (data: Parameters<typeof classifyUpdatedNodes>[1]) => {
    const { needRecollectNodes, normalNodes } = classifyUpdatedNodes(ctx, data);

    // 数据源引用发生变化的节点需要重新收集数据源依赖
    collect(needRecollectNodes, true, DepTargetType.DATA_SOURCE);
    collect(needRecollectNodes, true, DepTargetType.DATA_SOURCE_COND);

    // 代码块、数据源方法依赖对所有被更新的节点都要收集：同一批里既改了数据源引用又改了方法时不能漏掉
    const updatedNodes = [...needRecollectNodes, ...normalNodes];
    collect(updatedNodes, true, DepTargetType.CODE_BLOCK);
    collect(updatedNodes, true, DepTargetType.DATA_SOURCE_METHOD);
  };

  const nodeRemoveHandler = (nodes: MComponent[]) => dep.clear(nodes);

  const historyChangeHandler = (page: MNode) => collect([page as MComponent], true);

  const dataSourceAddHandler = (config: DataSourceSchema) => addDataSourceTargets(dep, config, reactivity.reactive);

  const dataSourceUpdateHandler = (config: DataSourceSchema, { changeRecords }: { changeRecords: ChangeRecord[] }) => {
    const types = getDataSourceRecollectTypes(changeRecords);
    const items = editor.get('root')?.items;
    if (!types || !Array.isArray(items)) return;

    dep.clearIdleTasks();
    removeDataSourceTargets(dep, config.id, types);
    addDataSourceTargets(dep, config, reactivity.reactive, types);

    for (const type of types) {
      collect(items, true, type);
    }
  };

  const dataSourceRemoveHandler = (id: string) => {
    const root = editor.get('root');
    if (!root) return;

    const nodes = getNodes(Object.keys(root.dataSourceDeps?.[id] || {}), root.items) as MComponent[];

    for (const type of [DepTargetType.DATA_SOURCE, DepTargetType.DATA_SOURCE_COND, DepTargetType.DATA_SOURCE_METHOD]) {
      collect(nodes, false, type);
    }

    removeDataSourceTargets(dep, id);
  };

  const codeBlockAddOrUpdateHandler = (id: Id, content: CodeBlockContent) => {
    if (dep.hasTarget(id, DepTargetType.CODE_BLOCK)) {
      dep.getTarget(id, DepTargetType.CODE_BLOCK)!.name = content.name;
      return;
    }

    dep.addTarget(createCodeBlockTarget(id, content));
  };

  const codeBlockRemoveHandler = (id: Id) => dep.removeTarget(id, DepTargetType.CODE_BLOCK);

  const targetAddHandler = (target: Target) => writeTargetDeps(editor.get('root'), target);

  const targetRemoveHandler = (id: string | number, type: string) => removeTargetDeps(editor.get('root'), id, type);

  const listeners: [{ on: Function; off: Function }, string, (...args: any[]) => void][] = [
    [editor, 'history-change', historyChangeHandler],
    [editor, 'root-change', rootChangeHandler],
    [editor, 'add', nodeAddHandler],
    [editor, 'remove', nodeRemoveHandler],
    [editor, 'update', nodeUpdateHandler],
    [dataSource, 'add', dataSourceAddHandler],
    [dataSource, 'update', dataSourceUpdateHandler],
    [dataSource, 'remove', dataSourceRemoveHandler],
    [codeBlock, 'addOrUpdate', codeBlockAddOrUpdateHandler],
    [codeBlock, 'remove', codeBlockRemoveHandler],
    [dep, 'add-target', targetAddHandler],
    [dep, 'remove-target', targetRemoveHandler],
  ];

  for (const [service, event, handler] of listeners) {
    service.on(event, handler);
  }

  // 绑定时 DSL 已经设置过（如 `autoWiring: false` 之后再手动绑定）：补做一次初始化与收集
  const root = editor.get('root');
  if (root) rootChangeHandler(root);

  return {
    unbind() {
      for (const [service, event, handler] of listeners) {
        service.off(event, handler);
      }
    },
  };
};
