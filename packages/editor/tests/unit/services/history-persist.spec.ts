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
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

import history from '@editor/services/history';
import { setEditorConfig } from '@editor/utils/config';
import * as indexedDb from '@editor/utils/indexed-db';

// 用内存实现 mock 掉 IndexedDB 读写工具，避免依赖真实 IndexedDB（happy-dom 不提供）。
vi.mock('@editor/utils/indexed-db', () => {
  const store = new Map<string, any>();
  const k = (db: string, s: string, key: any) => `${db}__${s}__${String(key)}`;
  return {
    isIndexedDBSupported: () => true,
    openIndexedDB: vi.fn(),
    idbSet: vi.fn(async (db: string, s: string, key: any, value: any) => {
      store.set(k(db, s, key), value);
    }),
    idbGet: vi.fn(async (db: string, s: string, key: any) => store.get(k(db, s, key))),
    idbDelete: vi.fn(async (db: string, s: string, key: any) => {
      store.delete(k(db, s, key));
    }),
    __store: store,
  };
});

beforeAll(() => {
  // restoreFromIndexedDB 通过 parseDSL 还原序列化字符串（默认实现即 eval）。
  // eslint-disable-next-line no-eval
  setEditorConfig({ parseDSL: (dsl: string) => eval(dsl) } as any);
});

beforeEach(() => {
  (indexedDb as any).__store.clear();
});

afterEach(() => {
  history.reset();
});

const pageStep = (id = 'p1') => ({ data: { id, name: '' }, modifiedNodeIds: new Map() }) as any;

describe('history service - markSaved', () => {
  test('markSaved 派发 mark-saved 事件并带 kind=all', () => {
    const fn = vi.fn();
    history.on('mark-saved', fn);
    history.markSaved();
    expect(fn).toHaveBeenCalledWith({ kind: 'all' });
    history.off('mark-saved', fn);
  });

  test('markPageSaved / markCodeBlockSaved / markDataSourceSaved 派发对应 kind 事件', () => {
    history.changePage({ id: 'p1' } as any);
    history.push(pageStep());
    history.pushCodeBlock('code_1', { oldContent: null, newContent: { name: 'A' } as any });

    const pageFn = vi.fn();
    const codeFn = vi.fn();
    history.on('mark-saved', (payload) => {
      if (payload.kind === 'page') pageFn(payload);
      if (payload.kind === 'code-block') codeFn(payload);
    });

    history.markPageSaved();
    history.markCodeBlockSaved('code_1');

    expect(pageFn).toHaveBeenCalledWith({ kind: 'page', id: 'p1' });
    expect(codeFn).toHaveBeenCalledWith({ kind: 'code-block', id: 'code_1' });
  });
});

describe('history service - clear', () => {
  test('clearPage 清空当前页面历史并复位 canUndo/canRedo', () => {
    history.changePage({ id: 'p1' } as any);
    history.push(pageStep());
    history.push(pageStep());
    expect(history.state.canUndo).toBe(true);

    history.clearPage();
    expect((history.state.pageSteps as any).p1.getLength()).toBe(0);
    expect(history.state.canUndo).toBe(false);
    expect(history.state.canRedo).toBe(false);
  });

  test('clearCodeBlock 传 id 清单个，缺省清全部', () => {
    history.pushCodeBlock('code_1', { oldContent: null, newContent: { name: 'A' } as any });
    history.pushCodeBlock('code_2', { oldContent: null, newContent: { name: 'B' } as any });

    history.clearCodeBlock('code_1');
    expect((history.state.codeBlockState as any).code_1).toBeUndefined();
    expect((history.state.codeBlockState as any).code_2).toBeDefined();

    history.clearCodeBlock();
    expect(Object.keys(history.state.codeBlockState)).toHaveLength(0);
  });

  test('clearDataSource 传 id 清单个，缺省清全部', () => {
    history.pushDataSource('ds_1', { oldSchema: null, newSchema: { id: 'ds_1' } as any });
    history.pushDataSource('ds_2', { oldSchema: null, newSchema: { id: 'ds_2' } as any });

    history.clearDataSource('ds_1');
    expect((history.state.dataSourceState as any).ds_1).toBeUndefined();
    expect((history.state.dataSourceState as any).ds_2).toBeDefined();

    history.clearDataSource();
    expect(Object.keys(history.state.dataSourceState)).toHaveLength(0);
  });
});

describe('history service - IndexedDB 持久化', () => {
  test('saveToIndexedDB 以序列化字符串写入并返回快照对象', async () => {
    history.changePage({ id: 'p1' } as any);
    history.push(pageStep());

    const snapshot = await history.saveToIndexedDB();
    expect(snapshot.version).toBe(1);
    expect(snapshot.pageId).toBe('p1');
    // 实际写入 IndexedDB 的是字符串（serialize-javascript 结果）
    expect(indexedDb.idbSet).toHaveBeenCalled();
    const written = (indexedDb.idbSet as any).mock.calls[0][3];
    expect(typeof written).toBe('string');
  });

  test('restoreFromIndexedDB 还原页面 / 代码块 / 数据源全部栈与游标', async () => {
    history.changePage({ id: 'p1' } as any);
    history.push(pageStep());
    history.push(pageStep());
    history.undo(); // page cursor = 1
    history.pushCodeBlock('code_1', { oldContent: null, newContent: { name: 'A' } as any });
    history.pushDataSource('ds_1', { oldSchema: null, newSchema: { id: 'ds_1' } as any });

    await history.saveToIndexedDB();
    history.reset();
    expect(Object.keys(history.state.pageSteps)).toHaveLength(0);

    const restored = await history.restoreFromIndexedDB();
    expect(restored).not.toBeNull();
    expect(history.state.pageId).toBe('p1');
    expect(history.getPageCursor('p1')).toBe(1);
    expect((history.state.codeBlockState as any).code_1).toBeDefined();
    expect((history.state.dataSourceState as any).ds_1).toBeDefined();
  });

  test('restoreFromIndexedDB 把游标恢复到最近一个已保存记录', async () => {
    history.changePage({ id: 'p1' } as any);
    history.push(pageStep());
    history.push(pageStep());
    history.markPageSaved(); // 标记 index 1（cursor=2）
    history.push(pageStep()); // cursor=3，saved 仍在 index 1

    await history.saveToIndexedDB();
    history.reset();

    await history.restoreFromIndexedDB();
    // 恢复后游标定位到已保存记录之后：index 1 -> cursor 2
    expect(history.getPageCursor('p1')).toBe(2);
  });

  test('restoreFromIndexedDB 能还原内容中的函数（serialize + parseDSL 往返）', async () => {
    history.pushCodeBlock('code_1', {
      oldContent: null,
      newContent: {
        name: 'A',
        code() {
          return 42;
        },
      } as any,
    });

    await history.saveToIndexedDB();
    history.reset();
    await history.restoreFromIndexedDB();

    const current = (history.state.codeBlockState as any).code_1.getCurrentElement();
    expect(typeof current.diff[0].newSchema.code).toBe('function');
    expect(current.diff[0].newSchema.code()).toBe(42);
  });

  test('restoreFromIndexedDB 找不到记录时返回 null 且不改动当前状态', async () => {
    history.changePage({ id: 'p1' } as any);
    history.push(pageStep());

    const restored = await history.restoreFromIndexedDB();
    expect(restored).toBeNull();
    // 当前状态保持不变
    expect((history.state.pageSteps as any).p1.getLength()).toBe(1);
  });

  test('saveToIndexedDB 派发 save-to-indexed-db、restoreFromIndexedDB 派发 restore-from-indexed-db', async () => {
    const saveFn = vi.fn();
    const restoreFn = vi.fn();
    history.on('save-to-indexed-db', saveFn);
    history.on('restore-from-indexed-db', restoreFn);

    history.changePage({ id: 'p1' } as any);
    history.push(pageStep());
    await history.saveToIndexedDB();
    await history.restoreFromIndexedDB();

    expect(saveFn).toHaveBeenCalledTimes(1);
    expect(restoreFn).toHaveBeenCalledTimes(1);

    history.off('save-to-indexed-db', saveFn);
    history.off('restore-from-indexed-db', restoreFn);
  });
});
