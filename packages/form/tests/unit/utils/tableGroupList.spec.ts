/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';

import { getGroupListHeaderVars, getGroupListRowConfig } from '@form/utils/tableGroupList';

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

describe('getGroupListHeaderVars', () => {
  test('未开 sticky 时不写样式', () => {
    expect(getGroupListHeaderVars(undefined)).toBeUndefined();
    expect(getGroupListHeaderVars({})).toBeUndefined();
    expect(getGroupListHeaderVars({ height: 48 })).toBeUndefined();
  });

  test('sticky 但 height 为空时不写变量，走样式默认值', () => {
    expect(getGroupListHeaderVars({ sticky: true })).toBeUndefined();
    expect(getGroupListHeaderVars({ sticky: true, height: '' })).toBeUndefined();
    expect(getGroupListHeaderVars({ sticky: true, height: '   ' })).toBeUndefined();
    expect(getGroupListHeaderVars({ sticky: true, height: Number.NaN })).toBeUndefined();
    expect(getGroupListHeaderVars({ sticky: true, height: Number.POSITIVE_INFINITY })).toBeUndefined();
  });

  test('数字 height 转成 px', () => {
    expect(getGroupListHeaderVars({ sticky: true, height: 48 })).toEqual({
      '--m-group-list-header-height': '48px',
    });
    expect(getGroupListHeaderVars({ sticky: true, height: 0 })).toEqual({
      '--m-group-list-header-height': '0px',
    });
  });

  // 无单位的值会让嵌套层的 calc() 整体失效、吸顶静默失灵
  test('无单位数字字符串补 px', () => {
    expect(getGroupListHeaderVars({ sticky: true, height: '48' })).toEqual({
      '--m-group-list-header-height': '48px',
    });
    expect(getGroupListHeaderVars({ sticky: true, height: ' 47.5 ' })).toEqual({
      '--m-group-list-header-height': '47.5px',
    });
  });

  test('带单位的字符串 height 原样写入', () => {
    expect(getGroupListHeaderVars({ sticky: true, height: '4em' })).toEqual({
      '--m-group-list-header-height': '4em',
    });
    expect(getGroupListHeaderVars({ sticky: true, height: 'var(--x)' })).toEqual({
      '--m-group-list-header-height': 'var(--x)',
    });
  });
});
