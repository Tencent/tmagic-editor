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

import { toRaw } from 'vue';
import { cloneDeep } from 'lodash-es';

import type { Id, MApp, MContainer, MNode, MPage, MPageFragment } from '@tmagic/core';
import { NodeType } from '@tmagic/core';
import type StageCore from '@tmagic/stage';
import { isPage, isPageFragment } from '@tmagic/utils';

import type { EditorNodeInfo, StepValue } from '@editor/type';
import { getNodeIndex } from '@editor/utils/editor';

export interface HistoryOpContext {
  root: MApp;
  stage: StageCore | null;
  getNodeById(id: Id, raw?: boolean): MNode | null;
  getNodeInfo(id: Id, raw?: boolean): EditorNodeInfo;
  setRoot(root: MApp): void;
  setPage(page: MPage | MPageFragment): void;
  getPage(): MPage | MPageFragment | null;
}

/**
 * 应用 add 类型的历史操作
 * reverse=true（撤销）：从父节点中移除已添加的节点
 * reverse=false（重做）：重新添加节点到父节点中
 */
export async function applyHistoryAddOp(step: StepValue, reverse: boolean, ctx: HistoryOpContext): Promise<void> {
  const { root, stage } = ctx;

  if (reverse) {
    for (const node of step.nodes ?? []) {
      const parent = ctx.getNodeById(step.parentId!, false) as MContainer;
      if (!parent?.items) continue;
      const idx = getNodeIndex(node.id, parent);
      if (typeof idx === 'number' && idx !== -1) {
        parent.items.splice(idx, 1);
      }
      await stage?.remove({ id: node.id, parentId: parent.id, root: cloneDeep(root) });
    }
  } else {
    const parent = ctx.getNodeById(step.parentId!, false) as MContainer;
    if (parent?.items) {
      for (const node of step.nodes ?? []) {
        const idx = step.indexMap?.[node.id] ?? parent.items.length;
        parent.items.splice(idx, 0, cloneDeep(node));
        await stage?.add({
          config: cloneDeep(node),
          parent: cloneDeep(parent),
          parentId: parent.id,
          root: cloneDeep(root),
        });
      }
    }
  }
}

/**
 * 应用 remove 类型的历史操作
 * reverse=true（撤销）：将已删除的节点按原位置重新插入
 * reverse=false（重做）：再次删除节点
 */
export async function applyHistoryRemoveOp(step: StepValue, reverse: boolean, ctx: HistoryOpContext): Promise<void> {
  const { root, stage } = ctx;

  if (reverse) {
    const sorted = [...(step.removedItems ?? [])].sort((a, b) => a.index - b.index);
    for (const { node, parentId, index } of sorted) {
      const parent = ctx.getNodeById(parentId, false) as MContainer;
      if (!parent?.items) continue;
      parent.items.splice(index, 0, cloneDeep(node));
      await stage?.add({ config: cloneDeep(node), parent: cloneDeep(parent), parentId, root: cloneDeep(root) });
    }
  } else {
    for (const { node, parentId } of step.removedItems ?? []) {
      const parent = ctx.getNodeById(parentId, false) as MContainer;
      if (!parent?.items) continue;
      const idx = getNodeIndex(node.id, parent);
      if (typeof idx === 'number' && idx !== -1) {
        parent.items.splice(idx, 1);
      }
      await stage?.remove({ id: node.id, parentId, root: cloneDeep(root) });
    }
  }
}

/**
 * 应用 update 类型的历史操作
 * reverse=true（撤销）：将节点恢复为 oldNode
 * reverse=false（重做）：将节点更新为 newNode
 */
export async function applyHistoryUpdateOp(step: StepValue, reverse: boolean, ctx: HistoryOpContext): Promise<void> {
  const { root, stage } = ctx;
  const items = step.updatedItems ?? [];

  for (const { oldNode, newNode } of items) {
    const config = reverse ? oldNode : newNode;
    if (config.type === NodeType.ROOT) {
      ctx.setRoot(cloneDeep(config) as MApp);
      continue;
    }
    const info = ctx.getNodeInfo(config.id, false);
    if (!info.parent) continue;
    const idx = getNodeIndex(config.id, info.parent);
    if (typeof idx !== 'number' || idx === -1) continue;
    info.parent.items![idx] = cloneDeep(config);

    if (isPage(config) || isPageFragment(config)) {
      ctx.setPage(config as MPage | MPageFragment);
    }
  }

  const curPage = ctx.getPage();
  if (stage && curPage) {
    await stage.update({
      config: cloneDeep(toRaw(curPage)),
      parentId: root.id,
      root: cloneDeep(toRaw(root)),
    });
  }
}
