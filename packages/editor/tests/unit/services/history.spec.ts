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
});
