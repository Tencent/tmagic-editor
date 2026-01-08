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
import { describe, expect, test } from 'vitest';

import { NodeType } from '@tmagic/core';

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
