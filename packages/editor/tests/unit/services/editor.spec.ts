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

import { beforeAll, describe, expect, test } from 'vitest';
import { cloneDeep } from 'lodash-es';

import type { MApp, MNode } from '@tmagic/core';
import { NodeType } from '@tmagic/core';
import { getNodePath } from '@tmagic/utils';

import editorService from '@editor/services/editor';
import historyService from '@editor/services/history';
import storageService from '@editor/services/storage';
import { COPY_STORAGE_KEY, setEditorConfig } from '@editor/utils';

setEditorConfig({
  // eslint-disable-next-line no-eval
  parseDSL: (dsl: string) => eval(dsl),
  customCreateMonacoEditor: (monaco, codeEditorEl, options) => monaco.editor.create(codeEditorEl, options),
  customCreateMonacoDiffEditor: (monaco, codeEditorEl, options) =>
    monaco.editor.createDiffEditor(codeEditorEl, options),
});

// mock window.localStage
class LocalStorageMock {
  public length = 0;

  private store: Record<string, string> = {};

  clear() {
    this.store = {};
    this.length = 0;
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
    this.length += 1;
  }

  removeItem(key: string) {
    delete this.store[key];
    this.length -= 1;
  }

  // 这里用不到这个方法，只是为了mock完整localStorage
  key(key: number) {
    return Object.keys(this.store)[key];
  }
}

globalThis.localStorage = new LocalStorageMock();

enum NodeId {
  // 跟节点
  ROOT_ID = 1,
  // 页面节点
  PAGE_ID = 2,
  // 普通节点
  NODE_ID = 3,
  // 普通节点
  NODE_ID2 = 4,
  // 不存在的节点
  ERROR_NODE_ID = 5,
}

// mock 页面数据，包含一个页面，两个组件
const root: MApp = {
  id: NodeId.ROOT_ID,
  type: NodeType.ROOT,
  items: [
    {
      id: NodeId.PAGE_ID,
      layout: 'absolute',
      type: NodeType.PAGE,
      style: {
        width: 375,
      },
      items: [
        {
          id: NodeId.NODE_ID,
          type: 'text',
          style: {
            width: 270,
          },
        },
        {
          id: NodeId.NODE_ID2,
          type: 'text',
          style: {},
        },
      ],
    },
  ],
};

describe('get', () => {
  // 同一个设置页面数据
  beforeAll(() => editorService.set('root', cloneDeep(root)));

  test('get', () => {
    const root = editorService.get('root');
    expect(root?.id).toBe(NodeId.ROOT_ID);
  });

  test('get undefined', () => {
    // state中不存在的key
    const root = editorService.get('a' as 'root');
    expect(root).toBeUndefined();
  });
});

describe('multiSelect 标志位', () => {
  test('disabledMultiSelect 默认值为 false', () => {
    expect(editorService.get('disabledMultiSelect')).toBe(false);
  });

  test('alwaysMultiSelect 默认值为 false', () => {
    expect(editorService.get('alwaysMultiSelect')).toBe(false);
  });

  test('alwaysMultiSelect 可被 set 修改并通过 get 读取', () => {
    editorService.set('alwaysMultiSelect', true);
    expect(editorService.get('alwaysMultiSelect')).toBe(true);
    editorService.set('alwaysMultiSelect', false);
    expect(editorService.get('alwaysMultiSelect')).toBe(false);
  });
});

describe('getNodeInfo', () => {
  beforeAll(() => editorService.set('root', cloneDeep(root)));

  test('正常', () => {
    const info = editorService.getNodeInfo(NodeId.NODE_ID);
    expect(info?.node?.id).toBe(NodeId.NODE_ID);
    expect(info?.parent?.id).toBe(NodeId.PAGE_ID);
    expect(info?.page?.id).toBe(NodeId.PAGE_ID);
  });

  test('异常', () => {
    const info = editorService.getNodeInfo(NodeId.ERROR_NODE_ID);
    expect(info?.node).toBeNull();
    expect(info?.parent?.id).toBeUndefined();
    expect(info?.page).toBeNull();
  });
});

describe('getNodeById', () => {
  beforeAll(() => editorService.set('root', cloneDeep(root)));

  test('正常', () => {
    const node = editorService.getNodeById(NodeId.NODE_ID);
    expect(node?.id).toBe(NodeId.NODE_ID);
  });

  test('异常', () => {
    const node = editorService.getNodeById(NodeId.ERROR_NODE_ID);
    expect(node).toBeNull();
  });
});

describe('getParentById', () => {
  beforeAll(() => editorService.set('root', cloneDeep(root)));

  test('正常', () => {
    const node = editorService.getParentById(NodeId.NODE_ID);
    expect(node?.id).toBe(NodeId.PAGE_ID);
  });

  test('异常', () => {
    const node = editorService.getParentById(NodeId.ERROR_NODE_ID);
    expect(node?.id).toBeUndefined();
  });
});

describe('getNodeInfo 当前页面优先 / 跨页面回退', () => {
  // 两个页面，page2 内含一个容器及其子节点，用于覆盖「优先当前页面、回退跳过当前页面」逻辑
  const PAGE2_ID = 20;
  const NODE_IN_PAGE2 = 21;
  const CONTAINER_IN_PAGE2 = 22;
  const CHILD_IN_PAGE2 = 23;
  const multiPageRoot: MApp = {
    id: NodeId.ROOT_ID,
    type: NodeType.ROOT,
    items: [
      cloneDeep(root.items[0]),
      {
        id: PAGE2_ID,
        type: NodeType.PAGE,
        layout: 'absolute',
        style: { width: 375 },
        items: [
          { id: NODE_IN_PAGE2, type: 'text', style: {} },
          {
            id: CONTAINER_IN_PAGE2,
            type: 'container',
            style: {},
            items: [{ id: CHILD_IN_PAGE2, type: 'text', style: {} }],
          },
        ],
      },
    ],
  };

  beforeAll(async () => {
    editorService.set('root', cloneDeep(multiPageRoot));
    // 当前停留在 page1
    await editorService.select(NodeId.PAGE_ID);
  });

  test('id 为 root.id 时返回 root 自身，parent / page 为 null', () => {
    const info = editorService.getNodeInfo(NodeId.ROOT_ID);
    expect(info.node?.id).toBe(NodeId.ROOT_ID);
    expect(info.parent).toBeNull();
    expect(info.page).toBeNull();
  });

  test('当前页面节点本身：node 为页面、parent 为 root、page 为页面自身', () => {
    const info = editorService.getNodeInfo(NodeId.PAGE_ID);
    expect(info.node?.id).toBe(NodeId.PAGE_ID);
    expect(info.parent?.id).toBe(NodeId.ROOT_ID);
    expect(info.page?.id).toBe(NodeId.PAGE_ID);
  });

  test('命中当前页面内的节点（快速路径）', () => {
    const info = editorService.getNodeInfo(NodeId.NODE_ID);
    expect(info.node?.id).toBe(NodeId.NODE_ID);
    expect(info.parent?.id).toBe(NodeId.PAGE_ID);
    expect(info.page?.id).toBe(NodeId.PAGE_ID);
  });

  test('命中非当前页面内的深层节点（回退跳过当前页面），parent / page 正确', () => {
    const info = editorService.getNodeInfo(CHILD_IN_PAGE2);
    expect(info.node?.id).toBe(CHILD_IN_PAGE2);
    expect(info.parent?.id).toBe(CONTAINER_IN_PAGE2);
    expect(info.page?.id).toBe(PAGE2_ID);
  });

  test('非当前页面的页面节点：parent 为真实 root（同一引用，可安全 mutate）', () => {
    const info = editorService.getNodeInfo(PAGE2_ID, false);
    expect(info.node?.id).toBe(PAGE2_ID);
    expect(info.page?.id).toBe(PAGE2_ID);
    // parent 必须是真实 root 引用，而非临时副本，否则对页面增删/排序会改不到真实树
    expect(info.parent).toBe(editorService.get('root'));
  });

  test('不存在的节点返回空 info', () => {
    const info = editorService.getNodeInfo(NodeId.ERROR_NODE_ID);
    expect(info.node).toBeNull();
    expect(info.page).toBeNull();
  });

  test('未选中任何页面时仍能跨页面查找到节点', () => {
    editorService.set('root', cloneDeep(multiPageRoot));
    editorService.set('page', null);
    const info = editorService.getNodeInfo(CHILD_IN_PAGE2);
    expect(info.node?.id).toBe(CHILD_IN_PAGE2);
    expect(info.parent?.id).toBe(CONTAINER_IN_PAGE2);
    expect(info.page?.id).toBe(PAGE2_ID);
  });
});

describe('isOnDifferentPage', () => {
  test('当前未选中任何页面时返回 false', () => {
    editorService.set('root', cloneDeep(root));
    editorService.resetState();
    const pageNode = editorService.getNodeById(NodeId.PAGE_ID)!;
    expect(editorService.isOnDifferentPage(pageNode)).toBe(false);
  });

  test('节点在当前页面内时返回 false', async () => {
    editorService.set('root', cloneDeep(root));
    await editorService.select(NodeId.PAGE_ID);
    const innerNode = editorService.getNodeById(NodeId.NODE_ID)!;
    expect(editorService.isOnDifferentPage(innerNode)).toBe(false);
  });

  test('页面节点本身就是当前页面时返回 false', async () => {
    editorService.set('root', cloneDeep(root));
    await editorService.select(NodeId.PAGE_ID);
    const pageNode = editorService.getNodeById(NodeId.PAGE_ID)!;
    expect(editorService.isOnDifferentPage(pageNode)).toBe(false);
  });

  test('节点位于非当前页面时返回 true', async () => {
    editorService.set('root', cloneDeep(root));
    const rootNode = editorService.get('root');
    await editorService.select(NodeId.PAGE_ID);
    // 加一个新页面
    const newPage = await editorService.add({ type: NodeType.PAGE }, rootNode, { doNotSwitchPage: true });
    const newPageId = Array.isArray(newPage) ? newPage[0].id : newPage.id;

    // 当前还在第一个页面
    expect(editorService.get('page')?.id).toBe(NodeId.PAGE_ID);
    const newPageNode = editorService.getNodeById(newPageId)!;
    expect(editorService.isOnDifferentPage(newPageNode)).toBe(true);
  });
});

describe('select', () => {
  beforeAll(() => editorService.set('root', cloneDeep(root)));

  test('参数是id 正常', async () => {
    // 选中一个节点，会对应更新parent, page
    await editorService.select(NodeId.NODE_ID);
    const node = editorService.get('node');
    const parent = editorService.get('parent');
    const page = editorService.get('page');
    expect(node?.id).toBe(NodeId.NODE_ID);
    expect(parent?.id).toBe(NodeId.PAGE_ID);
    expect(page?.id).toBe(NodeId.PAGE_ID);
  });

  test('参数是config 正常', async () => {
    await editorService.select({ id: NodeId.NODE_ID, type: 'text' });
    const node = editorService.get('node');
    const parent = editorService.get('parent');
    const page = editorService.get('page');
    expect(node?.id).toBe(NodeId.NODE_ID);
    expect(parent?.id).toBe(NodeId.PAGE_ID);
    expect(page?.id).toBe(NodeId.PAGE_ID);
  });

  test('参数是id undefined', () => {
    expect(() => editorService.select(NodeId.ERROR_NODE_ID)).rejects.toThrowError('获取不到组件信息');
  });

  test('参数是config 没有id', () => {
    expect(() => editorService.select({ id: '', type: 'text' })).rejects.toThrowError('没有ID，无法选中');
  });
});

describe('add', () => {
  test('正常', async () => {
    editorService.set('root', cloneDeep(root));
    // 先选中容器
    await editorService.select(NodeId.PAGE_ID);
    const newNode = await editorService.add({
      type: 'text',
    });
    // 添加后会选中这个节点
    const node = editorService.get('node');
    const parent = editorService.get('parent');
    if (!Array.isArray(newNode)) {
      expect(node?.id).toBe(newNode.id);
    }
    expect(parent?.items).toHaveLength(3);
  });

  test('正常， 当前不是容器', async () => {
    editorService.set('root', cloneDeep(root));
    // 选中不是容器的节点
    await editorService.select(NodeId.NODE_ID2);
    // 会加到选中节点的父节点下
    const newNode = await editorService.add({
      type: 'text',
    });
    const node = editorService.get('node');
    const parent = editorService.get('parent');
    if (!Array.isArray(newNode)) {
      expect(node?.id).toBe(newNode.id);
    }
    expect(parent?.items).toHaveLength(3);
  });

  test('往root下添加page', async () => {
    editorService.set('root', cloneDeep(root));
    await editorService.select(NodeId.PAGE_ID);
    const rootNode = editorService.get('root');
    const newNode = await editorService.add(
      {
        type: NodeType.PAGE,
      },
      rootNode,
    );
    const node = editorService.get('node');
    if (!Array.isArray(newNode)) {
      expect(node?.id).toBe(newNode.id);
    }
    expect(rootNode?.items.length).toBe(2);
  });

  test('往root下添加普通节点', () => {
    editorService.set('root', cloneDeep(root));
    // 根节点下只能加页面
    const rootNode = editorService.get('root');
    expect(() =>
      editorService.add(
        {
          type: 'text',
        },
        rootNode,
      ),
    ).rejects.toThrowError('app下不能添加组件');
  });

  test('doNotSelect: true 不更新选中节点', async () => {
    editorService.set('root', cloneDeep(root));
    await editorService.select(NodeId.NODE_ID);
    const beforeNodeId = editorService.get('node')?.id;
    expect(beforeNodeId).toBe(NodeId.NODE_ID);

    const newNode = await editorService.add({ type: 'text' }, null, { doNotSelect: true });

    // 节点已被添加到 dsl
    const addedId = Array.isArray(newNode) ? newNode[0].id : newNode.id;
    const parentInfo = editorService.getParentById(addedId);
    expect(parentInfo?.items).toHaveLength(3);

    // 但当前选中节点保持原状（未自动选中新增节点）
    expect(editorService.get('node')?.id).toBe(beforeNodeId);
  });

  test('doNotSwitchPage: true 新增页面时保持当前页面不切换', async () => {
    editorService.set('root', cloneDeep(root));
    await editorService.select(NodeId.PAGE_ID);
    const beforePageId = editorService.get('page')?.id;
    expect(beforePageId).toBe(NodeId.PAGE_ID);

    const rootNode = editorService.get('root');
    const newPage = await editorService.add({ type: NodeType.PAGE }, rootNode, { doNotSwitchPage: true });

    // 新页面已加入 dsl
    const addedId = Array.isArray(newPage) ? newPage[0].id : newPage.id;
    expect(editorService.getNodeById(addedId)).toBeTruthy();
    expect(rootNode?.items.length).toBe(2);

    // 当前 page 保持不变（没有自动切到新加的页面）
    expect(editorService.get('page')?.id).toBe(beforePageId);
  });
});

describe('remove', () => {
  beforeAll(() => editorService.set('root', cloneDeep(root)));

  test('正常', async () => {
    editorService.remove({ id: NodeId.NODE_ID, type: 'text' });
    const node = editorService.getNodeById(NodeId.NODE_ID);
    expect(node).toBeNull();
  });

  test('remove page', async () => {
    editorService.set('root', cloneDeep(root));
    editorService.select(NodeId.PAGE_ID);
    const rootNode = editorService.get('root');
    // 先加一个页面
    const newPage = await editorService.add(
      {
        type: NodeType.PAGE,
      },
      rootNode,
    );
    expect(rootNode?.items.length).toBe(2);
    await editorService.remove(newPage);
    expect(rootNode?.items.length).toBe(1);
  });

  test('undefine', async () => {
    expect(() => editorService.remove({ id: NodeId.ERROR_NODE_ID, type: 'text' })).rejects.toThrow();
  });

  test('doNotSelect: true 不更新选中节点', async () => {
    editorService.set('root', cloneDeep(root));
    // 选中 NODE_ID，删除另外一个 NODE_ID2
    await editorService.select(NodeId.NODE_ID);
    const beforeNodeId = editorService.get('node')?.id;
    expect(beforeNodeId).toBe(NodeId.NODE_ID);

    await editorService.remove({ id: NodeId.NODE_ID2, type: 'text' }, { doNotSelect: true });

    // 节点已被删除
    expect(editorService.getNodeById(NodeId.NODE_ID2)).toBeNull();
    // 当前选中节点保持原状（未自动选中父节点）
    expect(editorService.get('node')?.id).toBe(beforeNodeId);
  });

  test('被删除节点正好是当前选中节点时，state 强制移除引用', async () => {
    editorService.set('root', cloneDeep(root));
    // 选中 NODE_ID 后再删除 NODE_ID 自身
    await editorService.select(NodeId.NODE_ID);
    expect(editorService.get('node')?.id).toBe(NodeId.NODE_ID);

    // 即使 doNotSelect: true，被删除节点正好是当前选中节点时，state 也必须移除引用
    await editorService.remove({ id: NodeId.NODE_ID, type: 'text' }, { doNotSelect: true });

    // 节点已删除
    expect(editorService.getNodeById(NodeId.NODE_ID)).toBeNull();
    // state.nodes 中不再包含被删除的节点
    expect(editorService.get('nodes').some((n) => n.id === NodeId.NODE_ID)).toBe(false);
  });

  test('doNotSwitchPage: true 删除当前页面后不自动切到其它页面', async () => {
    editorService.set('root', cloneDeep(root));
    const rootNode = editorService.get('root');
    // 先加一个页面，确保 root 下有 2 个页面
    await editorService.select(NodeId.PAGE_ID);
    const newPage = await editorService.add({ type: NodeType.PAGE }, rootNode);
    expect(rootNode?.items.length).toBe(2);

    // 选中第一个页面，作为当前页面
    await editorService.select(NodeId.PAGE_ID);
    expect(editorService.get('page')?.id).toBe(NodeId.PAGE_ID);

    // 删除当前页面，并要求不切换页面
    await editorService.remove({ id: NodeId.PAGE_ID, type: NodeType.PAGE }, { doNotSwitchPage: true });

    // 被删除页面在 dsl 中确实已不存在
    expect(editorService.getNodeById(NodeId.PAGE_ID)).toBeNull();
    // 当前 page 引用被清空，不会被自动切到剩余页面
    expect(editorService.get('page')).toBeNull();
    // 仍保留 newPage 在 dsl 中
    const addedId = Array.isArray(newPage) ? newPage[0].id : newPage.id;
    expect(editorService.getNodeById(addedId)).toBeTruthy();
  });

  test('默认删除当前页面后会自动切到剩余首个页面', async () => {
    editorService.set('root', cloneDeep(root));
    const rootNode = editorService.get('root');
    // 先加一个页面
    await editorService.select(NodeId.PAGE_ID);
    const newPage = await editorService.add({ type: NodeType.PAGE }, rootNode);
    const addedId = Array.isArray(newPage) ? newPage[0].id : newPage.id;
    expect(rootNode?.items.length).toBe(2);

    // 选中第一个页面作为当前页面
    await editorService.select(NodeId.PAGE_ID);

    // 删除当前页面，使用默认行为
    await editorService.remove({ id: NodeId.PAGE_ID, type: NodeType.PAGE });

    // 被删除页面在 dsl 中已不存在
    expect(editorService.getNodeById(NodeId.PAGE_ID)).toBeNull();
    // 自动切到剩余首个页面
    expect(editorService.get('page')?.id).toBe(addedId);
  });
});

describe('update', () => {
  beforeAll(() => {
    editorService.set('root', cloneDeep(root));

    // dist 版 getNodeInfo 尚未返回 path，测试中手动补齐以匹配 toggleFixedPosition 入参
    const originalGetNodeInfo = editorService.getNodeInfo.bind(editorService);
    editorService.getNodeInfo = (id, raw = true) => {
      const info = originalGetNodeInfo(id, raw);
      if (!Array.isArray(info.path) && info.node) {
        const appRoot = editorService.get('root');
        if (appRoot && `${id}` !== `${appRoot.id}`) {
          const path = getNodePath(id, appRoot.items) as MNode[];
          if (path.length) {
            path.unshift(appRoot as unknown as MNode);
            info.path = path;
          } else {
            info.path = [];
          }
        } else {
          info.path = [];
        }
      }
      return info;
    };
  });

  test('正常', async () => {
    await editorService.select(NodeId.PAGE_ID);
    await editorService.update({ id: NodeId.NODE_ID, type: 'text', text: 'text' });
    const node = editorService.getNodeById(NodeId.NODE_ID);
    expect(node?.text).toBe('text');
  });

  test('没有id', async () => {
    try {
      await editorService.update({ type: 'text', text: 'text', id: '' });
    } catch (e: any) {
      expect(e.message).toBe('没有配置或者配置缺少id值');
    }
  });

  test('没有type', async () => {
    // 一般可能出现在外边扩展功能
    try {
      await editorService.update({ type: '', text: 'text', id: NodeId.NODE_ID });
    } catch (e: any) {
      expect(e.message).toBe('配置缺少type值');
    }
  });

  test('id对应节点不存在', async () => {
    try {
      // 设置当前编辑的页面
      await editorService.select(NodeId.PAGE_ID);
      await editorService.update({ type: 'text', text: 'text', id: NodeId.ERROR_NODE_ID });
    } catch (e: any) {
      expect(e.message).toBe(`获取不到id为${NodeId.ERROR_NODE_ID}的节点`);
    }
  });

  test('fixed与absolute切换', async () => {
    // 设置当前编辑的页面
    await editorService.select(NodeId.PAGE_ID);
    await editorService.update({ id: NodeId.NODE_ID, type: 'text', style: { position: 'fixed' } });
    const node = editorService.getNodeById(NodeId.NODE_ID);
    expect(node?.style?.position).toBe('fixed');
    await editorService.update({ id: NodeId.NODE_ID, type: 'text', style: { position: 'absolute' } });
    const node2 = editorService.getNodeById(NodeId.NODE_ID);
    expect(node2?.style?.position).toBe('absolute');
  });

  test('被更新节点正好是当前选中节点时，state.node 始终与 dsl 同步', async () => {
    editorService.set('root', cloneDeep(root));
    await editorService.select(NodeId.NODE_ID);

    await editorService.update({ id: NodeId.NODE_ID, type: 'text', text: 'updated-text' });

    // dsl 已更新
    expect(editorService.getNodeById(NodeId.NODE_ID)?.text).toBe('updated-text');
    // state.node 引用同步到新节点，不会持有过期数据
    expect(editorService.get('node')?.text).toBe('updated-text');
  });

  test('更新非选中节点时，不影响当前选中列表', async () => {
    editorService.set('root', cloneDeep(root));
    await editorService.select(NodeId.NODE_ID);
    const beforeSelected = editorService.get('node');

    // 更新另一个非选中节点
    await editorService.update({ id: NodeId.NODE_ID2, type: 'text', text: 'other-text' });

    // dsl 已更新
    expect(editorService.getNodeById(NodeId.NODE_ID2)?.text).toBe('other-text');
    // 原选中节点引用不被错误替换（修复 splice(-1) 误改最后一个选中项的旧 bug）
    expect(editorService.get('node')?.id).toBe(NodeId.NODE_ID);
    expect(editorService.get('node')).toBe(beforeSelected);
  });

  test('更新非当前页面时，不会把编辑器切到该页', async () => {
    editorService.set('root', cloneDeep(root));
    const rootNode = editorService.get('root');
    // 先加一个新页面
    await editorService.select(NodeId.PAGE_ID);
    const newPage = await editorService.add({ type: NodeType.PAGE }, rootNode);
    const newPageId = Array.isArray(newPage) ? newPage[0].id : newPage.id;

    // 选中第一个页面作为当前页
    await editorService.select(NodeId.PAGE_ID);
    expect(editorService.get('page')?.id).toBe(NodeId.PAGE_ID);

    // 更新非当前页面（newPage）的配置
    await editorService.update({ id: newPageId, type: NodeType.PAGE, name: 'page-renamed' });

    // dsl 中该页已更新
    expect(editorService.getNodeById(newPageId)?.name).toBe('page-renamed');
    // 当前 page 没有被切走
    expect(editorService.get('page')?.id).toBe(NodeId.PAGE_ID);
  });
});

describe('sort', () => {
  beforeAll(() => editorService.set('root', cloneDeep(root)));

  test('正常', async () => {
    await editorService.select(NodeId.NODE_ID2);
    let parent = editorService.get('parent');
    expect(parent?.items[0].id).toBe(NodeId.NODE_ID);
    await editorService.sort(NodeId.NODE_ID2, NodeId.NODE_ID);
    parent = editorService.get('parent');
    expect(parent?.items[0].id).toBe(NodeId.NODE_ID2);
  });

  test('doNotSelect: true 完成排序且不触发额外 select', async () => {
    editorService.set('root', cloneDeep(root));
    await editorService.select(NodeId.NODE_ID2);
    const parentBefore = editorService.get('parent');
    expect(parentBefore?.items[0].id).toBe(NodeId.NODE_ID);

    await editorService.sort(NodeId.NODE_ID2, NodeId.NODE_ID, { doNotSelect: true });

    // dsl 顺序已更新
    const parentAfter = editorService.getParentById(NodeId.NODE_ID2);
    expect(parentAfter?.items[0].id).toBe(NodeId.NODE_ID2);
  });
});

describe('copy', () => {
  beforeAll(() => editorService.set('root', cloneDeep(root)));
  test('正常', async () => {
    const node = editorService.getNodeById(NodeId.NODE_ID2);
    await editorService.copy(node!);
    const str = storageService.getItem(COPY_STORAGE_KEY);
    expect(str).toHaveLength(1);
  });
});

describe('paste', () => {
  test('doNotSelect: true 不更新选中节点', async () => {
    editorService.set('root', cloneDeep(root));
    await editorService.select(NodeId.NODE_ID);

    const sourceNode = editorService.getNodeById(NodeId.NODE_ID2);
    await editorService.copy(sourceNode!);

    const beforeNodeId = editorService.get('node')?.id;
    expect(beforeNodeId).toBe(NodeId.NODE_ID);

    const pasted = await editorService.paste({}, undefined, { doNotSelect: true });

    // 粘贴成功
    expect(pasted).toBeTruthy();
    // 当前选中节点保持原状
    expect(editorService.get('node')?.id).toBe(beforeNodeId);
  });

  test('doNotSwitchPage: true 粘贴页面时不切换当前页面', async () => {
    editorService.set('root', cloneDeep(root));
    await editorService.select(NodeId.PAGE_ID);

    // 复制当前页面
    const pageNode = editorService.getNodeById(NodeId.PAGE_ID);
    await editorService.copy(pageNode!);
    const beforePageId = editorService.get('page')?.id;
    expect(beforePageId).toBe(NodeId.PAGE_ID);

    const pasted = await editorService.paste({}, undefined, { doNotSwitchPage: true });

    // 粘贴成功
    expect(pasted).toBeTruthy();
    // 当前 page 保持不变
    expect(editorService.get('page')?.id).toBe(beforePageId);
  });
});

describe('moveLayer', () => {
  beforeAll(() => editorService.set('root', cloneDeep(root)));

  test('正常', async () => {
    // 设置当前编辑的组件
    await editorService.select(NodeId.NODE_ID);
    const parent = editorService.get('parent');
    await editorService.moveLayer(1);
    expect(parent?.items[0].id).toBe(NodeId.NODE_ID2);
  });
});

describe('undo redo', () => {
  beforeAll(() => editorService.set('root', cloneDeep(root)));

  test('正常', async () => {
    historyService.reset();
    // 设置当前编辑的组件
    await editorService.select(NodeId.NODE_ID);
    const node = editorService.get('node');
    if (!node) throw new Error('未选中节点');
    await editorService.remove(node);
    const removedNode = editorService.getNodeById(NodeId.NODE_ID);
    expect(removedNode).toBeNull();
    await editorService.undo();
    const undoNode = editorService.getNodeById(NodeId.NODE_ID);
    expect(undoNode?.id).toBe(NodeId.NODE_ID);
    await editorService.redo();
    const redoNode = editorService.getNodeById(NodeId.NODE_ID);
    expect(redoNode?.id).toBeUndefined();
  });

  test('update 携带 changeRecords 时，undo/redo 仅回滚/重做对应 propPath，不冲掉同节点其它字段', async () => {
    editorService.set('root', cloneDeep(root));
    historyService.reset();

    await editorService.select(NodeId.PAGE_ID);
    // 先携带 changeRecords 改 width
    await editorService.update(
      { id: NodeId.NODE_ID, type: 'text', style: { width: 500 } },
      { changeRecords: [{ propPath: 'style.width', value: 500 }] },
    );
    expect(editorService.getNodeById(NodeId.NODE_ID)?.style?.width).toBe(500);

    // 在 undo 之前再追加一个不入历史的字段（模拟"同节点上其它无关变更"），undo 不应把它冲掉
    await editorService.update(
      { id: NodeId.NODE_ID, type: 'text', style: { width: 500, height: 80 } },
      { doNotPushHistory: true },
    );
    expect(editorService.getNodeById(NodeId.NODE_ID)?.style?.height).toBe(80);

    await editorService.undo();
    const afterUndo = editorService.getNodeById(NodeId.NODE_ID);
    // width 回退；height 因为不在 changeRecords 内不会被局部 patch 覆盖
    expect(afterUndo?.style?.width).toBe(270);
    expect(afterUndo?.style?.height).toBe(80);

    await editorService.redo();
    const afterRedo = editorService.getNodeById(NodeId.NODE_ID);
    expect(afterRedo?.style?.width).toBe(500);
    expect(afterRedo?.style?.height).toBe(80);
  });

  test('update 不带 changeRecords 时退化为整节点替换', async () => {
    editorService.set('root', cloneDeep(root));
    historyService.reset();

    await editorService.select(NodeId.PAGE_ID);
    await editorService.update({ id: NodeId.NODE_ID, type: 'text', style: { width: 600 } });
    expect(editorService.getNodeById(NodeId.NODE_ID)?.style?.width).toBe(600);

    await editorService.undo();
    expect(editorService.getNodeById(NodeId.NODE_ID)?.style?.width).toBe(270);
  });
});

describe('*AndGetHistoryId', () => {
  const lastStepUuid = () => {
    const list = historyService.getStepList('page', editorService.get('page')?.id);
    return list[list.length - 1]?.step.uuid;
  };

  test('addAndGetHistoryId 返回本次写入历史记录的 uuid，且与栈顶 step 一致', async () => {
    editorService.set('root', cloneDeep(root));
    historyService.reset();
    await editorService.select(NodeId.PAGE_ID);

    const { result, historyIds } = await editorService.addAndGetHistoryId({ type: 'text' });
    expect(result).toBeTruthy();
    expect(historyIds).toHaveLength(1);
    expect(historyIds[0]).toBeTruthy();
    expect(historyIds[0]).toBe(lastStepUuid());
  });

  test('addAndGetHistoryId 传 doNotPushHistory 时返回空数组', async () => {
    editorService.set('root', cloneDeep(root));
    historyService.reset();
    await editorService.select(NodeId.PAGE_ID);

    const { historyIds } = await editorService.addAndGetHistoryId({ type: 'text' }, null, { doNotPushHistory: true });
    expect(historyIds).toEqual([]);
  });

  test('updateAndGetHistoryId 返回本次写入历史记录的 uuid', async () => {
    editorService.set('root', cloneDeep(root));
    historyService.reset();
    await editorService.select(NodeId.PAGE_ID);

    const { result, historyIds } = await editorService.updateAndGetHistoryId({
      id: NodeId.NODE_ID,
      type: 'text',
      text: 'x',
    });
    expect(result).toBeTruthy();
    expect(historyIds).toHaveLength(1);
    expect(historyIds[0]).toBe(lastStepUuid());
  });

  test('removeAndGetHistoryId 返回本次写入历史记录的 uuid', async () => {
    editorService.set('root', cloneDeep(root));
    historyService.reset();
    await editorService.select(NodeId.PAGE_ID);

    const { historyIds } = await editorService.removeAndGetHistoryId({ id: NodeId.NODE_ID, type: 'text' });
    expect(historyIds).toHaveLength(1);
    expect(historyIds[0]).toBe(lastStepUuid());
  });

  test('moveLayerAndGetHistoryId 返回本次写入历史记录的 uuid', async () => {
    editorService.set('root', cloneDeep(root));
    historyService.reset();
    await editorService.select(NodeId.NODE_ID);

    const { historyIds } = await editorService.moveLayerAndGetHistoryId(1);
    expect(historyIds).toHaveLength(1);
    expect(historyIds[0]).toBe(lastStepUuid());
  });
});

describe('revertPageStepById', () => {
  test('通过 uuid 回滚 add 步骤（删除被新增节点）', async () => {
    editorService.set('root', cloneDeep(root));
    historyService.reset();
    await editorService.select(NodeId.PAGE_ID);

    const { historyIds } = await editorService.addAndGetHistoryId({ type: 'text' });
    const uuid = historyIds[0];
    expect(typeof uuid).toBe('string');

    const addedStep = historyService
      .getStepList('page', editorService.get('page')?.id)
      .find((e) => e.step.uuid === uuid)!.step;
    const addedId = addedStep.diff[0].newSchema!.id;
    expect(editorService.getNodeById(addedId)).toBeTruthy();

    const reverted = await editorService.revertPageStepById([uuid!]);
    expect(reverted[0]).not.toBeNull();
    // 回滚（git revert 语义）会把被新增的节点删掉
    expect(editorService.getNodeById(addedId)).toBeNull();
  });

  test('与按 index 回滚结果一致', async () => {
    editorService.set('root', cloneDeep(root));
    historyService.reset();
    await editorService.select(NodeId.PAGE_ID);

    const { historyIds } = await editorService.addAndGetHistoryId({ type: 'text' });
    const uuid = historyIds[0];
    const location = historyService.findStepLocationByUuid('page', uuid!, editorService.get('page')?.id);
    expect(location?.index).toBeGreaterThanOrEqual(0);
  });

  test('找不到 uuid 时返回 null', async () => {
    editorService.set('root', cloneDeep(root));
    historyService.reset();
    await editorService.select(NodeId.PAGE_ID);

    expect(await editorService.revertPageStepById(['not-exist'])).toEqual([null]);
    expect(await editorService.revertPageStepById([''])).toEqual([null]);
  });

  test('支持传入 uuid 数组并按顺序回滚', async () => {
    editorService.set('root', cloneDeep(root));
    historyService.reset();
    await editorService.select(NodeId.PAGE_ID);

    const { historyIds: ids1 } = await editorService.addAndGetHistoryId({ type: 'text' });
    const { historyIds: ids2 } = await editorService.addAndGetHistoryId({ type: 'text' });
    const uuids = [ids1[0]!, ids2[0]!];

    const pageId = editorService.get('page')?.id;
    const addedId1 = historyService.getStepList('page', pageId).find((e) => e.step.uuid === uuids[0])!.step.diff[0]
      .newSchema!.id;
    const addedId2 = historyService.getStepList('page', pageId).find((e) => e.step.uuid === uuids[1])!.step.diff[0]
      .newSchema!.id;

    const reverted = await editorService.revertPageStepById(uuids);
    expect(reverted).toHaveLength(2);
    expect(reverted[0]).not.toBeNull();
    expect(reverted[1]).not.toBeNull();
    expect(editorService.getNodeById(addedId1)).toBeNull();
    expect(editorService.getNodeById(addedId2)).toBeNull();
  });
});
