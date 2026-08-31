/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';

import { getGroupListRowConfig } from '@form/utils/tableGroupList';

describe('getGroupListRowConfig', () => {
  test('把 group-list 的 labelWidth / labelPosition 复制到 row 配置', () => {
    const row = getGroupListRowConfig(
      {
        type: 'group-list',
        name: 'list',
        labelWidth: '80px',
        labelPosition: 'left',
        items: [{ name: 'text', type: 'text', text: 'text' }],
      } as any,
      0,
    );

    expect(row.type).toBe('row');
    expect(row.labelWidth).toBe('80px');
    expect(row.labelPosition).toBe('left');
    expect(row.items).toHaveLength(1);
  });
});
