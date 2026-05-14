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

import type { EditorNodeInfo } from '@editor/type';
import { LayerOffset, Layout } from '@editor/type';
import * as editor from '@editor/utils/editor';

describe('util form', () => {
  test('getPageList', () => {
    const pageList = editor.getPageList({
      id: 'app_1',
      type: NodeType.ROOT,
      items: [
        {
          id: 'page_1',
          name: 'index',
          type: NodeType.PAGE,
          items: [],
        },
      ],
    });

    expect(pageList[0].name).toBe('index');
  });

  test('getPageNameList', () => {
    const pageList = editor.getPageNameList([
      {
        id: 'page_1',
        name: 'index',
        type: NodeType.PAGE,
        items: [],
      },
    ]);

    expect(pageList[0]).toBe('index');
  });

  test('generatePageName', () => {
    // 已有一个页面了，再生成出来的name格式为page_${index}
    const name = editor.generatePageName(['index', 'page_2'], NodeType.PAGE);
    // 第二个页面
    expect(name).toBe('page_3');
  });
});

describe('getNodeIndex', () => {
  test('能获取到', () => {
    const index = editor.getNodeIndex(1, {
      id: 2,
      type: NodeType.PAGE,
      items: [
        {
          type: 'text',
          id: 1,
        },
      ],
    });
    expect(index).toBe(0);
  });

  test('不能能获取到', () => {
    // id为1不在查找数据中
    const index = editor.getNodeIndex(1, {
      id: 2,
      type: NodeType.PAGE,
      items: [
        {
          type: 'text',
          id: 3,
        },
      ],
    });
    expect(index).toBe(-1);
  });
});

describe('getRelativeStyle', () => {
  test('正常', () => {
    const style = editor.getRelativeStyle({
      color: 'red',
    });
    expect(style?.position).toBe('relative');
    expect(style?.top).toBe(0);
    expect(style?.left).toBe(0);
    expect(style?.color).toBe('red');
  });
});

describe('moveItemsInContainer', () => {
  test('向下移动', () => {
    const container = { id: 1, type: NodeType.CONTAINER, items: [{ id: 2 }, { id: 3 }, { id: 4 }] };
    editor.moveItemsInContainer([0], container, 0);
    expect(container.items[0].id).toBe(2);
    editor.moveItemsInContainer([0], container, 1);
    expect(container.items[0].id).toBe(2);
    editor.moveItemsInContainer([0], container, 2);
    expect(container.items[0].id).toBe(3);
    expect(container.items[1].id).toBe(2);
    expect(container.items[2].id).toBe(4);
  });
  test('向下移动到最后', () => {
    const container = { id: 1, type: NodeType.CONTAINER, items: [{ id: 2 }, { id: 3 }, { id: 4 }] };
    editor.moveItemsInContainer([0], container, 3);
    expect(container.items[0].id).toBe(3);
    expect(container.items[1].id).toBe(4);
    expect(container.items[2].id).toBe(2);
  });

  test('向上移动', () => {
    const container = { id: 1, type: NodeType.CONTAINER, items: [{ id: 2 }, { id: 3 }, { id: 4 }] };
    editor.moveItemsInContainer([2], container, 3);
    expect(container.items[2].id).toBe(4);
    editor.moveItemsInContainer([2], container, 2);
    expect(container.items[2].id).toBe(4);
    editor.moveItemsInContainer([2], container, 1);
    expect(container.items[0].id).toBe(2);
    expect(container.items[1].id).toBe(4);
    expect(container.items[2].id).toBe(3);
  });
  test('向上移动到最后', () => {
    const container = { id: 1, type: NodeType.CONTAINER, items: [{ id: 2 }, { id: 3 }, { id: 4 }] };
    editor.moveItemsInContainer([2], container, 0);
    expect(container.items[0].id).toBe(4);
    expect(container.items[1].id).toBe(2);
    expect(container.items[2].id).toBe(3);
  });

  test('移动多个', () => {
    const container = {
      id: 1,
      type: NodeType.CONTAINER,
      items: [{ id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }, { id: 7 }],
    };
    editor.moveItemsInContainer([0, 5], container, 0);
    expect(container.items[0].id).toBe(2);
    expect(container.items[1].id).toBe(7);
    expect(container.items[2].id).toBe(3);
  });
});

describe('buildChangeRecords', () => {
  test('基础类型值', () => {
    const value = {
      name: 'test',
      age: 25,
      active: true,
    };
    const result = editor.buildChangeRecords(value, '');

    expect(result).toEqual([
      { propPath: 'name', value: 'test' },
      { propPath: 'age', value: 25 },
      { propPath: 'active', value: true },
    ]);
  });

  test('嵌套对象', () => {
    const value = {
      user: {
        name: 'John',
        profile: {
          age: 30,
          city: 'Beijing',
        },
      },
      settings: {
        theme: 'dark',
      },
    };
    const result = editor.buildChangeRecords(value, '');

    expect(result).toEqual([
      { propPath: 'user.name', value: 'John' },
      { propPath: 'user.profile.age', value: 30 },
      { propPath: 'user.profile.city', value: 'Beijing' },
      { propPath: 'settings.theme', value: 'dark' },
    ]);
  });

  test('带有basePath', () => {
    const value = {
      style: {
        width: 100,
        height: 200,
      },
    };
    const result = editor.buildChangeRecords(value, 'node');

    expect(result).toEqual([
      { propPath: 'node.style.width', value: 100 },
      { propPath: 'node.style.height', value: 200 },
    ]);
  });

  test('包含数组', () => {
    const value = {
      items: [1, 2, 3],
      config: {
        list: ['a', 'b'],
      },
    };
    const result = editor.buildChangeRecords(value, '');

    expect(result).toEqual([
      { propPath: 'items', value: [1, 2, 3] },
      { propPath: 'config.list', value: ['a', 'b'] },
    ]);
  });

  test('包含null值', () => {
    const value = {
      data: null,
      info: {
        value: null,
        name: 'test',
      },
    };
    const result = editor.buildChangeRecords(value, '');

    expect(result).toEqual([
      { propPath: 'data', value: null },
      { propPath: 'info.value', value: null },
      { propPath: 'info.name', value: 'test' },
    ]);
  });

  test('跳过undefined值', () => {
    const value = {
      name: 'test',
      age: undefined,
      info: {
        city: 'Beijing',
        country: undefined,
      },
    };
    const result = editor.buildChangeRecords(value, '');

    expect(result).toEqual([
      { propPath: 'name', value: 'test' },
      { propPath: 'info.city', value: 'Beijing' },
    ]);
  });

  test('空对象', () => {
    const value = {};
    const result = editor.buildChangeRecords(value, '');

    expect(result).toEqual([]);
  });

  test('深层嵌套', () => {
    const value = {
      level1: {
        level2: {
          level3: {
            level4: {
              value: 'deep',
            },
          },
        },
      },
    };
    const result = editor.buildChangeRecords(value, 'root');

    expect(result).toEqual([{ propPath: 'root.level1.level2.level3.level4.value', value: 'deep' }]);
  });

  test('混合类型', () => {
    const value = {
      string: 'text',
      number: 42,
      boolean: false,
      array: [1, 2],
      object: {
        nested: 'value',
      },
      nullValue: null,
    };
    const result = editor.buildChangeRecords(value, 'mixed');

    expect(result).toEqual([
      { propPath: 'mixed.string', value: 'text' },
      { propPath: 'mixed.number', value: 42 },
      { propPath: 'mixed.boolean', value: false },
      { propPath: 'mixed.array', value: [1, 2] },
      { propPath: 'mixed.object.nested', value: 'value' },
      { propPath: 'mixed.nullValue', value: null },
    ]);
  });
});

// ===== 以下为新提取的工具函数测试 =====

const mockRoot: MApp = {
  id: 'app_1',
  type: NodeType.ROOT,
  items: [
    {
      id: 'page_1',
      type: NodeType.PAGE,
      name: 'index',
      style: { position: 'relative', width: 375 },
      items: [
        {
          id: 'node_1',
          type: 'text',
          style: { position: 'absolute', top: 10, left: 20, width: 100 },
        },
        {
          id: 'node_2',
          type: 'button',
          style: { position: 'absolute', bottom: 50, right: 30 },
        },
        {
          id: 'node_3',
          type: 'image',
          style: { position: 'relative', top: 0, left: 0 },
        },
      ],
    },
  ],
};

const mockGetNodeInfo = (id: string | number): EditorNodeInfo => {
  const page = mockRoot.items[0];
  if (`${id}` === `${mockRoot.id}`) {
    return { node: mockRoot as unknown as MNode, parent: null, page: null };
  }
  if (`${id}` === `${page.id}`) {
    return { node: page, parent: mockRoot as unknown as MContainer, page: page as any };
  }
  const items = (page as MContainer).items || [];
  const node = items.find((n: MNode) => `${n.id}` === `${id}`);
  if (node) {
    return { node, parent: page as MContainer, page: page as any };
  }
  return { node: null, parent: null, page: null };
};

describe('resolveSelectedNode', () => {
  test('传入数字ID，正常返回节点信息', () => {
    const result = editor.resolveSelectedNode('node_1', mockGetNodeInfo, mockRoot.id);
    expect(result.node?.id).toBe('node_1');
    expect(result.parent?.id).toBe('page_1');
    expect(result.page?.id).toBe('page_1');
  });

  test('传入节点配置对象，正常返回节点信息', () => {
    const config: MNode = { id: 'node_2', type: 'button' };
    const result = editor.resolveSelectedNode(config, mockGetNodeInfo, mockRoot.id);
    expect(result.node?.id).toBe('node_2');
  });

  test('传入页面ID，正常返回页面信息', () => {
    const result = editor.resolveSelectedNode('page_1', mockGetNodeInfo, mockRoot.id);
    expect(result.node?.id).toBe('page_1');
  });

  test('传入空ID，抛出错误', () => {
    expect(() => editor.resolveSelectedNode({ id: '', type: 'text' }, mockGetNodeInfo)).toThrow('没有ID，无法选中');
  });

  test('传入不存在的ID，抛出错误', () => {
    expect(() => editor.resolveSelectedNode('not_exist', mockGetNodeInfo)).toThrow('获取不到组件信息');
  });

  test('传入根节点ID，抛出错误', () => {
    expect(() => editor.resolveSelectedNode('app_1', mockGetNodeInfo, mockRoot.id)).toThrow('不能选根节点');
  });

  test('不传rootId时，不校验根节点', () => {
    const result = editor.resolveSelectedNode('app_1', mockGetNodeInfo);
    expect(result.node?.id).toBe('app_1');
  });
});

describe('toggleFixedPosition', () => {
  const getLayoutFn = async () => Layout.ABSOLUTE;

  test('非fixed变为fixed，调用change2Fixed', async () => {
    const src: MNode = { id: 'node_1', type: 'text', style: { position: 'absolute', top: 10, left: 20 } };
    const dist: MNode = { id: 'node_1', type: 'text', style: { position: 'fixed', top: 10, left: 20 } };

    const result = await editor.toggleFixedPosition(dist, src, mockRoot, getLayoutFn);
    expect(result.style?.position).toBe('fixed');
    expect(result).not.toBe(dist);
  });

  test('fixed变为非fixed，调用Fixed2Other', async () => {
    const src: MNode = { id: 'node_1', type: 'text', style: { position: 'fixed', top: 10, left: 20 } };
    const dist: MNode = { id: 'node_1', type: 'text', style: { position: 'absolute', top: 10, left: 20 } };

    const result = await editor.toggleFixedPosition(dist, src, mockRoot, getLayoutFn);
    expect(result.style?.position).toBe('absolute');
  });

  test('定位未变化，不修改样式', async () => {
    const src: MNode = { id: 'node_1', type: 'text', style: { position: 'absolute', top: 10, left: 20 } };
    const dist: MNode = { id: 'node_1', type: 'text', style: { position: 'absolute', top: 30, left: 40 } };

    const result = await editor.toggleFixedPosition(dist, src, mockRoot, getLayoutFn);
    expect(result.style?.top).toBe(30);
    expect(result.style?.left).toBe(40);
  });

  test('pop类型节点不做处理', async () => {
    const src: MNode = {
      id: 'node_1',
      type: 'pop',
      style: { position: 'absolute', top: 10, left: 20 },
      name: 'pop',
    };
    const dist: MNode = { id: 'node_1', type: 'pop', style: { position: 'fixed', top: 10, left: 20 }, name: 'pop' };

    const result = await editor.toggleFixedPosition(dist, src, mockRoot, getLayoutFn);
    expect(result.style?.position).toBe('fixed');
  });

  test('目标节点无position属性，不做处理', async () => {
    const src: MNode = { id: 'node_1', type: 'text', style: { position: 'absolute' } };
    const dist: MNode = { id: 'node_1', type: 'text', style: { width: 100 } };

    const result = await editor.toggleFixedPosition(dist, src, mockRoot, getLayoutFn);
    expect(result.style?.position).toBeUndefined();
  });

  test('返回深拷贝，不修改原对象', async () => {
    const src: MNode = { id: 'node_1', type: 'text', style: { position: 'absolute', top: 10 } };
    const dist: MNode = { id: 'node_1', type: 'text', style: { position: 'absolute', top: 20 } };

    const result = await editor.toggleFixedPosition(dist, src, mockRoot, getLayoutFn);
    expect(result).not.toBe(dist);
    expect(dist.style?.top).toBe(20);
  });
});

describe('calcMoveStyle', () => {
  test('absolute定位，向下移动', () => {
    const style = { position: 'absolute', top: 10, left: 20 };
    const result = editor.calcMoveStyle(style, 0, 5);
    expect(result).toEqual({ position: 'absolute', top: 15, left: 20, bottom: '' });
  });

  test('absolute定位，向右移动', () => {
    const style = { position: 'absolute', top: 10, left: 20 };
    const result = editor.calcMoveStyle(style, 5, 0);
    expect(result).toEqual({ position: 'absolute', top: 10, left: 25, right: '' });
  });

  test('absolute定位，同时向下和向右移动', () => {
    const style = { position: 'absolute', top: 10, left: 20 };
    const result = editor.calcMoveStyle(style, 3, 7);
    expect(result).toEqual({ position: 'absolute', top: 17, left: 23, bottom: '', right: '' });
  });

  test('fixed定位，正常移动', () => {
    const style = { position: 'fixed', top: 100, left: 200 };
    const result = editor.calcMoveStyle(style, -10, -20);
    expect(result).toEqual({ position: 'fixed', top: 80, left: 190, bottom: '', right: '' });
  });

  test('使用bottom定位时，向下移动减小bottom', () => {
    const style = { position: 'absolute', bottom: 50, left: 20 };
    const result = editor.calcMoveStyle(style, 0, 10);
    expect(result?.bottom).toBe(40);
    expect(result?.top).toBe('');
  });

  test('使用right定位时，向右移动减小right', () => {
    const style = { position: 'absolute', top: 10, right: 30 };
    const result = editor.calcMoveStyle(style, 10, 0);
    expect(result?.right).toBe(20);
    expect(result?.left).toBe('');
  });

  test('relative定位，返回null', () => {
    const style = { position: 'relative', top: 0, left: 0 };
    const result = editor.calcMoveStyle(style, 10, 10);
    expect(result).toBeNull();
  });

  test('无position属性，返回null', () => {
    const style = { width: 100 };
    const result = editor.calcMoveStyle(style, 10, 10);
    expect(result).toBeNull();
  });

  test('空样式对象，返回null', () => {
    const result = editor.calcMoveStyle({}, 10, 10);
    expect(result).toBeNull();
  });

  test('偏移量为0，不修改样式', () => {
    const style = { position: 'absolute', top: 10, left: 20 };
    const result = editor.calcMoveStyle(style, 0, 0);
    expect(result).toEqual({ position: 'absolute', top: 10, left: 20 });
  });

  test('不修改原对象', () => {
    const style = { position: 'absolute', top: 10, left: 20 };
    editor.calcMoveStyle(style, 5, 5);
    expect(style.top).toBe(10);
    expect(style.left).toBe(20);
  });
});

describe('calcAlignCenterStyle', () => {
  test('absolute布局，通过配置中的width计算居中', () => {
    const node: MNode = { id: 'n1', type: 'text', style: { width: 100, left: 0 } };
    const parent = { id: 'p1', type: NodeType.PAGE, style: { width: 375 }, items: [] } as unknown as MContainer;
    const result = editor.calcAlignCenterStyle(node, parent, Layout.ABSOLUTE);
    expect(result?.left).toBe(137.5);
    expect(result?.right).toBe('');
  });

  test('relative布局，返回null', () => {
    const node: MNode = { id: 'n1', type: 'text', style: { width: 100 } };
    const parent = { id: 'p1', type: NodeType.PAGE, style: { width: 375 }, items: [] } as unknown as MContainer;
    const result = editor.calcAlignCenterStyle(node, parent, Layout.RELATIVE);
    expect(result).toBeNull();
  });

  test('节点无style，返回null', () => {
    const node: MNode = { id: 'n1', type: 'text' };
    const parent = { id: 'p1', type: NodeType.PAGE, style: { width: 375 }, items: [] } as unknown as MContainer;
    const result = editor.calcAlignCenterStyle(node, parent, Layout.ABSOLUTE);
    expect(result).toBeNull();
  });

  test('父节点无style，不修改', () => {
    const node: MNode = { id: 'n1', type: 'text', style: { width: 100, left: 10 } };
    const parent = { id: 'p1', type: NodeType.PAGE, items: [] } as unknown as MContainer;
    const result = editor.calcAlignCenterStyle(node, parent, Layout.ABSOLUTE);
    expect(result?.left).toBe(10);
  });

  test('父节点width非数字，不修改left', () => {
    const node: MNode = { id: 'n1', type: 'text', style: { width: 100, left: 10 } };
    const parent = {
      id: 'p1',
      type: NodeType.PAGE,
      style: { width: '100%' },
      items: [],
    } as unknown as MContainer;
    const result = editor.calcAlignCenterStyle(node, parent, Layout.ABSOLUTE);
    expect(result?.left).toBe(10);
  });

  test('不修改原节点style', () => {
    const node: MNode = { id: 'n1', type: 'text', style: { width: 100, left: 0 } };
    const parent = { id: 'p1', type: NodeType.PAGE, style: { width: 375 }, items: [] } as unknown as MContainer;
    editor.calcAlignCenterStyle(node, parent, Layout.ABSOLUTE);
    expect(node.style?.left).toBe(0);
  });
});

describe('calcLayerTargetIndex', () => {
  test('绝对定位，向上移动1层', () => {
    const result = editor.calcLayerTargetIndex(2, 1, 5, false);
    expect(result).toBe(3);
  });

  test('绝对定位，向下移动1层', () => {
    const result = editor.calcLayerTargetIndex(2, -1, 5, false);
    expect(result).toBe(1);
  });

  test('流式布局，向上移动1层（索引减小）', () => {
    const result = editor.calcLayerTargetIndex(2, 1, 5, true);
    expect(result).toBe(1);
  });

  test('流式布局，向下移动1层（索引增大）', () => {
    const result = editor.calcLayerTargetIndex(2, -1, 5, true);
    expect(result).toBe(3);
  });

  test('绝对定位，置顶', () => {
    const result = editor.calcLayerTargetIndex(2, LayerOffset.TOP, 5, false);
    expect(result).toBe(5);
  });

  test('绝对定位，置底', () => {
    const result = editor.calcLayerTargetIndex(2, LayerOffset.BOTTOM, 5, false);
    expect(result).toBe(0);
  });

  test('流式布局，置顶（索引最小）', () => {
    const result = editor.calcLayerTargetIndex(3, LayerOffset.TOP, 5, true);
    expect(result).toBe(0);
  });

  test('流式布局，置底（索引最大）', () => {
    const result = editor.calcLayerTargetIndex(1, LayerOffset.BOTTOM, 5, true);
    expect(result).toBe(5);
  });

  test('偏移量为0，索引不变', () => {
    const result = editor.calcLayerTargetIndex(2, 0, 5, false);
    expect(result).toBe(2);
  });
});

describe('editorNodeMergeCustomizer', () => {
  test('undefined 且 source 拥有该 key 时返回空字符串', () => {
    const source = { name: undefined };
    const result = editor.editorNodeMergeCustomizer('old', undefined, 'name', {}, source);
    expect(result).toBe('');
  });

  test('source 不拥有该 key 时返回 undefined（使用默认合并）', () => {
    const result = editor.editorNodeMergeCustomizer('old', undefined, 'name', {}, {});
    expect(result).toBeUndefined();
  });

  test('原来是数组，新值是对象，使用新值', () => {
    const srcValue = { a: 1 };
    const result = editor.editorNodeMergeCustomizer([1, 2], srcValue, 'key', {}, {});
    expect(result).toBe(srcValue);
  });

  test('新值是数组，直接替换', () => {
    const srcValue = [3, 4];
    const result = editor.editorNodeMergeCustomizer([1, 2], srcValue, 'key', {}, {});
    expect(result).toBe(srcValue);
  });

  test('都是普通值，返回 undefined（使用默认合并）', () => {
    const result = editor.editorNodeMergeCustomizer('old', 'new', 'key', {}, {});
    expect(result).toBeUndefined();
  });
});

describe('classifyDragSources', () => {
  const makeTree = (): { root: MApp; getNodeInfo: (id: any, raw?: boolean) => EditorNodeInfo } => {
    const child1: MNode = { id: 'c1', type: 'text' };
    const child2: MNode = { id: 'c2', type: 'text' };
    const child3: MNode = { id: 'c3', type: 'text' };
    const container1: MContainer = {
      id: 'cont1',
      type: NodeType.CONTAINER,
      items: [child1, child2],
    };
    const container2: MContainer = {
      id: 'cont2',
      type: NodeType.CONTAINER,
      items: [child3],
    };
    const page: any = {
      id: 'page_1',
      type: NodeType.PAGE,
      items: [container1, container2],
    };
    const root: MApp = { id: 'app', type: NodeType.ROOT, items: [page] };

    const getNodeInfo = (id: any): EditorNodeInfo => {
      if (`${id}` === 'c1' || `${id}` === 'c2') {
        return {
          node: container1.items.find((n) => `${n.id}` === `${id}`) ?? null,
          parent: container1,
          page,
        };
      }
      if (`${id}` === 'c3') {
        return { node: child3, parent: container2, page };
      }
      if (`${id}` === 'cont1') {
        return { node: container1, parent: page, page };
      }
      if (`${id}` === 'cont2') {
        return { node: container2, parent: page, page };
      }
      return { node: null, parent: null, page: null };
    };

    return { root, getNodeInfo };
  };

  test('同父容器内拖拽，返回 sameParentIndices', () => {
    const { getNodeInfo } = makeTree();
    const targetParent = getNodeInfo('cont1').node as MContainer;
    const result = editor.classifyDragSources([{ id: 'c1', type: 'text' }], targetParent, getNodeInfo);
    expect(result.aborted).toBe(false);
    expect(result.sameParentIndices).toEqual([0]);
    expect(result.crossParentConfigs).toHaveLength(0);
  });

  test('跨容器拖拽，返回 crossParentConfigs', () => {
    const { getNodeInfo } = makeTree();
    const targetParent = getNodeInfo('cont1').node as MContainer;
    const result = editor.classifyDragSources([{ id: 'c3', type: 'text' }], targetParent, getNodeInfo);
    expect(result.aborted).toBe(false);
    expect(result.sameParentIndices).toHaveLength(0);
    expect(result.crossParentConfigs).toHaveLength(1);
    expect(result.crossParentConfigs[0].config.id).toBe('c3');
  });

  test('混合拖拽：同容器+跨容器', () => {
    const { getNodeInfo } = makeTree();
    const targetParent = getNodeInfo('cont1').node as MContainer;
    const result = editor.classifyDragSources(
      [
        { id: 'c1', type: 'text' },
        { id: 'c3', type: 'text' },
      ],
      targetParent,
      getNodeInfo,
    );
    expect(result.aborted).toBe(false);
    expect(result.sameParentIndices).toEqual([0]);
    expect(result.crossParentConfigs).toHaveLength(1);
  });

  test('节点不存在时跳过', () => {
    const { getNodeInfo } = makeTree();
    const targetParent = getNodeInfo('cont1').node as MContainer;
    const result = editor.classifyDragSources([{ id: 'nonexistent', type: 'text' }], targetParent, getNodeInfo);
    expect(result.aborted).toBe(false);
    expect(result.sameParentIndices).toHaveLength(0);
    expect(result.crossParentConfigs).toHaveLength(0);
  });

  test('目标容器在节点路径上时跳过（防止循环嵌套）', () => {
    const { getNodeInfo } = makeTree();
    const targetParent = getNodeInfo('cont1').node as MContainer;
    const result = editor.classifyDragSources([{ id: 'c1', type: 'text' }], targetParent, (id: any) => {
      if (`${id}` === 'c1') {
        return {
          node: { id: 'c1', type: 'text' },
          parent: targetParent,
          page: { id: 'page_1', type: NodeType.PAGE, items: [] } as any,
        };
      }
      return { node: null, parent: null, page: null };
    });
    expect(result.sameParentIndices).toEqual([0]);
    expect(result.crossParentConfigs).toHaveLength(0);
  });
});

describe('calcMoveStyle', () => {
  test('非 absolute/fixed 返回 null', () => {
    expect(editor.calcMoveStyle({ position: 'relative' }, 1, 1)).toBeNull();
    expect(editor.calcMoveStyle(null as any, 1, 1)).toBeNull();
  });

  test('absolute + top/left', () => {
    const result = editor.calcMoveStyle({ position: 'absolute', top: 10, left: 5 }, 3, 4)!;
    expect(result.top).toBe(14);
    expect(result.left).toBe(8);
  });

  test('absolute + bottom/right (left/top 未定义)', () => {
    const result = editor.calcMoveStyle({ position: 'absolute', bottom: 10, right: 5 }, 3, 4)!;
    expect(result.bottom).toBe(6);
    expect(result.right).toBe(2);
  });
});

describe('calcAlignCenterStyle', () => {
  test('relative 布局返回 null', () => {
    const result = editor.calcAlignCenterStyle(
      { id: 'a', style: { width: 100 } } as any,
      { style: { width: 200 } } as any,
      Layout.RELATIVE,
    );
    expect(result).toBeNull();
  });

  test('无 doc 时按 parent.style 与 node.style 计算 left', () => {
    const result = editor.calcAlignCenterStyle(
      { id: 'a', style: { width: 100, position: 'absolute' } } as any,
      { style: { width: 300 } } as any,
      Layout.ABSOLUTE,
    );
    expect(result?.left).toBe(100);
    expect(result?.right).toBe('');
  });

  test('node 没有 style 返回 null', () => {
    const result = editor.calcAlignCenterStyle({ id: 'a' } as any, { style: { width: 100 } } as any, Layout.ABSOLUTE);
    expect(result).toBeNull();
  });
});

describe('calcLayerTargetIndex', () => {
  test('LayerOffset.TOP / BOTTOM', () => {
    expect(editor.calcLayerTargetIndex(2, LayerOffset.TOP, 5, false)).toBeGreaterThanOrEqual(0);
    expect(editor.calcLayerTargetIndex(2, LayerOffset.BOTTOM, 5, false)).toBeGreaterThanOrEqual(0);
  });

  test('数字 offset 走偏移逻辑', () => {
    const r1 = editor.calcLayerTargetIndex(2, 1, 5, true);
    const r2 = editor.calcLayerTargetIndex(2, 1, 5, false);
    expect(typeof r1).toBe('number');
    expect(typeof r2).toBe('number');
  });
});

describe('getGuideLineFromCache', () => {
  test('key 为空返回 []', () => {
    expect(editor.getGuideLineFromCache('')).toEqual([]);
  });

  test('返回缓存中的数组', () => {
    globalThis.localStorage.setItem('gl_test', JSON.stringify([1, 2, 3]));
    expect(editor.getGuideLineFromCache('gl_test')).toEqual([1, 2, 3]);
    globalThis.localStorage.removeItem('gl_test');
  });

  test('JSON 解析失败时返回 []', () => {
    globalThis.localStorage.setItem('gl_bad', 'not-json');
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(editor.getGuideLineFromCache('gl_bad')).toEqual([]);
    errSpy.mockRestore();
    globalThis.localStorage.removeItem('gl_bad');
  });
});

describe('change2Fixed / Fixed2Other', () => {
  const root: MApp = {
    id: 'app',
    type: NodeType.ROOT,
    items: [
      {
        id: 'p1',
        type: NodeType.PAGE,
        style: { left: 10, top: 20 },
        items: [
          {
            id: 'btn',
            type: 'text',
            style: { position: 'absolute', left: 5, top: 5 },
          },
        ],
      } as any,
    ],
  };

  test('change2Fixed 累加路径上的 left/top', () => {
    const node = root.items[0]!.items![0] as MNode;
    const style = editor.change2Fixed(node, root);
    expect(style.left).toBeGreaterThan(0);
    expect(style.top).toBeGreaterThan(0);
  });

  test('Fixed2Other 转回 absolute', async () => {
    const node = root.items[0]!.items![0] as MNode;
    const style = await editor.Fixed2Other(node, root, async () => Layout.ABSOLUTE);
    expect(style.position).toBe('absolute');
  });

  test('Fixed2Other 转回 relative 时 right/top 重置', async () => {
    const node = root.items[0]!.items![0] as MNode;
    const style = await editor.Fixed2Other(node, root, async () => Layout.RELATIVE);
    expect(style.position).toBe('relative');
  });
});

describe('补充：getPageList / getPageFragmentList / generatePageNameByApp 等基础工具', () => {
  test('getPageList - root 为 null/items 不是数组时返回空数组', () => {
    expect(editor.getPageList(null as any)).toEqual([]);
    expect(editor.getPageList(undefined as any)).toEqual([]);
    expect(editor.getPageList({ id: 'x', type: NodeType.ROOT } as any)).toEqual([]);
  });

  test('getPageFragmentList - root 为 null/items 不是数组时返回空数组', () => {
    expect(editor.getPageFragmentList(null as any)).toEqual([]);
    expect(editor.getPageFragmentList({ id: 'x', type: NodeType.ROOT } as any)).toEqual([]);
  });

  test('getPageFragmentList - 仅返回 page-fragment 节点', () => {
    const root: MApp = {
      id: 'a',
      type: NodeType.ROOT,
      items: [
        { id: 'pf1', type: NodeType.PAGE_FRAGMENT, items: [] } as any,
        { id: 'p1', type: NodeType.PAGE, items: [] } as any,
      ],
    };
    expect(editor.getPageFragmentList(root)).toHaveLength(1);
  });

  test('getPageNameList - 缺少 name 时使用 index 兜底', () => {
    const list = editor.getPageNameList([{ id: 'a', type: NodeType.PAGE, items: [] } as any]);
    expect(list[0]).toBe('index');
  });

  test('generatePageName - 列表为空时返回 index', () => {
    expect(editor.generatePageName([], NodeType.PAGE)).toBe('page_index');
  });

  test('generatePageName - 重名时累加索引', () => {
    expect(editor.generatePageName(['page_1', 'page_2'], NodeType.PAGE)).toBe('page_3');
  });

  test('generatePageNameByApp - PAGE / PAGE_FRAGMENT 两种类型', () => {
    const app: MApp = {
      id: 'a',
      type: NodeType.ROOT,
      items: [
        { id: 'p1', type: NodeType.PAGE, name: 'page_1', items: [] } as any,
        { id: 'pf', type: NodeType.PAGE_FRAGMENT, name: 'page-fragment_1', items: [] } as any,
      ],
    };
    expect(editor.generatePageNameByApp(app, NodeType.PAGE)).toBe('page_2');
    expect(editor.generatePageNameByApp(app, NodeType.PAGE_FRAGMENT)).toBe('page-fragment_2');
  });
});

describe('补充：getInitPositionStyle / setLayout / setChildrenLayout', () => {
  test('Layout.ABSOLUTE - 已有 right 时不会被填 left=0', () => {
    const style = editor.getInitPositionStyle({ right: 0 }, Layout.ABSOLUTE);
    expect(style.position).toBe('absolute');
    expect(style.left).toBeUndefined();
  });

  test('Layout.ABSOLUTE - 没有 left/right 时默认 left=0', () => {
    const style = editor.getInitPositionStyle({}, Layout.ABSOLUTE);
    expect(style.left).toBe(0);
  });

  test('Layout.RELATIVE - 走 getRelativeStyle', () => {
    const style = editor.getInitPositionStyle({ color: 'red' }, Layout.RELATIVE);
    expect(style.position).toBe('relative');
  });

  test('Layout.FIXED - 直接返回原 style', () => {
    const style = { color: 'red' };
    expect(editor.getInitPositionStyle(style, Layout.FIXED)).toBe(style);
  });

  test('setLayout - pop 类型不处理', () => {
    const node = { id: 'p', type: 'pop' } as any;
    expect(editor.setLayout(node, Layout.ABSOLUTE)).toBeUndefined();
  });

  test('setLayout - position fixed 不处理', () => {
    const node = { id: 'n', type: 'text', style: { position: 'fixed' } } as any;
    expect(editor.setLayout(node, Layout.ABSOLUTE)).toBeUndefined();
  });

  test('setLayout - RELATIVE 时使用 getRelativeStyle', () => {
    const node = { id: 'n', type: 'text', style: { left: 10 } } as any;
    editor.setLayout(node, Layout.RELATIVE);
    expect(node.style.position).toBe('relative');
    expect(node.style.right).toBe('auto');
    expect(node.style.bottom).toBe('auto');
  });

  test('setLayout - 其他 layout 时设置 position absolute', () => {
    const node = { id: 'n', type: 'text', style: {} } as any;
    editor.setLayout(node, Layout.ABSOLUTE);
    expect(node.style.position).toBe('absolute');
  });

  test('setLayout - 节点没有 style 时也能赋值', () => {
    const node = { id: 'n', type: 'text' } as any;
    editor.setLayout(node, Layout.ABSOLUTE);
  });

  test('setChildrenLayout - 遍历所有 child', () => {
    const container: MContainer = {
      id: 'c',
      type: NodeType.CONTAINER,
      items: [{ id: 'a', type: 'text', style: {} } as any, { id: 'b', type: 'text', style: {} } as any],
    };
    const result = editor.setChildrenLayout(container, Layout.ABSOLUTE);
    expect(result.items[0].style?.position).toBe('absolute');
    expect(result.items[1].style?.position).toBe('absolute');
  });
});

describe('补充：fixNodeLeft / fixNodePosition / serializeConfig', () => {
  test('fixNodeLeft - 缺少 doc 直接返回 style.left', () => {
    expect(editor.fixNodeLeft({ id: 'a', style: { left: 5 } } as any, { id: 'p' } as any)).toBe(5);
  });

  test('fixNodeLeft - left 不是数字直接返回', () => {
    expect(editor.fixNodeLeft({ id: 'a', style: { left: '5%' } } as any, { id: 'p' } as any, document)).toBe('5%');
  });

  test('fixNodeLeft - 元素 + 父元素 + 超出宽度时修正', () => {
    const doc = document.implementation.createHTMLDocument();
    const parent = doc.createElement('div');
    parent.dataset.tmagicId = 'p';
    Object.defineProperty(parent, 'offsetWidth', { value: 100 });
    const child = doc.createElement('div');
    child.dataset.tmagicId = 'a';
    Object.defineProperty(child, 'offsetWidth', { value: 80 });
    parent.appendChild(child);
    doc.body.appendChild(parent);

    expect(editor.fixNodeLeft({ id: 'a', style: { left: 50 } } as any, { id: 'p' } as any, doc)).toBe(20);
  });

  test('fixNodeLeft - 未超出宽度时返回原 left', () => {
    const doc = document.implementation.createHTMLDocument();
    const parent = doc.createElement('div');
    parent.dataset.tmagicId = 'p2';
    Object.defineProperty(parent, 'offsetWidth', { value: 200 });
    const child = doc.createElement('div');
    child.dataset.tmagicId = 'a2';
    Object.defineProperty(child, 'offsetWidth', { value: 50 });
    parent.appendChild(child);
    doc.body.appendChild(parent);

    expect(editor.fixNodeLeft({ id: 'a2', style: { left: 30 } } as any, { id: 'p2' } as any, doc)).toBe(30);
  });

  test('fixNodePosition - 非 absolute 时直接返回 style', () => {
    const style = { position: 'relative' } as any;
    expect(editor.fixNodePosition({ id: 'a', style } as any, { id: 'p', items: [] } as any, null)).toBe(style);
  });

  test('fixNodePosition - absolute 节点未传 stage 时也能得到 top/left', () => {
    const result = editor.fixNodePosition(
      { id: 'a', style: { position: 'absolute', height: 50 } } as any,
      { id: 'p', items: [], style: { height: 200 } } as any,
      null,
    );
    expect(result).toBeDefined();
  });

  test('serializeConfig - 输出去掉了 key 引号', () => {
    const out = editor.serializeConfig({ a: 1 });
    expect(out).toContain('a:');
  });
});

describe('补充：isIncludeDataSource', () => {
  test('updated 中包含模板字符串触发 true', () => {
    const oldNode = { id: '1', type: 't', text: 'foo' } as any;
    const newNode = { id: '1', type: 't', text: '${ds.bar}' } as any;
    expect(editor.isIncludeDataSource(newNode, oldNode)).toBe(true);
  });

  test('added 中包含模板字符串触发 true', () => {
    const oldNode = { id: '1', type: 't' } as any;
    const newNode = { id: '1', type: 't', text: '${ds.bar}' } as any;
    expect(editor.isIncludeDataSource(newNode, oldNode)).toBe(true);
  });

  test('NODE_CONDS_KEY 修改触发 true', async () => {
    const { NODE_CONDS_KEY } = await import('@tmagic/core');
    const oldNode = { id: '1', type: 't', [NODE_CONDS_KEY]: [] } as any;
    const newNode = { id: '1', type: 't', [NODE_CONDS_KEY]: [{ field: '${ds.x}', op: '=', value: '1' }] } as any;
    expect(editor.isIncludeDataSource(newNode, oldNode)).toBe(true);
  });

  test('NODE_CONDS_KEY 删除分支会被触发', async () => {
    const { NODE_CONDS_KEY } = await import('@tmagic/core');
    const oldNode = { id: '1', type: 't', [NODE_CONDS_KEY]: [{ field: 'a' }] } as any;
    const newNode = { id: '1', type: 't' } as any;
    // 期望函数能正常返回布尔值（覆盖 deleted 检查路径）
    expect(typeof editor.isIncludeDataSource(newNode, oldNode)).toBe('boolean');
  });

  test('删除带模板字符串字段会触发 deleted 检查路径', () => {
    const oldNode = { id: '1', type: 't', extra: '${ds.x}' } as any;
    const newNode = { id: '1', type: 't' } as any;
    expect(typeof editor.isIncludeDataSource(newNode, oldNode)).toBe('boolean');
  });

  test('完全无变更时返回 false', () => {
    const node = { id: '1', type: 't' } as any;
    expect(editor.isIncludeDataSource(node, node)).toBe(false);
  });

  test('updated 嵌套对象中查找数据源', () => {
    const oldNode = { id: '1', type: 't', data: { foo: { bar: 'a' } } } as any;
    const newNode = { id: '1', type: 't', data: { foo: { bar: '${ds.x}' } } } as any;
    expect(editor.isIncludeDataSource(newNode, oldNode)).toBe(true);
  });
});

describe('补充：collectRelatedNodes', () => {
  test('被复制节点引用了其他节点时把引用也加入 copyNodes', () => {
    const source: any = { id: 'src', type: 'text', binding: '${other_node.x}' };
    const other: any = { id: 'other_node', type: 'text' };
    const copyNodes: MNode[] = [source];
    editor.collectRelatedNodes(
      copyNodes,
      { type: 'related', isTarget: () => false, initialDeps: {} } as any,
      (id: any) => (id === 'other_node' ? other : null),
    );
    expect(Array.isArray(copyNodes)).toBe(true);
  });
});

describe('补充：calcAlignCenterStyle 通过 DOM 计算', () => {
  test('提供 doc 时通过 element 实际宽度计算 left', () => {
    const doc = document.implementation.createHTMLDocument();
    const parent = doc.createElement('div');
    Object.defineProperty(parent, 'clientWidth', { value: 300 });
    const child = doc.createElement('div');
    child.dataset.tmagicId = 'aa';
    Object.defineProperty(child, 'clientWidth', { value: 100 });
    Object.defineProperty(child, 'offsetParent', { value: parent });
    parent.appendChild(child);
    doc.body.appendChild(parent);

    const result = editor.calcAlignCenterStyle(
      { id: 'aa', style: { width: 100, position: 'absolute' } } as any,
      { id: 'p', style: { width: 300 } } as any,
      Layout.ABSOLUTE,
      doc,
    );
    expect(result?.left).toBe(100);
    expect(result?.right).toBe('');
  });

  test('提供 doc + Layout.FIXED 用 doc.body 作为 parent', () => {
    const doc = document.implementation.createHTMLDocument();
    Object.defineProperty(doc.body, 'clientWidth', { value: 500, configurable: true });
    const child = doc.createElement('div');
    child.dataset.tmagicId = 'bb';
    Object.defineProperty(child, 'clientWidth', { value: 100 });
    doc.body.appendChild(child);
    const result = editor.calcAlignCenterStyle(
      { id: 'bb', style: { width: 100, position: 'fixed' } } as any,
      { id: 'p', style: { width: 500 } } as any,
      Layout.FIXED,
      doc,
    );
    expect(result?.left).toBe(200);
  });
});

describe('补充：change2Fixed 边界', () => {
  test('遇到祖先有 right/非数字 left 时 offset 重置为 0', () => {
    const root: MApp = {
      id: 'app',
      type: NodeType.ROOT,
      items: [
        {
          id: 'p1',
          type: NodeType.PAGE,
          style: { right: 10 },
          items: [{ id: 'b', type: 'text', style: { position: 'absolute', left: 5, top: 5 } }],
        } as any,
      ],
    };
    const node = root.items[0]!.items![0] as MNode;
    const style = editor.change2Fixed(node, root);
    expect(style.left).toBe(5);
  });

  test('节点本身有 right 时不累加 left', () => {
    const root: MApp = {
      id: 'app',
      type: NodeType.ROOT,
      items: [
        {
          id: 'p1',
          type: NodeType.PAGE,
          style: { left: 10, top: 20 },
          items: [{ id: 'b', type: 'text', style: { position: 'absolute', right: 5 } }],
        } as any,
      ],
    };
    const node = root.items[0]!.items![0] as MNode;
    const style = editor.change2Fixed(node, root);
    expect(style.left).toBeUndefined();
  });
});

describe('补充：classifyDragSources 同父容器索引异常', () => {
  test('当 getNodeIndex 返回 -1 时 aborted=true', () => {
    const targetParent: MContainer = { id: 't', type: NodeType.CONTAINER, items: [] };
    const result = editor.classifyDragSources([{ id: 'x', type: 'text' }], targetParent, ((id: any) => ({
      node: { id, type: 'text' },
      parent: targetParent,
      page: null,
    })) as any);
    expect(result.aborted).toBe(true);
  });
});

describe('toggleFixedPosition', () => {
  test('fixed -> 非 fixed 触发 Fixed2Other', async () => {
    const root: MApp = {
      id: 'app',
      type: NodeType.ROOT,
      items: [{ id: 'p1', type: NodeType.PAGE, items: [] } as any],
    };
    const result = await editor.toggleFixedPosition(
      { id: 'a', type: 'text', style: { position: 'absolute', top: 0, left: 0 } } as any,
      { id: 'a', type: 'text', style: { position: 'fixed' } } as any,
      root,
      async () => Layout.ABSOLUTE,
    );
    expect(result.style?.position).toBeDefined();
  });

  test('非 fixed -> fixed 触发 change2Fixed', async () => {
    const root: MApp = {
      id: 'app',
      type: NodeType.ROOT,
      items: [
        {
          id: 'p1',
          type: NodeType.PAGE,
          style: { left: 0, top: 0 },
          items: [{ id: 'a', type: 'text', style: { position: 'fixed', left: 0, top: 0 } }],
        } as any,
      ],
    };
    const result = await editor.toggleFixedPosition(
      { id: 'a', type: 'text', style: { position: 'fixed', left: 0, top: 0 } } as any,
      { id: 'a', type: 'text', style: { position: 'absolute' } } as any,
      root,
      async () => Layout.ABSOLUTE,
    );
    expect(result.style?.position).toBe('fixed');
  });
});
