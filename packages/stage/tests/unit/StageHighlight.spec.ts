/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';

import { setIdToEl } from '@tmagic/core';

import StageHighlight from '../../src/StageHighlight';

vi.mock('moveable', () => ({
  default: class MockMoveable {
    public zoom = 0;
    public updateRect = vi.fn();
    public destroy = vi.fn();
    constructor(_container: HTMLElement, options: any) {
      if (options?.zoom !== undefined) this.zoom = options.zoom;
    }
  },
}));

afterEach(() => {
  globalThis.document.body.innerHTML = '';
  vi.clearAllMocks();
});

describe('StageHighlight', () => {
  const createInstance = () => {
    const container = globalThis.document.createElement('div');
    globalThis.document.body.appendChild(container);
    return new StageHighlight({
      container,
      getRootContainer: () => container,
    });
  };

  test('highlight 相同元素时不重复处理', () => {
    const highlight = createInstance();
    const el = globalThis.document.createElement('div');
    setIdToEl()(el, 'n1');
    el.style.cssText = 'position:absolute;width:10px;height:10px;left:0;top:0;';

    highlight.highlight(el);
    const { moveable } = highlight;
    highlight.highlight(el);
    expect(highlight.moveable).toBe(moveable);
    highlight.destroy();
  });

  test('highlight 创建 moveable 并更新 targetShadow', () => {
    const highlight = createInstance();
    const el = globalThis.document.createElement('div');
    setIdToEl()(el, 'n2');
    el.style.cssText = 'position:absolute;width:10px;height:10px;left:0;top:0;';

    highlight.highlight(el);
    expect(highlight.target).toBe(el);
    expect(highlight.moveable?.zoom).toBe(2);
    highlight.destroy();
  });

  test('clearHighlight 重置 zoom 并清空 target', () => {
    const highlight = createInstance();
    const el = globalThis.document.createElement('div');
    setIdToEl()(el, 'n3');
    el.style.cssText = 'position:absolute;width:10px;height:10px;left:0;top:0;';

    highlight.highlight(el);
    highlight.clearHighlight();
    expect(highlight.moveable?.zoom).toBe(0);
    expect(highlight.target).toBeUndefined();
    highlight.destroy();
  });

  test('clearHighlight 在无 target 时不抛错', () => {
    const highlight = createInstance();
    expect(() => highlight.clearHighlight()).not.toThrow();
    highlight.destroy();
  });

  test('destroy 清理 moveable 与 targetShadow', () => {
    const highlight = createInstance();
    const el = globalThis.document.createElement('div');
    setIdToEl()(el, 'n4');
    el.style.cssText = 'position:absolute;width:10px;height:10px;left:0;top:0;';
    highlight.highlight(el);
    highlight.destroy();
    expect(highlight.moveable).toBeUndefined();
    expect(highlight.targetShadow).toBeUndefined();
  });
});
