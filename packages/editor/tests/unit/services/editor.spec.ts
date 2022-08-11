/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
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

import type { MApp, MContainer, MNode, MPage } from '@tmagic/schema';
import { NodeType } from '@tmagic/schema';

import editorService from '@editor/services/editor';
import storageService from '@editor/services/storage';
import { COPY_STORAGE_KEY } from '@editor/utils';

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
const root: MNode = {
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
    expect(root.id).toBe(NodeId.ROOT_ID);
  });

  test('get undefined', () => {
    // state中不存在的key
    const root = editorService.get('a' as 'root');
    expect(root).toBeUndefined();
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
    expect(info?.node).toBeUndefined();
    expect(info?.parent?.id).toBeUndefined();
    expect(info?.page).toBeUndefined();
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
    expect(node).toBeUndefined();
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

  test.skip('参数是id undefined', () => {
    expect(() => editorService.select(NodeId.ERROR_NODE_ID)).toThrowError('获取不到组件信息');
  });

  test.skip('参数是config 没有id', () => {
    expect(() => editorService.select({ id: '', type: 'text' })).toThrowError('没有ID，无法选中');
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
      expect(node.id).toBe(newNode.id);
    }
    expect(parent.items).toHaveLength(3);
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
      expect(node.id).toBe(newNode.id);
    }
    expect(parent.items).toHaveLength(3);
  });

  test('往root下添加page', async () => {
    editorService.set('root', cloneDeep(root));
    await editorService.select(NodeId.PAGE_ID);
    const rootNode = editorService.get<MApp>('root');
    const newNode = await editorService.add(
      {
        type: NodeType.PAGE,
      },
      rootNode,
    );
    const node = editorService.get('node');
    if (!Array.isArray(newNode)) {
      expect(node.id).toBe(newNode.id);
    }
    expect(rootNode.items.length).toBe(2);
  });

  test.skip('往root下添加普通节点', () => {
    editorService.set('root', cloneDeep(root));
    // 根节点下只能加页面
    const rootNode = editorService.get<MApp>('root');
    expect(() =>
      editorService.add(
        {
          type: 'text',
        },
        rootNode,
      ),
    ).toThrowError('app下不能添加组件');
  });
});

describe('remove', () => {
  beforeAll(() => editorService.set('root', cloneDeep(root)));

  test('正常', async () => {
    editorService.remove({ id: NodeId.NODE_ID, type: 'text' });
    const node = editorService.getNodeById(NodeId.NODE_ID);
    expect(node).toBeUndefined();
  });

  test('remove page', async () => {
    editorService.set('root', cloneDeep(root));
    editorService.select(NodeId.PAGE_ID);
    const rootNode = editorService.get<MApp>('root');
    // 先加一个页面
    const newPage = await editorService.add(
      {
        type: NodeType.PAGE,
      },
      rootNode,
    );
    expect(rootNode.items.length).toBe(2);
    await editorService.remove(newPage);
    expect(rootNode.items.length).toBe(1);
  });

  test.skip('undefine', async () => {
    expect(() => editorService.remove({ id: NodeId.ERROR_NODE_ID, type: 'text' })).toThrow();
  });
});

describe('update', () => {
  beforeAll(() => editorService.set('root', cloneDeep(root)));

  test('正常', async () => {
    await editorService.select(NodeId.PAGE_ID);
    await editorService.update({ id: NodeId.NODE_ID, type: 'text', text: 'text' });
    const node = editorService.getNodeById(NodeId.NODE_ID);
    expect(node?.text).toBe('text');
  });

  test('没有id', async () => {
    try {
      await editorService.update({ type: 'text', text: 'text', id: '' });
    } catch (e: InstanceType<Error>) {
      expect(e.message).toBe('没有配置或者配置缺少id值');
    }
  });

  test('没有type', async () => {
    // 一般可能出现在外边扩展功能
    try {
      await editorService.update({ type: '', text: 'text', id: NodeId.NODE_ID });
    } catch (e: InstanceType<Error>) {
      expect(e.message).toBe('配置缺少type值');
    }
  });

  test('id对应节点不存在', async () => {
    try {
      // 设置当前编辑的页面
      await editorService.select(NodeId.PAGE_ID);
      await editorService.update({ type: 'text', text: 'text', id: NodeId.ERROR_NODE_ID });
    } catch (e: InstanceType<Error>) {
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
});

describe('sort', () => {
  beforeAll(() => editorService.set('root', cloneDeep(root)));

  test('正常', async () => {
    await editorService.select(NodeId.NODE_ID2);
    let parent = editorService.get<MContainer>('parent');
    expect(parent.items[0].id).toBe(NodeId.NODE_ID);
    await editorService.sort(NodeId.NODE_ID2, NodeId.NODE_ID);
    parent = editorService.get<MContainer>('parent');
    expect(parent.items[0].id).toBe(NodeId.NODE_ID2);
  });
});

describe('copy', () => {
  beforeAll(() => editorService.set('root', cloneDeep(root)));
  test('正常', async () => {
    const node = editorService.getNodeById(NodeId.NODE_ID2);
    await editorService.copy(node!);
    const str = await storageService.getItem(COPY_STORAGE_KEY);
    expect(str).toHaveLength(1);
  });
});

describe('paste', () => {
  beforeAll(() => editorService.set('root', cloneDeep(root)));
  test.skip('正常', async () => {
    editorService.set('root', cloneDeep(root));
    // 设置当前编辑的页面
    await editorService.select(NodeId.PAGE_ID);
    const page = editorService.get<MPage>('page');
    expect(page.items).toHaveLength(2);
    const newNodes = (await editorService.paste({ left: 0, top: 0 })) as MNode[];
    expect(newNodes[0]?.id === NodeId.NODE_ID2).toBeFalsy();
    expect(page.items).toHaveLength(3);
  });

  test('空', async () => {
    await storageService.clear();
    const newNode = await editorService.paste({ left: 0, top: 0 });
    expect(newNode).toBeUndefined();
  });
});

describe('alignCenter', () => {
  beforeAll(() => editorService.set('root', cloneDeep(root)));

  test.skip('正常', async () => {
    // 设置当前编辑的页面
    await editorService.select(NodeId.PAGE_ID);
    await editorService.update({ id: NodeId.PAGE_ID, isAbsoluteLayout: true, type: NodeType.PAGE });
    await editorService.select(NodeId.NODE_ID);
    const node = editorService.get<MNode>('node');
    await editorService.alignCenter(node);
    expect(node.style?.left).toBeGreaterThan(0);
  });
});

describe('moveLayer', () => {
  beforeAll(() => editorService.set('root', cloneDeep(root)));

  test('正常', async () => {
    // 设置当前编辑的组件
    await editorService.select(NodeId.NODE_ID);
    const parent = editorService.get<MContainer>('parent');
    await editorService.moveLayer(1);
    expect(parent.items[0].id).toBe(NodeId.NODE_ID2);
  });
});

describe('undo redo', () => {
  beforeAll(() => editorService.set('root', cloneDeep(root)));

  test('正常', async () => {
    // 设置当前编辑的组件
    await editorService.select(NodeId.NODE_ID);
    const node = editorService.get('node');
    await editorService.remove(node);
    const removedNode = editorService.getNodeById(NodeId.NODE_ID);
    expect(removedNode).toBeUndefined();
    await editorService.undo();
    const undoNode = editorService.getNodeById(NodeId.NODE_ID);
    expect(undoNode?.id).toBe(NodeId.NODE_ID);
    await editorService.redo();
    const redoNode = editorService.getNodeById(NodeId.NODE_ID);
    expect(redoNode?.id).toBeUndefined();
  });
});

describe('use', () => {
  beforeAll(() => editorService.set('root', cloneDeep(root)));

  test.skip('before', () => {
    editorService.usePlugin({
      beforeRemove: () => new Error('不能删除'),
    });

    expect(() => editorService.remove({ id: NodeId.NODE_ID, type: 'text' })).toThrow();
  });
});
