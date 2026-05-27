/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test } from 'vitest';

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
});
