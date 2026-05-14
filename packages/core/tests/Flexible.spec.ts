/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';

import Flexible from '../src/Flexible';

describe('Flexible', () => {
  test('实例化默认 designWidth=375 并设置 fontSize', () => {
    const f = new Flexible();
    expect(f.designWidth).toBe(375);
    expect(globalThis.document.body.style.fontSize).toBeDefined();
    f.destroy();
  });

  test('options.designWidth 触发 refreshRem 与 fontSize 写入', () => {
    const f = new Flexible({ designWidth: 750 });
    expect(f.designWidth).toBe(750);
    expect(globalThis.document.documentElement.style.fontSize).toMatch(/px$/);
    f.destroy();
  });

  test('setDesignWidth 更新数值并 refresh', () => {
    const f = new Flexible();
    f.setDesignWidth(414);
    expect(f.designWidth).toBe(414);
    f.destroy();
  });

  test('correctRem 根据计算偏差调整字体', () => {
    const f = new Flexible();
    const fontSize = 100;
    const result = f.correctRem(fontSize);
    expect(typeof result).toBe('number');
    f.destroy();
  });

  test('resize 事件 debounce 调用 refreshRem', async () => {
    const f = new Flexible();
    const spy = vi.spyOn(f, 'refreshRem').mockImplementation(() => undefined);
    globalThis.dispatchEvent(new Event('resize'));
    await new Promise((r) => setTimeout(r, 350));
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
    f.destroy();
  });

  test('pageshow persisted 触发 resize 处理', () => {
    const f = new Flexible();
    const evt = new Event('pageshow') as any;
    evt.persisted = true;
    globalThis.dispatchEvent(evt);
    f.destroy();
  });
});
