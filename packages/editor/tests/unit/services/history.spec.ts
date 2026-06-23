/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';

import history from '@editor/services/history';
import { createStackStep } from '@editor/utils/history';

// pushCodeBlock / pushDataSource 已合入统一的 push(stepType, step, id)。
// 这里用与旧便捷方法等价的小工具，按 payload 构造 step 后走新的 push，便于沿用既有用例。
const pushCodeBlock = (id: any, payload: any) => {
  const step = createStackStep(id, {
    oldValue: payload.oldContent,
    newValue: payload.newContent,
    changeRecords: payload.changeRecords,
    historyDescription: payload.historyDescription,
    source: payload.source,
  });
  return step ? history.push('codeBlock', step as any, id) : null;
};

const pushDataSource = (id: any, payload: any) => {
  const step = createStackStep(id, {
    oldValue: payload.oldSchema,
    newValue: payload.newSchema,
    changeRecords: payload.changeRecords,
    historyDescription: payload.historyDescription,
    source: payload.source,
  });
  return step ? history.push('dataSource', step as any, id) : null;
};

afterEach(() => {
  history.reset();
});

describe('history service', () => {
  test('push / undo / redo 链路', () => {
    const v1 = { data: { items: [] }, modifiedNodeIds: new Map(), nodeId: 'a' } as any;
    const v2 = { data: { items: [] }, modifiedNodeIds: new Map(), nodeId: 'b' } as any;
    history.push('page', v1, 'p1');
    history.push('page', v2, 'p1');

    const undone = history.undo('page', 'p1');
    expect(undone).toBeDefined();
    const redone = history.redo('page', 'p1');
    expect(redone).toBeDefined();
  });

  test('未传 / 无效 id 时 push/undo/redo 返回 null', () => {
    expect(history.push('page', {} as any, '')).toBeNull();
    expect(history.undo('page', '')).toBeNull();
    expect(history.redo('page', '')).toBeNull();
  });

  test('reset / resetState 清空页面栈', () => {
    history.push('page', { data: {} } as any, 'p1');
    history.reset();
    expect(Object.keys(history.state.steps.page)).toHaveLength(0);
  });

  test('canUndo / canRedo 在 push 后更新', () => {
    history.push('page', { data: {} } as any, 'p1');
    history.push('page', { data: {} } as any, 'p1');
    expect(history.canUndo('page', 'p1')).toBe(true);
  });

  test('push 指定 pageId 落到目标页栈，不影响其它页', () => {
    const step = { data: { id: 'p2', name: '' }, modifiedNodeIds: new Map() } as any;

    // 跨页 push：把记录推到 p2（目标页），p1 栈应保持为空
    history.push('page', step, 'p2');
    expect((history.state.steps.page as any).p2).toBeDefined();
    expect(history.canUndo('page', 'p2')).toBe(true);
    // p1 栈没有 push 进来，仍不可撤销
    expect(history.canUndo('page', 'p1')).toBe(false);

    // p2 能正常 undo 该步骤
    expect(history.undo('page', 'p2')).toBeDefined();
  });

  test('push 未带 timestamp 时自动写入入栈时间', () => {
    const before = Date.now();
    const step = history.push('page', { data: { id: 'p1', name: '' }, modifiedNodeIds: new Map() } as any, 'p1');
    const after = Date.now();
    expect(step?.timestamp).toBeGreaterThanOrEqual(before);
    expect(step?.timestamp).toBeLessThanOrEqual(after);
  });

  test('push 已带 timestamp 时保留调用方指定的值', () => {
    const step = history.push(
      'page',
      {
        data: { id: 'p1', name: '' },
        modifiedNodeIds: new Map(),
        timestamp: 123456,
      } as any,
      'p1',
    );
    expect(step?.timestamp).toBe(123456);
  });

  test('push 未带 uuid 时自动生成 uuid', () => {
    const step = history.push('page', { data: { id: 'p1', name: '' }, modifiedNodeIds: new Map() } as any, 'p1');
    expect(typeof step?.uuid).toBe('string');
    expect(step?.uuid).toBeTruthy();
  });

  test('push 已带 uuid 时保留调用方指定的值', () => {
    const step = history.push(
      'page',
      {
        uuid: 'my-uuid',
        data: { id: 'p1', name: '' },
        modifiedNodeIds: new Map(),
      } as any,
      'p1',
    );
    expect(step?.uuid).toBe('my-uuid');
  });

  test('push 为每条记录生成不同的 uuid', () => {
    const s1 = history.push('page', { data: { id: 'p1', name: '' }, modifiedNodeIds: new Map() } as any, 'p1');
    const s2 = history.push('page', { data: { id: 'p1', name: '' }, modifiedNodeIds: new Map() } as any, 'p1');
    expect(s1?.uuid).toBeTruthy();
    expect(s2?.uuid).toBeTruthy();
    expect(s1?.uuid).not.toBe(s2?.uuid);
  });

  test('setMarker 在空栈时种入 initial 基线', () => {
    const marker = history.setMarker('page', 'p1', { name: '首页', description: '初始' });
    expect(marker?.opType).toBe('initial');
    expect(history.getMarker('page', 'p1')?.uuid).toBe(marker?.uuid);
    expect((history.state.steps.page as any).p1.getLength()).toBe(1);
  });

  test('有 initial 基线时不可撤销越过基线', () => {
    history.setMarker('page', 'p1');
    history.push('page', { data: { id: 'p1', name: '' }, modifiedNodeIds: new Map() } as any, 'p1');

    expect(history.canUndo('page', 'p1')).toBe(true);
    history.undo('page', 'p1');
    expect(history.canUndo('page', 'p1')).toBe(false);
    expect(history.undo('page', 'p1')).toBeNull();
    expect(history.getCursor('page', 'p1')).toBe(1);
  });

  test('扩展类型同样支持 initial 基线（撤销不越过基线）', () => {
    history.setMarker('custom', 'ext_1', {});
    history.push('custom', { opType: 'update', diff: [] } as any, 'ext_1');

    expect(history.canUndo('custom', 'ext_1')).toBe(true);
    history.undo('custom', 'ext_1');
    expect(history.canUndo('custom', 'ext_1')).toBe(false);
    expect(history.undo('custom', 'ext_1')).toBeNull();
  });

  test('getHistoryGroups 过滤 initial 基线', () => {
    history.setMarker('page', 'p1');
    history.push(
      'page',
      {
        opType: 'add',
        diff: [{ newSchema: { id: 'n1', name: 'A' } }],
        modifiedNodeIds: new Map(),
      } as any,
      'p1',
    );

    const groups = history.getHistoryGroups('page', 'p1');
    expect(groups).toHaveLength(1);
    expect(groups[0].opType).toBe('add');
  });
});

describe('history service - codeBlock', () => {
  test('pushCodeBlock 入栈并触发 change 事件', () => {
    const fn = vi.fn();
    history.on('change', fn);

    const step = pushCodeBlock('code_1', {
      oldContent: null,
      newContent: { name: 'A', content: 'x' } as any,
    });

    expect(step).not.toBeNull();
    expect(step?.data?.id).toBe('code_1');
    expect(step?.diff?.[0]?.oldSchema).toBeUndefined();
    expect(step?.diff?.[0]?.newSchema).toEqual({ name: 'A', content: 'x' });
    expect((history.state.steps.codeBlock as any).code_1).toBeDefined();
    expect(history.canUndo('codeBlock', 'code_1')).toBe(true);
    expect(fn).toHaveBeenCalledWith(
      expect.objectContaining({ data: { name: 'A', id: 'code_1' } }),
      'codeBlock',
      'code_1',
    );

    history.off('change', fn);
  });

  test('pushCodeBlock 不传 id 返回 null', () => {
    expect(pushCodeBlock('', { oldContent: null, newContent: null })).toBeNull();
  });

  test('pushCodeBlock 自动写入入栈时间戳', () => {
    const before = Date.now();
    const step = pushCodeBlock('code_1', { oldContent: null, newContent: { name: 'A' } as any });
    const after = Date.now();
    expect(step?.timestamp).toBeGreaterThanOrEqual(before);
    expect(step?.timestamp).toBeLessThanOrEqual(after);
  });

  test('pushCodeBlock 自动生成 uuid', () => {
    const step = pushCodeBlock('code_1', { oldContent: null, newContent: { name: 'A' } as any });
    expect(typeof step?.uuid).toBe('string');
    expect(step?.uuid).toBeTruthy();
  });

  test('undoCodeBlock / redoCodeBlock 走对应 id 的 UndoRedo 栈', () => {
    pushCodeBlock('code_1', { oldContent: null, newContent: { name: 'A' } as any });
    pushCodeBlock('code_1', {
      oldContent: { name: 'A' } as any,
      newContent: { name: 'B' } as any,
    });

    expect(history.canUndo('codeBlock', 'code_1')).toBe(true);
    const undone = history.undo('codeBlock', 'code_1');
    expect(undone?.diff?.[0]?.newSchema).toEqual({ name: 'B' });
    expect(history.canRedo('codeBlock', 'code_1')).toBe(true);

    const redone = history.redo('codeBlock', 'code_1');
    expect(redone?.diff?.[0]?.newSchema).toEqual({ name: 'B' });
  });

  test('undoCodeBlock 对不存在 id 返回 null', () => {
    expect(history.undo('codeBlock', 'not-exist')).toBeNull();
    expect(history.redo('codeBlock', 'not-exist')).toBeNull();
    expect(history.canUndo('codeBlock', 'not-exist')).toBe(false);
    expect(history.canRedo('codeBlock', 'not-exist')).toBe(false);
  });

  test('不同代码块 id 的栈相互隔离', () => {
    pushCodeBlock('code_1', { oldContent: null, newContent: { name: 'A' } as any });
    pushCodeBlock('code_2', { oldContent: null, newContent: { name: 'B' } as any });

    expect(history.canUndo('codeBlock', 'code_1')).toBe(true);
    expect(history.canUndo('codeBlock', 'code_2')).toBe(true);

    history.undo('codeBlock', 'code_1');
    expect(history.canUndo('codeBlock', 'code_1')).toBe(false);
    // code_2 的栈不受影响
    expect(history.canUndo('codeBlock', 'code_2')).toBe(true);
  });

  test('reset / resetState 清空 codeBlockState', () => {
    pushCodeBlock('code_1', { oldContent: null, newContent: { name: 'A' } as any });
    history.reset();
    expect(Object.keys(history.state.steps.codeBlock)).toHaveLength(0);

    pushCodeBlock('code_1', { oldContent: null, newContent: { name: 'A' } as any });
    history.resetState();
    expect(Object.keys(history.state.steps.codeBlock)).toHaveLength(0);
  });
});

describe('history service - dataSource', () => {
  test('pushDataSource 入栈并触发 change 事件', () => {
    const fn = vi.fn();
    history.on('change', fn);

    const step = pushDataSource('ds_1', {
      oldSchema: null,
      newSchema: { id: 'ds_1', type: 'base', title: 'A' } as any,
    });

    expect(step).not.toBeNull();
    expect(step?.data?.id).toBe('ds_1');
    expect(step?.diff?.[0]?.oldSchema).toBeUndefined();
    expect(step?.diff?.[0]?.newSchema?.title).toBe('A');
    expect((history.state.steps.dataSource as any).ds_1).toBeDefined();
    expect(history.canUndo('dataSource', 'ds_1')).toBe(true);
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({ data: { name: 'A', id: 'ds_1' } }), 'dataSource', 'ds_1');

    history.off('change', fn);
  });

  test('pushDataSource 不传 id 返回 null', () => {
    expect(pushDataSource('', { oldSchema: null, newSchema: null })).toBeNull();
  });

  test('pushDataSource 自动写入入栈时间戳', () => {
    const before = Date.now();
    const step = pushDataSource('ds_1', { oldSchema: null, newSchema: { id: 'ds_1' } as any });
    const after = Date.now();
    expect(step?.timestamp).toBeGreaterThanOrEqual(before);
    expect(step?.timestamp).toBeLessThanOrEqual(after);
  });

  test('pushDataSource 自动生成 uuid', () => {
    const step = pushDataSource('ds_1', { oldSchema: null, newSchema: { id: 'ds_1' } as any });
    expect(typeof step?.uuid).toBe('string');
    expect(step?.uuid).toBeTruthy();
  });

  test('undoDataSource / redoDataSource 走对应 id 的 UndoRedo 栈', () => {
    pushDataSource('ds_1', {
      oldSchema: null,
      newSchema: { id: 'ds_1', type: 'base', title: 'A' } as any,
    });
    pushDataSource('ds_1', {
      oldSchema: { id: 'ds_1', type: 'base', title: 'A' } as any,
      newSchema: { id: 'ds_1', type: 'base', title: 'B' } as any,
    });

    const undone = history.undo('dataSource', 'ds_1');
    expect(undone?.diff?.[0]?.newSchema?.title).toBe('B');

    const redone = history.redo('dataSource', 'ds_1');
    expect(redone?.diff?.[0]?.newSchema?.title).toBe('B');
  });

  test('undoDataSource 对不存在 id 返回 null', () => {
    expect(history.undo('dataSource', 'not-exist')).toBeNull();
    expect(history.redo('dataSource', 'not-exist')).toBeNull();
    expect(history.canUndo('dataSource', 'not-exist')).toBe(false);
    expect(history.canRedo('dataSource', 'not-exist')).toBe(false);
  });

  test('不同数据源 id 的栈相互隔离', () => {
    pushDataSource('ds_1', { oldSchema: null, newSchema: { id: 'ds_1' } as any });
    pushDataSource('ds_2', { oldSchema: null, newSchema: { id: 'ds_2' } as any });

    history.undo('dataSource', 'ds_1');
    expect(history.canUndo('dataSource', 'ds_1')).toBe(false);
    expect(history.canUndo('dataSource', 'ds_2')).toBe(true);
  });

  test('reset / resetState 清空 dataSourceState', () => {
    pushDataSource('ds_1', { oldSchema: null, newSchema: { id: 'ds_1' } as any });
    history.reset();
    expect(Object.keys(history.state.steps.dataSource)).toHaveLength(0);

    pushDataSource('ds_1', { oldSchema: null, newSchema: { id: 'ds_1' } as any });
    history.resetState();
    expect(Object.keys(history.state.steps.dataSource)).toHaveLength(0);
  });
});
