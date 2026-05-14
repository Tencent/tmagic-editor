/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';

import { defaultEditorProps } from '@editor/editorProps';

describe('defaultEditorProps', () => {
  test('提供 RenderType 与基础布尔默认值', () => {
    expect(defaultEditorProps.disabledMultiSelect).toBe(false);
    expect(defaultEditorProps.alwaysMultiSelect).toBe(false);
    expect(defaultEditorProps.disabledPageFragment).toBe(false);
    expect(defaultEditorProps.disabledStageOverlay).toBe(false);
    expect(defaultEditorProps.disabledShowSrc).toBe(false);
    expect(defaultEditorProps.disabledDataSource).toBe(false);
    expect(defaultEditorProps.disabledCodeBlock).toBe(false);
  });

  test('containerHighlight 默认值', () => {
    expect(defaultEditorProps.containerHighlightDuration).toBe(800);
    expect(typeof defaultEditorProps.containerHighlightClassName).toBe('string');
  });

  test('数组/对象工厂函数返回空值', () => {
    expect(defaultEditorProps.componentGroupList()).toEqual([]);
    expect(defaultEditorProps.datasourceList()).toEqual([]);
    expect(defaultEditorProps.layerContentMenu()).toEqual([]);
    expect(defaultEditorProps.stageContentMenu()).toEqual([]);
    expect(defaultEditorProps.menu()).toEqual({ left: [], right: [] });
    expect(defaultEditorProps.propsConfigs()).toEqual({});
    expect(defaultEditorProps.propsValues()).toEqual({});
    expect(defaultEditorProps.eventMethodList()).toEqual({});
    expect(defaultEditorProps.datasourceValues()).toEqual({});
    expect(defaultEditorProps.datasourceConfigs()).toEqual({});
    expect(defaultEditorProps.codeOptions()).toEqual({});
  });

  test('canSelect - 元素含 tmagic-id 且不是 page fragment 容器时可选中', () => {
    const div = document.createElement('div');
    div.dataset.tmagicId = 'a';
    expect(defaultEditorProps.canSelect(div)).toBe(true);
  });

  test('canSelect - 缺少 id 不可选中', () => {
    const div = document.createElement('div');
    expect(defaultEditorProps.canSelect(div)).toBe(false);
  });

  test('canSelect - 是 page fragment 容器不可选中', () => {
    const div = document.createElement('div');
    div.dataset.tmagicId = 'a';
    div.dataset.tmagicPageFragmentContainerId = 'p';
    expect(defaultEditorProps.canSelect(div)).toBe(false);
  });

  test('isContainer - magic-ui-container className', () => {
    const div = document.createElement('div');
    div.classList.add('magic-ui-container');
    expect(defaultEditorProps.isContainer(div)).toBe(true);
    const div2 = document.createElement('div');
    expect(defaultEditorProps.isContainer(div2)).toBe(false);
  });

  test('customContentMenu 直接返回原 menus', () => {
    const menus = [{ id: 'a' }] as any;
    expect(defaultEditorProps.customContentMenu(menus)).toBe(menus);
  });
});
