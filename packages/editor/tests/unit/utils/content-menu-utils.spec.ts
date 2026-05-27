/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { ref } from 'vue';

import { NodeType } from '@tmagic/core';

import { useCopyMenu, useDeleteMenu, useMoveToMenu, usePasteMenu } from '@editor/utils/content-menu';

describe('content-menu utils', () => {
  test('useDeleteMenu - 普通节点 display=true 并触发 remove', () => {
    const remove = vi.fn();
    const editorService: any = {
      get: (k: string) => {
        if (k === 'node') return { type: 'text' };
        if (k === 'nodes') return [{ id: 1 }];
        return undefined;
      },
      remove,
    };
    const m = useDeleteMenu();
    expect(m.text).toBe('删除');
    expect((m as any).display({ editorService })).toBe(true);
    (m as any).handler({ editorService });
    expect(remove).toHaveBeenCalled();
  });

  test('useDeleteMenu - 页面/根节点 display=false', () => {
    const editorService: any = {
      get: () => ({ type: NodeType.ROOT }),
      remove: vi.fn(),
    };
    const m = useDeleteMenu();
    expect((m as any).display({ editorService })).toBe(false);

    editorService.get = () => ({ type: NodeType.PAGE });
    expect((m as any).display({ editorService })).toBe(false);
  });

  test('useCopyMenu 触发 editorService.copy', () => {
    const copy = vi.fn();
    const editorService: any = {
      get: () => [{ id: 1 }],
      copy,
    };
    const m = useCopyMenu();
    (m as any).handler({ editorService });
    expect(copy).toHaveBeenCalled();
  });

  test('usePasteMenu - storage 有数据时 display=true，无数据 false', () => {
    const m = usePasteMenu();
    expect(
      (m as any).display({
        storageService: { getItem: () => '{"a":1}' },
      }),
    ).toBe(true);
    expect(
      (m as any).display({
        storageService: { getItem: () => null },
      }),
    ).toBe(false);
  });

  test('usePasteMenu - 当节点为空时不调用 paste', () => {
    const paste = vi.fn();
    const editorService: any = {
      get: (k: string) => (k === 'nodes' ? [] : null),
      paste,
    };
    const m = usePasteMenu();
    (m as any).handler({ editorService, uiService: { get: () => 1 } });
    expect(paste).not.toHaveBeenCalled();
  });

  test('usePasteMenu - 普通粘贴', () => {
    const paste = vi.fn();
    const editorService: any = {
      get: (k: string) => (k === 'nodes' ? [{ id: 1 }] : null),
      paste,
    };
    const m = usePasteMenu();
    (m as any).handler({ editorService, uiService: { get: () => 1 } });
    expect(paste).toHaveBeenCalled();
  });

  test('usePasteMenu - 通过 menu.$el 计算定位 paste', () => {
    const paste = vi.fn();
    const stage = {
      container: { getBoundingClientRect: () => ({ left: 5, top: 8 }) },
      renderer: { getDocument: () => document },
    };
    const editorService: any = {
      get: (k: string) => {
        if (k === 'nodes') return [{ id: 1 }];
        if (k === 'stage') return stage;
        return null;
      },
      paste,
    };
    const menuEl = document.createElement('div');
    menuEl.getBoundingClientRect = () => ({
      left: 30,
      top: 40,
      right: 30,
      bottom: 40,
      width: 0,
      height: 0,
      x: 30,
      y: 40,
      toJSON: () => ({}),
    });
    const menu = ref<any>({ $el: menuEl });
    const m = usePasteMenu(menu);
    (m as any).handler({ editorService, uiService: { get: () => 2 } });
    expect(paste).toHaveBeenCalledWith(expect.objectContaining({ left: expect.any(Number), top: expect.any(Number) }));
  });

  test('useMoveToMenu - display 行为校验', () => {
    const root = ref({ items: [{ id: 'p1', name: 'P1' }] });
    const editorService: any = {
      get: (k: string) => {
        if (k === 'root') return root.value;
        if (k === 'page') return { id: 'p1' };
        if (k === 'pageLength') return 2;
        if (k === 'node') return { id: 'btn' };
        return undefined;
      },
      add: vi.fn(),
      remove: vi.fn(),
      getNodeById: () => null,
    };
    const m = useMoveToMenu({ editorService } as any);
    expect((m as any).display({ editorService })).toBe(true);
    editorService.get = (k: string) => {
      if (k === 'pageLength') return 1;
      if (k === 'node') return { type: NodeType.PAGE };
      return undefined;
    };
    expect((m as any).display({ editorService })).toBe(false);
  });

  test('useMoveToMenu - 没有 parent 时直接 return', () => {
    const root = ref({ items: [{ id: 'p1', name: 'P1' }] });
    const editorService: any = {
      get: (k: string) => {
        if (k === 'root') return root.value;
        if (k === 'page') return { id: 'p2' };
        if (k === 'pageLength') return 2;
        if (k === 'node') return { id: 'btn' };
        if (k === 'nodes') return [{ id: 'btn' }];
        return undefined;
      },
      moveToContainer: vi.fn(),
      getNodeById: () => null,
    };
    const m = useMoveToMenu({ editorService } as any);
    (m as any).items[0].handler({ editorService });
    expect(editorService.moveToContainer).not.toHaveBeenCalled();
  });

  test('useMoveToMenu - root 为空时 items 为空数组', () => {
    const editorService: any = {
      get: (k: string) => {
        if (k === 'root') return null;
        if (k === 'page') return { id: 'x' };
        return undefined;
      },
    };
    const m = useMoveToMenu({ editorService } as any);
    expect((m as any).items).toEqual([]);
  });

  test('useMoveToMenu - 列出非当前页 page，并执行 moveTo', () => {
    const root = ref({
      items: [
        { id: 'p1', name: 'P1' },
        { id: 'p2', name: 'P2' },
      ],
    });
    const editorService: any = {
      get: (k: string) => {
        if (k === 'root') return root.value;
        if (k === 'page') return { id: 'p1' };
        if (k === 'pageLength') return 2;
        if (k === 'node') return { id: 'btn' };
        if (k === 'nodes') return [{ id: 'btn' }];
        return undefined;
      },
      moveToContainer: vi.fn(),
      getNodeById: (id: string) => ({ id, items: [] }),
    };
    const m = useMoveToMenu({ editorService } as any);
    expect((m as any).items).toHaveLength(1);
    expect((m as any).items[0].text).toContain('P2');
    (m as any).items[0].handler({ editorService });
    // 移动至 目标页：直接走 moveToContainer 单次调用，整批只产生一条历史
    expect(editorService.moveToContainer).toHaveBeenCalledTimes(1);
    const callArgs = (editorService.moveToContainer as any).mock.calls[0];
    expect(Array.isArray(callArgs[0])).toBe(true);
    expect(callArgs[0][0].id).toBe('btn');
    expect(callArgs[1]).toBe('p2');
  });
});
