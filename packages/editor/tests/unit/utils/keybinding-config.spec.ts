/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';

import keybindingConfig, { KeyBindingContainerKey } from '@editor/utils/keybinding-config';

describe('keybinding-config', () => {
  test('每条配置都包含 command/keybinding/when', () => {
    expect(Array.isArray(keybindingConfig)).toBe(true);
    keybindingConfig.forEach((item) => {
      expect(item.command).toBeDefined();
      expect(item.keybinding).toBeDefined();
      expect(Array.isArray(item.when)).toBe(true);
    });
  });

  test('KeyBindingContainerKey 枚举', () => {
    expect(KeyBindingContainerKey.STAGE).toBe('stage');
    expect(KeyBindingContainerKey.LAYER_PANEL).toBe('layer-panel');
  });
});
