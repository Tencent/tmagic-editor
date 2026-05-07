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

import { type MApp, NodeType } from '@tmagic/schema';

import App from '../src/App';

const createDsl = (): MApp => ({
  type: NodeType.ROOT,
  id: 'app_1',
  items: [
    {
      type: NodeType.PAGE,
      id: 'page_1',
      items: [
        { id: 'btn_1', type: 'button' },
        {
          id: 'container_1',
          type: 'container',
          items: [{ id: 'text_1', type: 'text' }],
        },
      ],
    },
    {
      type: NodeType.PAGE,
      id: 'page_2',
      items: [{ id: 'btn_2', type: 'button' }],
    },
  ],
});

describe('Page', () => {
  test('初始化时收集页面下所有节点', () => {
    const app = new App({ config: createDsl() });
    const { page } = app;
    expect(page).toBeDefined();
    expect(page?.nodes.has('page_1')).toBe(true);
    expect(page?.nodes.has('btn_1')).toBe(true);
    expect(page?.nodes.has('container_1')).toBe(true);
    expect(page?.nodes.has('text_1')).toBe(true);
  });

  test('getNode 通过 id 直接获取', () => {
    const app = new App({ config: createDsl() });
    const node = app.page?.getNode('text_1');
    expect(node?.data.id).toBe('text_1');
  });

  test('getNode 不存在的 id 返回 undefined', () => {
    const app = new App({ config: createDsl() });
    expect(app.page?.getNode('not-exist')).toBeUndefined();
  });

  test('setNode / deleteNode 工作正常', () => {
    const app = new App({ config: createDsl() });
    const page = app.page!;
    const fakeNode = { destroy() {} } as any;
    page.setNode('foo', fakeNode);
    expect(page.nodes.has('foo')).toBe(true);
    page.deleteNode('foo');
    expect(page.nodes.has('foo')).toBe(false);
  });

  test('destroy 后节点 map 被清空', () => {
    const app = new App({ config: createDsl() });
    const page = app.page!;
    expect(page.nodes.size).toBeGreaterThan(0);
    page.destroy();
    expect(page.nodes.size).toBe(0);
  });

  test('切换页面会构建新的 page', () => {
    const app = new App({ config: createDsl() });
    expect(app.page?.data.id).toBe('page_1');
    app.setPage('page_2');
    expect(app.page?.data.id).toBe('page_2');
    expect(app.page?.nodes.has('btn_2')).toBe(true);
  });
});
