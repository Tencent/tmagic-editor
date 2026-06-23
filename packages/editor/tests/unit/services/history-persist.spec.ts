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
import { createStackStep } from '@editor/utils/history';
import * as indexedDb from '@editor/utils/indexed-db';

// pushCodeBlock / pushDataSource 已合入统一的 push(stepType, step, id)；用等价小工具沿用既有用例。
const pushCodeBlock = (id: any, payload: any) => {
  const step = createStackStep(id, {
    oldValue: payload.oldContent,
    newValue: payload.newContent,
    changeRecords: payload.changeRecords,
  });
  return step ? history.push('codeBlock', step as any, id) : null;
};
const pushDataSource = (id: any, payload: any) => {
  const step = createStackStep(id, {
    oldValue: payload.oldSchema,
    newValue: payload.newSchema,
    changeRecords: payload.changeRecords,
  });
  return step ? history.push('dataSource', step as any, id) : null;
};

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
    history.markSaved('page');
    expect(fn).toHaveBeenCalledWith({ kind: 'all' });
    history.off('mark-saved', fn);
  });

  test('markSaved(stepType, id) 派发对应 kind 事件', () => {
    history.push('page', pageStep(), 'p1');
    pushCodeBlock('code_1', { oldContent: null, newContent: { name: 'A' } as any });

    const pageFn = vi.fn();
    const codeFn = vi.fn();
    history.on('mark-saved', (payload) => {
      if (payload.kind === 'page') pageFn(payload);
      if (payload.kind === 'codeBlock') codeFn(payload);
    });

    history.markSaved('page', 'p1');
    history.markSaved('codeBlock', 'code_1');

    expect(pageFn).toHaveBeenCalledWith({ kind: 'page', id: 'p1' });
    expect(codeFn).toHaveBeenCalledWith({ kind: 'codeBlock', id: 'code_1' });
  });
});

describe('history service - clear', () => {
  test('clear 清空指定页面历史并复位 canUndo/canRedo', () => {
    history.push('page', pageStep(), 'p1');
    history.push('page', pageStep(), 'p1');
    expect(history.canUndo('page', 'p1')).toBe(true);

    history.clear('page', 'p1');
    expect((history.state.steps.page as any).p1.getLength()).toBe(0);
    expect(history.canUndo('page', 'p1')).toBe(false);
    expect(history.canRedo('page', 'p1')).toBe(false);
  });

  test('clear 保留被清空栈的 initial 基线', () => {
    history.setMarker('page', 'p1', { name: 'P1', description: '初始' });
    history.push('page', pageStep(), 'p1');
    expect((history.state.steps.page as any).p1.getLength()).toBe(2);

    history.clear('page', 'p1');
    // 真实操作记录被清空，仅保留 index 0 的 initial 基线
    expect((history.state.steps.page as any).p1.getLength()).toBe(1);
    expect(history.getMarker('page', 'p1')?.opType).toBe('initial');
    expect(history.canUndo('page', 'p1')).toBe(false);
  });

  test('clear 传 id 清单个，缺省清全部（codeBlock）', () => {
    pushCodeBlock('code_1', { oldContent: null, newContent: { name: 'A' } as any });
    pushCodeBlock('code_2', { oldContent: null, newContent: { name: 'B' } as any });

    history.clear('codeBlock', 'code_1');
    expect((history.state.steps.codeBlock as any).code_1.getLength()).toBe(0);
    expect((history.state.steps.codeBlock as any).code_2.getLength()).toBe(1);

    history.clear('codeBlock');
    expect((history.state.steps.codeBlock as any).code_2.getLength()).toBe(0);
  });

  test('clear 传 id 清单个，缺省清全部（dataSource）', () => {
    pushDataSource('ds_1', { oldSchema: null, newSchema: { id: 'ds_1' } as any });
    pushDataSource('ds_2', { oldSchema: null, newSchema: { id: 'ds_2' } as any });

    history.clear('dataSource', 'ds_1');
    expect((history.state.steps.dataSource as any).ds_1.getLength()).toBe(0);
    expect((history.state.steps.dataSource as any).ds_2.getLength()).toBe(1);

    history.clear('dataSource');
    expect((history.state.steps.dataSource as any).ds_2.getLength()).toBe(0);
  });
});

describe('history service - IndexedDB 持久化', () => {
  test('saveToIndexedDB 以对象写入（仅 step.diff 序列化成字符串）并返回快照对象', async () => {
    history.push('page', { ...pageStep(), diff: [{ newSchema: { id: 'n1', name: '节点' } }] } as any, 'p1');

    const snapshot = await history.saveToIndexedDB();
    expect(snapshot.version).toBe(3);
    // 实际写入 IndexedDB 的是对象（交给结构化克隆），仅每条 step 的 diff 被序列化成字符串
    expect(indexedDb.idbSet).toHaveBeenCalled();
    const written = (indexedDb.idbSet as any).mock.calls[0][3];
    expect(typeof written).toBe('object');
    expect(typeof written.steps.page.p1.elementList[0].diff).toBe('string');
    // diff 之外的字段（如 modifiedNodeIds Map）原样交给结构化克隆，不被字符串化
    expect(written.steps.page.p1.elementList[0].modifiedNodeIds instanceof Map).toBe(true);
    // 返回的快照即写入 IndexedDB 的持久化形态：diff 已是序列化字符串
    expect(written).toBe(snapshot);
    expect(typeof snapshot.steps.page.p1.elementList[0].diff).toBe('string');
  });

  test('restoreFromIndexedDB 还原页面 / 代码块 / 数据源全部栈与游标', async () => {
    history.push('page', pageStep(), 'p1');
    history.push('page', pageStep(), 'p1');
    history.undo('page', 'p1'); // page cursor = 1
    pushCodeBlock('code_1', { oldContent: null, newContent: { name: 'A' } as any });
    pushDataSource('ds_1', { oldSchema: null, newSchema: { id: 'ds_1' } as any });

    await history.saveToIndexedDB();
    history.reset();
    expect(Object.keys(history.state.steps.page)).toHaveLength(0);

    const restored = await history.restoreFromIndexedDB();
    expect(restored).not.toBeNull();
    expect(history.getCursor('page', 'p1')).toBe(1);
    expect((history.state.steps.codeBlock as any).code_1).toBeDefined();
    expect((history.state.steps.dataSource as any).ds_1).toBeDefined();
  });

  test('restoreFromIndexedDB 把游标恢复到最近一个已保存记录', async () => {
    history.push('page', pageStep(), 'p1');
    history.push('page', pageStep(), 'p1');
    history.markSaved('page', 'p1'); // 标记 index 1（cursor=2）
    history.push('page', pageStep(), 'p1'); // cursor=3，saved 仍在 index 1

    await history.saveToIndexedDB();
    history.reset();

    await history.restoreFromIndexedDB();
    // 恢复后游标定位到已保存记录之后：index 1 -> cursor 2
    expect(history.getCursor('page', 'p1')).toBe(2);
  });

  test('restoreFromIndexedDB 能还原内容中的函数（serialize + parseDSL 往返）', async () => {
    pushCodeBlock('code_1', {
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

    const current = (history.state.steps.codeBlock as any).code_1.getCurrentElement();
    expect(typeof current.diff[0].newSchema.code).toBe('function');
    expect(current.diff[0].newSchema.code()).toBe(42);
  });

  test('restoreFromIndexedDB 找不到记录时返回 null 且不改动当前状态', async () => {
    history.push('page', pageStep(), 'p1');

    const restored = await history.restoreFromIndexedDB();
    expect(restored).toBeNull();
    // 当前状态保持不变
    expect((history.state.steps.page as any).p1.getLength()).toBe(1);
  });

  test('saveToIndexedDB 派发 save-to-indexed-db、restoreFromIndexedDB 派发 restore-from-indexed-db', async () => {
    const saveFn = vi.fn();
    const restoreFn = vi.fn();
    history.on('save-to-indexed-db', saveFn);
    history.on('restore-from-indexed-db', restoreFn);

    history.push('page', pageStep(), 'p1');
    await history.saveToIndexedDB();
    await history.restoreFromIndexedDB();

    expect(saveFn).toHaveBeenCalledTimes(1);
    expect(restoreFn).toHaveBeenCalledTimes(1);

    history.off('save-to-indexed-db', saveFn);
    history.off('restore-from-indexed-db', restoreFn);
  });
});
