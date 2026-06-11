/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';

import history from '@editor/services/history';

afterEach(() => {
  history.reset();
});

describe('history service', () => {
  test('changePage 切换页面会创建对应的 UndoRedo', () => {
    history.changePage({ id: 'p1' } as any);
    expect((history.state.pageSteps as any).p1).toBeDefined();
  });

  test('push / undo / redo 链路', () => {
    history.changePage({ id: 'p1' } as any);
    const v1 = { data: { items: [] }, modifiedNodeIds: new Map(), nodeId: 'a' } as any;
    const v2 = { data: { items: [] }, modifiedNodeIds: new Map(), nodeId: 'b' } as any;
    history.push(v1);
    history.push(v2);

    const undone = history.undo();
    expect(undone).toBeDefined();
    const redone = history.redo();
    expect(redone).toBeDefined();
  });

  test('未指定 pageId 时 push/undo/redo 返回 null', () => {
    history.resetPage();
    expect(history.push({} as any)).toBeNull();
    expect(history.undo()).toBeNull();
    expect(history.redo()).toBeNull();
  });

  test('reset / resetPage / resetState', () => {
    history.changePage({ id: 'p1' } as any);
    history.push({ data: {} } as any);
    history.reset();
    expect(history.state.pageId).toBeUndefined();
    expect(Object.keys(history.state.pageSteps)).toHaveLength(0);
  });

  test('canUndo / canRedo 在 push 后更新', () => {
    history.changePage({ id: 'p1' } as any);
    history.push({ data: {} } as any);
    history.push({ data: {} } as any);
    expect(history.state.canUndo).toBe(true);
  });

  test('changePage 接到 undefined/null 时不变更', () => {
    history.changePage(null as any);
    expect(history.state.pageId).toBeUndefined();
  });

  test('push 指定 pageId 落到目标页栈，不影响当前页', () => {
    // 当前激活在 p1
    history.changePage({ id: 'p1' } as any);
    const step = { data: { id: 'p2', name: '' }, modifiedNodeIds: new Map() } as any;

    // 跨页 push：把记录推到 p2（目标页），p1 栈应保持为空
    history.push(step, 'p2');
    expect((history.state.pageSteps as any).p2).toBeDefined();
    expect((history.state.pageSteps as any).p2.canUndo()).toBe(true);
    // p1 栈虽然激活但没有 push 进来，仍不可撤销
    expect((history.state.pageSteps as any).p1.canUndo()).toBe(false);

    // 跨页 push 不应触发当前页（p1）的 canUndo 改变
    expect(history.state.canUndo).toBe(false);

    // 切到 p2 后能正常 undo 该跨页步骤
    history.changePage({ id: 'p2' } as any);
    expect(history.state.canUndo).toBe(true);
    expect(history.undo()).toBeDefined();
  });

  test('push 不传 pageId 时落到当前活动页栈（向后兼容）', () => {
    history.changePage({ id: 'p1' } as any);
    history.push({ data: { id: 'p1', name: '' }, modifiedNodeIds: new Map() } as any);
    expect((history.state.pageSteps as any).p1.canUndo()).toBe(true);
    expect(history.state.canUndo).toBe(true);
  });

  test('push 未带 timestamp 时自动写入入栈时间', () => {
    history.changePage({ id: 'p1' } as any);
    const before = Date.now();
    const step = history.push({ data: { id: 'p1', name: '' }, modifiedNodeIds: new Map() } as any);
    const after = Date.now();
    expect(step?.timestamp).toBeGreaterThanOrEqual(before);
    expect(step?.timestamp).toBeLessThanOrEqual(after);
  });

  test('push 已带 timestamp 时保留调用方指定的值', () => {
    history.changePage({ id: 'p1' } as any);
    const step = history.push({
      data: { id: 'p1', name: '' },
      modifiedNodeIds: new Map(),
      timestamp: 123456,
    } as any);
    expect(step?.timestamp).toBe(123456);
  });

  test('push 未带 uuid 时自动生成 uuid', () => {
    history.changePage({ id: 'p1' } as any);
    const step = history.push({ data: { id: 'p1', name: '' }, modifiedNodeIds: new Map() } as any);
    expect(typeof step?.uuid).toBe('string');
    expect(step?.uuid).toBeTruthy();
  });

  test('push 已带 uuid 时保留调用方指定的值', () => {
    history.changePage({ id: 'p1' } as any);
    const step = history.push({
      uuid: 'my-uuid',
      data: { id: 'p1', name: '' },
      modifiedNodeIds: new Map(),
    } as any);
    expect(step?.uuid).toBe('my-uuid');
  });

  test('push 为每条记录生成不同的 uuid', () => {
    history.changePage({ id: 'p1' } as any);
    const s1 = history.push({ data: { id: 'p1', name: '' }, modifiedNodeIds: new Map() } as any);
    const s2 = history.push({ data: { id: 'p1', name: '' }, modifiedNodeIds: new Map() } as any);
    expect(s1?.uuid).toBeTruthy();
    expect(s2?.uuid).toBeTruthy();
    expect(s1?.uuid).not.toBe(s2?.uuid);
  });

  test('setPageMarker 在空栈时种入 initial 基线', () => {
    history.changePage({ id: 'p1' } as any);
    const marker = history.setPageMarker('p1', { name: '首页', description: '初始' });
    expect(marker?.opType).toBe('initial');
    expect(history.getPageMarker('p1')?.uuid).toBe(marker?.uuid);
    expect((history.state.pageSteps as any).p1.getLength()).toBe(1);
  });

  test('有 initial 基线时不可撤销越过基线', () => {
    history.changePage({ id: 'p1' } as any);
    history.setPageMarker('p1');
    history.push({ data: { id: 'p1', name: '' }, modifiedNodeIds: new Map() } as any);

    expect(history.state.canUndo).toBe(true);
    history.undo();
    expect(history.state.canUndo).toBe(false);
    expect(history.undo()).toBeNull();
    expect(history.getPageCursor('p1')).toBe(1);
  });

  test('getPageHistoryGroups 过滤 initial 基线', () => {
    history.changePage({ id: 'p1' } as any);
    history.setPageMarker('p1');
    history.push({
      opType: 'add',
      diff: [{ newSchema: { id: 'n1', name: 'A' } }],
      modifiedNodeIds: new Map(),
    } as any);

    const groups = history.getPageHistoryGroups('p1');
    expect(groups).toHaveLength(1);
    expect(groups[0].opType).toBe('add');
  });
});

describe('history service - codeBlock', () => {
  test('pushCodeBlock 入栈并触发 code-block-history-change 事件', () => {
    const fn = vi.fn();
    history.on('code-block-history-change', fn);

    const step = history.pushCodeBlock('code_1', {
      oldContent: null,
      newContent: { name: 'A', content: 'x' } as any,
    });

    expect(step).not.toBeNull();
    expect(step?.id).toBe('code_1');
    expect(step?.diff?.[0]?.oldSchema).toBeUndefined();
    expect(step?.diff?.[0]?.newSchema).toEqual({ name: 'A', content: 'x' });
    expect((history.state.codeBlockState as any).code_1).toBeDefined();
    expect(history.canUndoCodeBlock('code_1')).toBe(true);
    expect(fn).toHaveBeenCalledWith('code_1', expect.objectContaining({ id: 'code_1' }));

    history.off('code-block-history-change', fn);
  });

  test('pushCodeBlock 不传 id 返回 null', () => {
    expect(history.pushCodeBlock('', { oldContent: null, newContent: null })).toBeNull();
  });

  test('pushCodeBlock 自动写入入栈时间戳', () => {
    const before = Date.now();
    const step = history.pushCodeBlock('code_1', { oldContent: null, newContent: { name: 'A' } as any });
    const after = Date.now();
    expect(step?.timestamp).toBeGreaterThanOrEqual(before);
    expect(step?.timestamp).toBeLessThanOrEqual(after);
  });

  test('pushCodeBlock 自动生成 uuid', () => {
    const step = history.pushCodeBlock('code_1', { oldContent: null, newContent: { name: 'A' } as any });
    expect(typeof step?.uuid).toBe('string');
    expect(step?.uuid).toBeTruthy();
  });

  test('undoCodeBlock / redoCodeBlock 走对应 id 的 UndoRedo 栈', () => {
    history.pushCodeBlock('code_1', { oldContent: null, newContent: { name: 'A' } as any });
    history.pushCodeBlock('code_1', {
      oldContent: { name: 'A' } as any,
      newContent: { name: 'B' } as any,
    });

    expect(history.canUndoCodeBlock('code_1')).toBe(true);
    const undone = history.undoCodeBlock('code_1');
    expect(undone?.diff?.[0]?.newSchema).toEqual({ name: 'B' });
    expect(history.canRedoCodeBlock('code_1')).toBe(true);

    const redone = history.redoCodeBlock('code_1');
    expect(redone?.diff?.[0]?.newSchema).toEqual({ name: 'B' });
  });

  test('undoCodeBlock 对不存在 id 返回 null', () => {
    expect(history.undoCodeBlock('not-exist')).toBeNull();
    expect(history.redoCodeBlock('not-exist')).toBeNull();
    expect(history.canUndoCodeBlock('not-exist')).toBe(false);
    expect(history.canRedoCodeBlock('not-exist')).toBe(false);
  });

  test('不同代码块 id 的栈相互隔离', () => {
    history.pushCodeBlock('code_1', { oldContent: null, newContent: { name: 'A' } as any });
    history.pushCodeBlock('code_2', { oldContent: null, newContent: { name: 'B' } as any });

    expect(history.canUndoCodeBlock('code_1')).toBe(true);
    expect(history.canUndoCodeBlock('code_2')).toBe(true);

    history.undoCodeBlock('code_1');
    expect(history.canUndoCodeBlock('code_1')).toBe(false);
    // code_2 的栈不受影响
    expect(history.canUndoCodeBlock('code_2')).toBe(true);
  });

  test('reset / resetState 清空 codeBlockState', () => {
    history.pushCodeBlock('code_1', { oldContent: null, newContent: { name: 'A' } as any });
    history.reset();
    expect(Object.keys(history.state.codeBlockState)).toHaveLength(0);

    history.pushCodeBlock('code_1', { oldContent: null, newContent: { name: 'A' } as any });
    history.resetState();
    expect(Object.keys(history.state.codeBlockState)).toHaveLength(0);
  });
});

describe('history service - dataSource', () => {
  test('pushDataSource 入栈并触发 data-source-history-change 事件', () => {
    const fn = vi.fn();
    history.on('data-source-history-change', fn);

    const step = history.pushDataSource('ds_1', {
      oldSchema: null,
      newSchema: { id: 'ds_1', type: 'base', title: 'A' } as any,
    });

    expect(step).not.toBeNull();
    expect(step?.id).toBe('ds_1');
    expect(step?.diff?.[0]?.oldSchema).toBeUndefined();
    expect(step?.diff?.[0]?.newSchema?.title).toBe('A');
    expect((history.state.dataSourceState as any).ds_1).toBeDefined();
    expect(history.canUndoDataSource('ds_1')).toBe(true);
    expect(fn).toHaveBeenCalledWith('ds_1', expect.objectContaining({ id: 'ds_1' }));

    history.off('data-source-history-change', fn);
  });

  test('pushDataSource 不传 id 返回 null', () => {
    expect(history.pushDataSource('', { oldSchema: null, newSchema: null })).toBeNull();
  });

  test('pushDataSource 自动写入入栈时间戳', () => {
    const before = Date.now();
    const step = history.pushDataSource('ds_1', { oldSchema: null, newSchema: { id: 'ds_1' } as any });
    const after = Date.now();
    expect(step?.timestamp).toBeGreaterThanOrEqual(before);
    expect(step?.timestamp).toBeLessThanOrEqual(after);
  });

  test('pushDataSource 自动生成 uuid', () => {
    const step = history.pushDataSource('ds_1', { oldSchema: null, newSchema: { id: 'ds_1' } as any });
    expect(typeof step?.uuid).toBe('string');
    expect(step?.uuid).toBeTruthy();
  });

  test('undoDataSource / redoDataSource 走对应 id 的 UndoRedo 栈', () => {
    history.pushDataSource('ds_1', {
      oldSchema: null,
      newSchema: { id: 'ds_1', type: 'base', title: 'A' } as any,
    });
    history.pushDataSource('ds_1', {
      oldSchema: { id: 'ds_1', type: 'base', title: 'A' } as any,
      newSchema: { id: 'ds_1', type: 'base', title: 'B' } as any,
    });

    const undone = history.undoDataSource('ds_1');
    expect(undone?.diff?.[0]?.newSchema?.title).toBe('B');

    const redone = history.redoDataSource('ds_1');
    expect(redone?.diff?.[0]?.newSchema?.title).toBe('B');
  });

  test('undoDataSource 对不存在 id 返回 null', () => {
    expect(history.undoDataSource('not-exist')).toBeNull();
    expect(history.redoDataSource('not-exist')).toBeNull();
    expect(history.canUndoDataSource('not-exist')).toBe(false);
    expect(history.canRedoDataSource('not-exist')).toBe(false);
  });

  test('不同数据源 id 的栈相互隔离', () => {
    history.pushDataSource('ds_1', { oldSchema: null, newSchema: { id: 'ds_1' } as any });
    history.pushDataSource('ds_2', { oldSchema: null, newSchema: { id: 'ds_2' } as any });

    history.undoDataSource('ds_1');
    expect(history.canUndoDataSource('ds_1')).toBe(false);
    expect(history.canUndoDataSource('ds_2')).toBe(true);
  });

  test('reset / resetState 清空 dataSourceState', () => {
    history.pushDataSource('ds_1', { oldSchema: null, newSchema: { id: 'ds_1' } as any });
    history.reset();
    expect(Object.keys(history.state.dataSourceState)).toHaveLength(0);

    history.pushDataSource('ds_1', { oldSchema: null, newSchema: { id: 'ds_1' } as any });
    history.resetState();
    expect(Object.keys(history.state.dataSourceState)).toHaveLength(0);
  });
});
