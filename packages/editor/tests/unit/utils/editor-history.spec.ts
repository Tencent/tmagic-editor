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

import { describe, expect, test, vi } from 'vitest';

import type { MApp, MContainer, MNode } from '@tmagic/core';
import { NodeType } from '@tmagic/core';

import type { StepValue } from '@editor/type';
import type { HistoryOpContext } from '@editor/utils/editor-history';
import { applyHistoryAddOp, applyHistoryRemoveOp, applyHistoryUpdateOp } from '@editor/utils/editor-history';

const makePage = (): MContainer => ({
  id: 'page_1',
  type: NodeType.PAGE,
  items: [
    { id: 'n1', type: 'text' },
    { id: 'n2', type: 'button' },
  ],
});

const makeRoot = (page: MContainer): MApp => ({
  id: 'app_1',
  type: NodeType.ROOT,
  items: [page],
});

const makeCtx = (root: MApp): HistoryOpContext => {
  const page = root.items[0] as MContainer;
  return {
    root,
    stage: {
      add: vi.fn(),
      remove: vi.fn(),
      update: vi.fn(),
    } as any,
    getNodeById: (id: any) => {
      if (`${id}` === `${root.id}`) return root as unknown as MNode;
      if (`${id}` === `${page.id}`) return page as unknown as MNode;
      return page.items.find((n) => `${n.id}` === `${id}`) ?? null;
    },
    getNodeInfo: (id: any) => {
      if (`${id}` === `${page.id}`) {
        return { node: page as unknown as MNode, parent: root as unknown as MContainer, page: page as any };
      }
      const node = page.items.find((n) => `${n.id}` === `${id}`);
      return { node: node ?? null, parent: node ? page : null, page: page as any };
    },
    setRoot: vi.fn(),
    setPage: vi.fn(),
    getPage: () => page as any,
  };
};

describe('applyHistoryAddOp', () => {
  test('撤销 add：从父节点移除已添加的节点', async () => {
    const page = makePage();
    const root = makeRoot(page);
    const ctx = makeCtx(root);

    const step: StepValue = {
      opType: 'add',
      selectedBefore: [],
      selectedAfter: ['n1'],
      modifiedNodeIds: new Map(),
      nodes: [{ id: 'n1', type: 'text' }],
      parentId: 'page_1',
    };

    expect(page.items).toHaveLength(2);
    await applyHistoryAddOp(step, true, ctx);
    expect(page.items).toHaveLength(1);
    expect(page.items[0].id).toBe('n2');
    expect(ctx.stage!.remove).toHaveBeenCalled();
  });

  test('重做 add：重新添加节点到父节点', async () => {
    const page: MContainer = { id: 'page_1', type: NodeType.PAGE, items: [] };
    const root = makeRoot(page);
    const ctx = makeCtx(root);

    const step: StepValue = {
      opType: 'add',
      selectedBefore: [],
      selectedAfter: ['new1'],
      modifiedNodeIds: new Map(),
      nodes: [{ id: 'new1', type: 'text' }],
      parentId: 'page_1',
      indexMap: { new1: 0 },
    };

    await applyHistoryAddOp(step, false, ctx);
    expect(page.items).toHaveLength(1);
    expect(page.items[0].id).toBe('new1');
    expect(ctx.stage!.add).toHaveBeenCalled();
  });
});

describe('applyHistoryRemoveOp', () => {
  test('撤销 remove：将已删除节点按原位置重新插入', async () => {
    const page: MContainer = { id: 'page_1', type: NodeType.PAGE, items: [{ id: 'n2', type: 'button' }] };
    const root = makeRoot(page);
    const ctx = makeCtx(root);

    const step: StepValue = {
      opType: 'remove',
      selectedBefore: ['n1'],
      selectedAfter: [],
      modifiedNodeIds: new Map(),
      removedItems: [{ node: { id: 'n1', type: 'text' }, parentId: 'page_1', index: 0 }],
    };

    await applyHistoryRemoveOp(step, true, ctx);
    expect(page.items).toHaveLength(2);
    expect(page.items[0].id).toBe('n1');
    expect(ctx.stage!.add).toHaveBeenCalled();
  });

  test('重做 remove：再次删除节点', async () => {
    const page = makePage();
    const root = makeRoot(page);
    const ctx = makeCtx(root);

    const step: StepValue = {
      opType: 'remove',
      selectedBefore: [],
      selectedAfter: [],
      modifiedNodeIds: new Map(),
      removedItems: [{ node: { id: 'n1', type: 'text' }, parentId: 'page_1', index: 0 }],
    };

    expect(page.items).toHaveLength(2);
    await applyHistoryRemoveOp(step, false, ctx);
    expect(page.items).toHaveLength(1);
    expect(page.items[0].id).toBe('n2');
    expect(ctx.stage!.remove).toHaveBeenCalled();
  });
});

describe('applyHistoryUpdateOp', () => {
  test('撤销 update：将节点恢复为 oldNode', async () => {
    const page = makePage();
    const root = makeRoot(page);
    const ctx = makeCtx(root);

    const step: StepValue = {
      opType: 'update',
      selectedBefore: [],
      selectedAfter: [],
      modifiedNodeIds: new Map(),
      updatedItems: [
        {
          oldNode: { id: 'n1', type: 'text', text: 'before' },
          newNode: { id: 'n1', type: 'text', text: 'after' },
        },
      ],
    };

    await applyHistoryUpdateOp(step, true, ctx);
    expect(page.items[0].text).toBe('before');
    expect(ctx.stage!.update).toHaveBeenCalled();
  });

  test('重做 update：将节点更新为 newNode', async () => {
    const page = makePage();
    const root = makeRoot(page);
    const ctx = makeCtx(root);

    const step: StepValue = {
      opType: 'update',
      selectedBefore: [],
      selectedAfter: [],
      modifiedNodeIds: new Map(),
      updatedItems: [
        {
          oldNode: { id: 'n1', type: 'text', text: 'before' },
          newNode: { id: 'n1', type: 'text', text: 'after' },
        },
      ],
    };

    await applyHistoryUpdateOp(step, false, ctx);
    expect(page.items[0].text).toBe('after');
  });

  test('update ROOT 类型调用 setRoot', async () => {
    const page = makePage();
    const root = makeRoot(page);
    const ctx = makeCtx(root);

    const step: StepValue = {
      opType: 'update',
      selectedBefore: [],
      selectedAfter: [],
      modifiedNodeIds: new Map(),
      updatedItems: [
        {
          oldNode: { id: 'app_1', type: NodeType.ROOT, items: [] } as any,
          newNode: { id: 'app_1', type: NodeType.ROOT, items: [page] } as any,
        },
      ],
    };

    await applyHistoryUpdateOp(step, true, ctx);
    expect(ctx.setRoot).toHaveBeenCalled();
  });

  test('update 页面节点调用 setPage', async () => {
    const page = makePage();
    const root = makeRoot(page);
    const ctx = makeCtx(root);

    const updatedPage = { ...page, name: 'renamed' };
    const step: StepValue = {
      opType: 'update',
      selectedBefore: [],
      selectedAfter: [],
      modifiedNodeIds: new Map(),
      updatedItems: [
        {
          oldNode: page as any,
          newNode: updatedPage as any,
        },
      ],
    };

    await applyHistoryUpdateOp(step, false, ctx);
    expect(ctx.setPage).toHaveBeenCalled();
  });
});
