/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2023 THL A29 Limited, a Tencent company.  All rights reserved.
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

import { NodeType } from '@tmagic/schema';

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

describe('isFixed', () => {
  test('true', () => {
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

  test('false', () => {
    expect(
      editor.isFixed({
        type: 'text',
        id: 1,
        style: {
          position: 'absolute',
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
