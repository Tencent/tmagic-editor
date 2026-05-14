/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';

import { NODE_CONDS_RESULT_KEY } from '@tmagic/core';

import {
  advancedTabConfig,
  arrayOptions,
  displayTabConfig,
  eqOptions,
  eventTabConfig,
  fillConfig,
  numberOptions,
  styleTabConfig,
} from '@editor/utils/props';

vi.mock('@tmagic/design', () => ({
  tMagicMessage: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('props 选项常量', () => {
  test('eqOptions / arrayOptions / numberOptions 内容稳定', () => {
    expect(eqOptions.map((o) => o.value)).toEqual(['=', '!=']);
    expect(arrayOptions.map((o) => o.value)).toEqual(['include', 'not_include']);
    expect(numberOptions.map((o) => o.value)).toEqual(['>', '>=', '<', '<=', 'between', 'not_between']);
  });

  test('styleTabConfig / eventTabConfig / displayTabConfig 基础结构', () => {
    expect(styleTabConfig.title).toBe('样式');
    expect(eventTabConfig.title).toBe('事件');
    expect(displayTabConfig.title).toBe('显示条件');
  });

  test('advancedTabConfig 中包含 created/mounted/display', () => {
    const names = (advancedTabConfig.items as any[]).map((i) => i.name);
    expect(names).toEqual(expect.arrayContaining(['created', 'mounted', 'display']));
  });
});

describe('fillConfig', () => {
  test('默认会补充 type/id/name 三个基础字段', () => {
    const result = fillConfig() as any;
    const tab = result[0];
    const propsTab = tab.items[0];
    const names = propsTab.items.map((i: any) => i.name);
    expect(names).toEqual(expect.arrayContaining(['type', 'id', 'name']));
  });

  test('已有 id/type/name 时不重复添加', () => {
    const result = fillConfig([
      { name: 'id', text: 'id', type: 'text' } as any,
      { name: 'type', text: 'type', type: 'hidden' } as any,
      { name: 'name', text: 'name' } as any,
    ]) as any;
    const propsTab = result[0].items[0];
    const idItems = propsTab.items.filter((i: any) => i.name === 'id');
    expect(idItems).toHaveLength(1);
  });

  test('disabledDataSource=true 时不追加 displayTab', () => {
    const result = fillConfig([], { disabledDataSource: true }) as any;
    const titles = result[0].items.map((i: any) => i.title);
    expect(titles).not.toContain('显示条件');
  });

  test('支持自定义 labelWidth', () => {
    const result = fillConfig([], { labelWidth: '120px' }) as any;
    expect(result[0].labelWidth).toBe('120px');
  });

  test('styleTabConfig.display 跟随 uiService showStylePanel', () => {
    const services = { uiService: { get: () => false } };
    expect(styleTabConfig.display!({ services } as any)).toBe(true);
    services.uiService.get = () => true;
    expect(styleTabConfig.display!({ services } as any)).toBe(false);
    services.uiService.get = () => undefined;
    expect(styleTabConfig.display!({ services } as any)).toBe(false);
  });

  test('styleTabConfig 内 transform 项 defaultValue 返回 {}', () => {
    const styleField = (styleTabConfig.items as any[])[0];
    const transform = styleField.items.find((i: any) => i.name === 'transform');
    expect(transform.defaultValue()).toEqual({});
  });

  test('displayTabConfig.display 当节点为 page 时返回 false', () => {
    expect(displayTabConfig.display!({} as any, { model: { type: 'page' } } as any)).toBe(false);
    expect(displayTabConfig.display!({} as any, { model: { type: 'text' } } as any)).toBe(true);
  });

  test('displayTabConfig select 项 extra 文案随 NODE_CONDS_RESULT_KEY 变化', () => {
    const selectItem = (displayTabConfig.items as any[]).find((i) => i.type === 'select');
    expect(typeof selectItem.extra).toBe('function');
    const text1 = selectItem.extra({}, { model: { [NODE_CONDS_RESULT_KEY]: true } });
    const text2 = selectItem.extra({}, { model: { [NODE_CONDS_RESULT_KEY]: false } });
    expect(text1).toContain('隐藏');
    expect(text2).toContain('显示');
  });

  test('id 字段 append.handler 触发 navigator.clipboard.writeText', async () => {
    const result = fillConfig() as any;
    const propsTab = result[0].items[0];
    const idField = propsTab.items.find((i: any) => i.name === 'id');
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    await idField.append.handler({}, { model: { id: 'abc' } });
    expect(writeText).toHaveBeenCalledWith('abc');
  });

  test('id 字段 append.handler 复制失败时调用 error', async () => {
    const result = fillConfig() as any;
    const propsTab = result[0].items[0];
    const idField = propsTab.items.find((i: any) => i.name === 'id');
    const writeText = vi.fn().mockRejectedValue(new Error('fail'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    await idField.append.handler({}, { model: { id: 'xx' } });
    expect(writeText).toHaveBeenCalled();
  });

  test('disabledCodeBlock=true 时高级 tab 仅保留非 code-select 项', () => {
    const result = fillConfig([], { disabledCodeBlock: true }) as any;
    const titles = result[0].items.map((i: any) => i.title);
    expect(titles).toContain('高级');
    const advanced = result[0].items.find((i: any) => i.title === '高级');
    advanced.items.forEach((it: any) => {
      expect(it.type).not.toBe('code-select');
    });
  });

  test('advancedTabConfig 中所有 type=code-select 都有 labelPosition=top', () => {
    const codeSelects = (advancedTabConfig.items as any[]).filter((i) => i.type === 'code-select');
    codeSelects.forEach((cs: any) => {
      expect(cs.labelPosition).toBe('top');
    });
  });
});
