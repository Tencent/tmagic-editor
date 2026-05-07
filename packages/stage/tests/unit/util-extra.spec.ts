/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { beforeEach, describe, expect, test } from 'vitest';

import {
  AbleActionEventType,
  CONTAINER_HIGHLIGHT_CLASS_NAME,
  ContainerHighlightType,
  DEFAULT_ZOOM,
  DRAG_EL_ID_PREFIX,
  GHOST_EL_ID_PREFIX,
  GuidesType,
  HIGHLIGHT_EL_ID_PREFIX,
  Mode,
  MouseButton,
  PAGE_CLASS,
  RenderType,
  SELECTED_CLASS,
  SelectStatus,
  StageDragStatus,
  ZIndex,
} from '../../src/const';
import {
  addSelectedClassName,
  getBorderWidth,
  getMarginValue,
  getTargetElStyle,
  isAbsolute,
  isMoveableButton,
  isRelative,
  isStatic,
  removeSelectedClassName,
} from '../../src/util';

describe('const 常量', () => {
  test('字符串常量', () => {
    expect(GHOST_EL_ID_PREFIX).toBe('ghost_el_');
    expect(DRAG_EL_ID_PREFIX).toBe('drag_el_');
    expect(HIGHLIGHT_EL_ID_PREFIX).toBe('highlight_el_');
    expect(CONTAINER_HIGHLIGHT_CLASS_NAME).toBe('tmagic-stage-container-highlight');
    expect(PAGE_CLASS).toBe('magic-ui-page');
    expect(SELECTED_CLASS).toBe('tmagic-stage-selected-area');
    expect(DEFAULT_ZOOM).toBe(1);
  });

  test('GuidesType 枚举', () => {
    expect(GuidesType.HORIZONTAL).toBe('horizontal');
    expect(GuidesType.VERTICAL).toBe('vertical');
  });

  test('ZIndex 枚举', () => {
    expect(ZIndex.MASK).toBe('99999');
    expect(ZIndex.SELECTED_EL).toBe('666');
    expect(ZIndex.GHOST_EL).toBe('700');
    expect(ZIndex.DRAG_EL).toBe('9');
    expect(ZIndex.HIGHLIGHT_EL).toBe('8');
  });

  test('MouseButton 枚举', () => {
    expect(MouseButton.LEFT).toBe(0);
    expect(MouseButton.MIDDLE).toBe(1);
    expect(MouseButton.RIGHT).toBe(2);
  });

  test('Mode 枚举', () => {
    expect(Mode.ABSOLUTE).toBe('absolute');
    expect(Mode.FIXED).toBe('fixed');
    expect(Mode.SORTABLE).toBe('sortable');
  });

  test('其他枚举', () => {
    expect(AbleActionEventType.SELECT_PARENT).toBe('select-parent');
    expect(AbleActionEventType.REMOVE).toBe('remove');
    expect(AbleActionEventType.RERENDER).toBe('rerender');
    expect(ContainerHighlightType.DEFAULT).toBe('default');
    expect(ContainerHighlightType.ALT).toBe('alt');
    expect(RenderType.IFRAME).toBe('iframe');
    expect(RenderType.NATIVE).toBe('native');
    expect(SelectStatus.SELECT).toBe('select');
    expect(SelectStatus.MULTI_SELECT).toBe('multiSelect');
    expect(StageDragStatus.START).toBe('start');
    expect(StageDragStatus.ING).toBe('ing');
    expect(StageDragStatus.END).toBe('end');
  });
});

describe('isAbsolute / isRelative / isStatic', () => {
  test('isAbsolute', () => {
    expect(isAbsolute({ position: 'absolute' })).toBe(true);
    expect(isAbsolute({ position: 'relative' })).toBe(false);
    expect(isAbsolute({})).toBe(false);
  });

  test('isRelative', () => {
    expect(isRelative({ position: 'relative' })).toBe(true);
    expect(isRelative({ position: 'absolute' })).toBe(false);
    expect(isRelative({})).toBe(false);
  });

  test('isStatic', () => {
    expect(isStatic({ position: 'static' })).toBe(true);
    expect(isStatic({ position: 'fixed' })).toBe(false);
    expect(isStatic({})).toBe(false);
  });
});

describe('isMoveableButton', () => {
  let doc: Document;

  beforeEach(() => {
    doc = globalThis.document;
    doc.body.innerHTML = '';
  });

  test('元素自身带 moveable-button class', () => {
    const el = doc.createElement('div');
    el.classList.add('moveable-button');
    expect(isMoveableButton(el)).toBe(true);
  });

  test('父元素带 moveable-button class', () => {
    const parent = doc.createElement('div');
    parent.classList.add('moveable-button');
    const child = doc.createElement('div');
    parent.appendChild(child);
    expect(isMoveableButton(child)).toBe(true);
  });

  test('都不带时为 falsy', () => {
    const el = doc.createElement('div');
    expect(isMoveableButton(el)).toBeFalsy();
  });
});

describe('getMarginValue / getBorderWidth', () => {
  let doc: Document;

  beforeEach(() => {
    doc = globalThis.document;
    doc.body.innerHTML = '';
  });

  test('null 元素返回全 0', () => {
    expect(getMarginValue(null as unknown as Element)).toEqual({
      marginLeft: 0,
      marginTop: 0,
    });
    expect(getBorderWidth(null as unknown as Element)).toEqual({
      borderLeftWidth: 0,
      borderRightWidth: 0,
      borderTopWidth: 0,
      borderBottomWidth: 0,
    });
  });

  test('正常元素返回数字（jsdom 默认 0）', () => {
    const el = doc.createElement('div');
    doc.body.appendChild(el);
    const m = getMarginValue(el);
    expect(typeof m.marginLeft).toBe('number');
    expect(typeof m.marginTop).toBe('number');

    const b = getBorderWidth(el);
    expect(typeof b.borderLeftWidth).toBe('number');
    expect(typeof b.borderRightWidth).toBe('number');
    expect(typeof b.borderTopWidth).toBe('number');
    expect(typeof b.borderBottomWidth).toBe('number');
  });
});

describe('selected class 操作', () => {
  let doc: Document;

  beforeEach(() => {
    doc = globalThis.document;
    doc.body.innerHTML = '';
  });

  test('addSelectedClassName 给目标添加 selected, 父级添加 -parent, 祖先添加 -parents', () => {
    const grand = doc.createElement('div');
    const parent = doc.createElement('div');
    const child = doc.createElement('div');
    grand.appendChild(parent);
    parent.appendChild(child);
    doc.body.appendChild(grand);

    addSelectedClassName(child, doc);
    expect(child.classList.contains(SELECTED_CLASS)).toBe(true);
    expect(parent.classList.contains(`${SELECTED_CLASS}-parent`)).toBe(true);
    expect(grand.classList.contains(`${SELECTED_CLASS}-parents`)).toBe(true);
  });

  test('removeSelectedClassName 清除所有相关 class', () => {
    const grand = doc.createElement('div');
    const parent = doc.createElement('div');
    const child = doc.createElement('div');
    grand.appendChild(parent);
    parent.appendChild(child);
    doc.body.appendChild(grand);

    addSelectedClassName(child, doc);
    removeSelectedClassName(doc);
    expect(child.classList.contains(SELECTED_CLASS)).toBe(false);
    expect(parent.classList.contains(`${SELECTED_CLASS}-parent`)).toBe(false);
    expect(grand.classList.contains(`${SELECTED_CLASS}-parents`)).toBe(false);
  });

  test('removeSelectedClassName 在没有选中元素时不抛错', () => {
    expect(() => removeSelectedClassName(doc)).not.toThrow();
  });
});

describe('getTargetElStyle', () => {
  let doc: Document;

  beforeEach(() => {
    doc = globalThis.document;
    doc.body.innerHTML = '';
  });

  test('返回包含元素尺寸的样式字符串', () => {
    const el = doc.createElement('div');
    Object.defineProperty(el, 'clientWidth', { value: 100 });
    Object.defineProperty(el, 'clientHeight', { value: 50 });
    doc.body.appendChild(el);
    const style = getTargetElStyle(el as any);
    expect(style).toContain('width: 100px');
    expect(style).toContain('height: 50px');
    expect(style).toContain('position: absolute');
  });

  test('传入 zIndex 时包含 z-index 声明', () => {
    const el = doc.createElement('div');
    doc.body.appendChild(el);
    const style = getTargetElStyle(el as any, ZIndex.DRAG_EL);
    expect(style).toContain(`z-index: ${ZIndex.DRAG_EL}`);
  });
});
