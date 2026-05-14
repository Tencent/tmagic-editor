/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';

import getMonaco from '@editor/utils/monaco-editor';

vi.mock('emmet-monaco-es', () => ({
  emmetHTML: vi.fn(),
  emmetCSS: vi.fn(),
}));

vi.mock('monaco-editor', () => ({
  default: { editor: {}, languages: {} },
  editor: {},
  languages: {},
}));

describe('monaco-editor 加载器', () => {
  test('返回 Promise，且会缓存复用同一个实例', async () => {
    const p1 = getMonaco();
    const p2 = getMonaco();
    expect(p1).toBe(p2);
    const monaco = await p1;
    const emmet = await import('emmet-monaco-es');
    expect(emmet.emmetHTML).toHaveBeenCalledWith(monaco);
    expect(emmet.emmetCSS).toHaveBeenCalledWith(monaco, ['css', 'scss']);
  });
});
