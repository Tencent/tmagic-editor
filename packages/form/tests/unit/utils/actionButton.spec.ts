/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';

import { actionButtonText, DEFAULT_ACTION_BUTTON_TEXT, resolveCustomActionButtons } from '@form/utils/actionButton';

describe('actionButtonText', () => {
  test('未配置时返回内置文案', () => {
    expect(actionButtonText(undefined, 'operate')).toBe(DEFAULT_ACTION_BUTTON_TEXT.operate);
    expect(actionButtonText({}, 'delete')).toBe('删除');
  });

  test('text 覆盖内置文案，空字符串回退', () => {
    expect(actionButtonText({ text: '克隆' }, 'copy')).toBe('克隆');
    expect(actionButtonText({ text: '' }, 'moveUp')).toBe('上移');
    expect(actionButtonText({ text: '前移' }, 'moveDown')).toBe('前移');
  });
});

describe('resolveCustomActionButtons', () => {
  const ctx = { model: { a: 1 }, index: 0, groupModel: [{ a: 1 }], config: {}, formValue: {} };

  test('未配置返回空数组', () => {
    expect(resolveCustomActionButtons(undefined, undefined, ctx)).toEqual([]);
  });

  test('display 为 false 或函数返回 false 时过滤', () => {
    const handler = vi.fn();
    const display = vi.fn(() => false);
    const result = resolveCustomActionButtons(
      undefined,
      [{ handler }, { handler, display: false }, { handler, display }, { handler, display: true }],
      ctx,
    );
    expect(result).toHaveLength(2);
    expect(display).toHaveBeenCalledWith(undefined, ctx);
  });

  test('disabled 支持静态值、函数与表单禁用', () => {
    const handler = vi.fn();
    const [a, b, c] = resolveCustomActionButtons(
      undefined,
      [{ handler }, { handler, disabled: () => true }, { handler, disabled: false }],
      ctx,
    );
    expect([a.disabled, b.disabled, c.disabled]).toEqual([false, true, false]);

    const [d] = resolveCustomActionButtons(undefined, [{ handler }], ctx, true);
    expect(d.disabled).toBe(true);
  });

  test('onClick 调用 handler 并传入上下文', () => {
    const handler = vi.fn();
    const [item] = resolveCustomActionButtons(undefined, [{ handler }], ctx);
    item.onClick();
    expect(handler).toHaveBeenCalledWith(undefined, ctx);
  });
});
