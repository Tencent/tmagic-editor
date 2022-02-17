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

import { MNode } from '@tmagic/schema';

import * as editor from '@editor/utils/editor';

describe('util form', () => {
  it('generateId', () => {
    const id = editor.generateId('text');

    expect(id.startsWith('text')).toBeTruthy();
  });

  it('getPageList', () => {
    const pageList = editor.getPageList({
      id: 'app_1',
      type: 'app',
      items: [
        {
          id: 'page_1',
          name: 'index',
          type: 'page',
          items: [],
        },
      ],
    });

    expect(pageList[0].name).toBe('index');
  });

  it('getPageNameList', () => {
    const pageList = editor.getPageNameList([
      {
        id: 'page_1',
        name: 'index',
        type: 'page',
        items: [],
      },
    ]);

    expect(pageList[0]).toBe('index');
  });

  it('generatePageName', () => {
    // 已有一个页面了，再生成出来的name格式为page_${index}
    const name = editor.generatePageName(['index', 'page_2']);
    // 第二个页面
    expect(name).toBe('page_3');
  });
});

describe('setNewItemId', () => {
  it('普通', () => {
    const config = {
      id: 1,
      type: 'text',
    };
    // 将组件与组件的子元素配置中的id都设置成一个新的ID
    editor.setNewItemId(config);
    expect(config.id === 1).toBeFalsy();
  });

  it('items', () => {
    const config = {
      id: 1,
      type: 'page',
      items: [
        {
          type: 'text',
          id: 2,
        },
      ],
    };
    editor.setNewItemId(config);
    expect(config.id === 1).toBeFalsy();
    expect(config.items[0].id === 2).toBeFalsy();
  });

  it('pop', () => {
    const config = {
      id: 1,
      type: 'page',
      items: [
        {
          type: 'button',
          id: 2,
          pop: 3,
        },
        {
          type: 'pop',
          id: 3,
        },
      ],
    };
    editor.setNewItemId(config);
    expect(config.items[0].pop === 3).toBeFalsy();
    expect(config.items[1].id === 3).toBeFalsy();
    expect(config.items[1].id === config.items[0].pop).toBeTruthy();
  });
});

describe('isFixed', () => {
  it('true', () => {
    expect(
      editor.isFixed({
        type: 'text',
        id: 1,
        style: {
          position: 'fixed',
        },
      }),
    ).toBeTruthy();
  });

  it('false', () => {
    expect(
      editor.isFixed({
        type: 'text',
        id: 1,
        style: {
          absulote: 'absulote',
        },
      }),
    ).toBeFalsy();

    expect(
      editor.isFixed({
        type: 'text',
        id: 1,
        style: {},
      }),
    ).toBeFalsy();
  });
});

describe('getNodeIndex', () => {
  it('能获取到', () => {
    const index = editor.getNodeIndex(
      {
        type: 'text',
        id: 1,
      },
      {
        id: 2,
        type: 'page',
        items: [
          {
            type: 'text',
            id: 1,
          },
        ],
      },
    );
    expect(index).toBe(0);
  });

  it('不能能获取到', () => {
    // id为1不在查找数据中
    const index = editor.getNodeIndex(
      {
        type: 'text',
        id: 1,
      },
      {
        id: 2,
        type: 'page',
        items: [
          {
            type: 'text',
            id: 3,
          },
        ],
      },
    );
    expect(index).toBe(-1);
  });
});

describe('toRelative', () => {
  it('正常', () => {
    const config: MNode = {
      type: 'text',
      id: 1,
      style: {
        color: 'red',
      },
    };
    editor.toRelative(config);
    expect(config.style?.position).toBe('relative');
    expect(config.style?.top).toBe(0);
    expect(config.style?.left).toBe(0);
    expect(config.style?.color).toBe('red');
  });
});
