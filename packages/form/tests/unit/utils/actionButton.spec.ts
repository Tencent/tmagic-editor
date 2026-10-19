/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';

import { actionButtonText, DEFAULT_ACTION_BUTTON_TEXT } from '@form/utils/actionButton';

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
