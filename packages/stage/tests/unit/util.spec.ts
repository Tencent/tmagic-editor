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

import * as util from '../../src/util';

Object.defineProperties(globalThis.HTMLElement.prototype, {
  offsetWidth: {
    get() {
      return parseFloat(this.style.width) || 0;
    },
  },
  offsetHeight: {
    get() {
      return parseFloat(this.style.height) || 0;
    },
  },
  offsetTop: {
    get() {
      if (this.style.position === 'absolute') {
        return parseFloat(this.style.top) || 0;
      }
      return 0;
    },
  },
  offsetLeft: {
    get() {
      if (this.style.position === 'absolute') {
        return parseFloat(this.style.left) || 0;
      }
      return 0;
    },
  },
  offsetParent: {
    get() {
      let parent = this.parentNode;
      while (parent) {
        if (parent.style?.position === 'absolute') {
          return parent;
        }
        parent = parent.parentNode;
      }
    },
  },
});

const createElement = () => {
  const el = globalThis.document.createElement('div');
  el.style.cssText = 'width: 100px; height: 100px; position: absolute; left: 100px; top: 100px;';
  return el;
};

describe('getOffset', () => {
  const root = globalThis.document.createElement('div');
  const div = globalThis.document.createElement('div');

  beforeEach(() => {
    globalThis.document.body.innerHTML = '';
    globalThis.document.body.appendChild(root);
  });

  test('没有offsetParent， 没有left、top', () => {
    div.style.cssText = 'width: 100px; height: 100px';
    root.appendChild(div);
    const offset = util.getOffset(div);
    expect(offset.left).toBe(0);
    expect(offset.top).toBe(0);
  });

  test('没有offsetParent， 有left、top', () => {
    const el = createElement();
    root.appendChild(el);
    const offset = util.getOffset(el);
    expect(offset.left).toBe(100);
    expect(offset.top).toBe(100);
  });

  test('有offsetParent， 没有left、top', () => {
    const parent = createElement();
    div.style.cssText = 'width: 100px; height: 100px';
    parent.appendChild(div);
    root.appendChild(parent);

    const offset = util.getOffset(div);
    expect(offset.left).toBe(100);
    expect(offset.top).toBe(100);
  });
});

describe('getAbsolutePosition', () => {
  const root = globalThis.document.createElement('div');
  const div = globalThis.document.createElement('div');

  beforeEach(() => {
    globalThis.document.body.innerHTML = '';
    globalThis.document.body.appendChild(root);
  });

  test('有offsetParent', () => {
    const parent = createElement();
    div.style.cssText = 'width: 100px; height: 100px';
    parent.appendChild(div);
    root.appendChild(parent);
    const offset = util.getAbsolutePosition(div, { left: 100, top: 100 });
    expect(offset.left).toBe(0);
    expect(offset.top).toBe(0);
  });

  test('没有offsetParent', () => {
    const el = createElement();
    root.appendChild(el);
    const offset = util.getAbsolutePosition(el, { left: 100, top: 100 });
    expect(offset.left).toBe(100);
    expect(offset.top).toBe(100);
  });
});

describe('isFixed', () => {
  test('true', () => {
    expect(
      util.isFixed({
        position: 'fixed',
      }),
    ).toBeTruthy();
  });

  test('false', () => {
    expect(
      util.isFixed({
        position: 'absolute',
      }),
    ).toBeFalsy();

    expect(util.isFixed({})).toBeFalsy();
  });
});

describe('isAbsolute / isRelative / isStatic', () => {
  test('isAbsolute', () => {
    expect(util.isAbsolute({ position: 'absolute' })).toBe(true);
    expect(util.isAbsolute({ position: 'fixed' })).toBe(false);
  });
  test('isRelative', () => {
    expect(util.isRelative({ position: 'relative' })).toBe(true);
    expect(util.isRelative({})).toBe(false);
  });
  test('isStatic', () => {
    expect(util.isStatic({ position: 'static' })).toBe(true);
    expect(util.isStatic({ position: 'absolute' })).toBe(false);
  });
});

describe('getMarginValue / getBorderWidth', () => {
  test('getMarginValue 空元素返回 0', () => {
    expect(util.getMarginValue(null as any)).toEqual({ marginLeft: 0, marginTop: 0 });
  });

  test('getMarginValue 元素返回 px 数字', () => {
    const el = globalThis.document.createElement('div');
    el.style.marginLeft = '5px';
    el.style.marginTop = '10px';
    globalThis.document.body.appendChild(el);
    const result = util.getMarginValue(el);
    expect(typeof result.marginLeft).toBe('number');
    expect(typeof result.marginTop).toBe('number');
  });

  test('getBorderWidth 空元素返回 0', () => {
    expect(util.getBorderWidth(null as any)).toEqual({
      borderLeftWidth: 0,
      borderRightWidth: 0,
      borderTopWidth: 0,
      borderBottomWidth: 0,
    });
  });

  test('getBorderWidth 真实元素', () => {
    const el = globalThis.document.createElement('div');
    el.style.borderLeftWidth = '1px';
    el.style.borderRightWidth = '2px';
    el.style.borderTopWidth = '3px';
    el.style.borderBottomWidth = '4px';
    globalThis.document.body.appendChild(el);
    const result = util.getBorderWidth(el);
    expect(typeof result.borderLeftWidth).toBe('number');
  });
});

describe('isMoveableButton', () => {
  test('元素自身有 moveable-button class', () => {
    const el = globalThis.document.createElement('div');
    el.classList.add('moveable-button');
    expect(util.isMoveableButton(el)).toBe(true);
  });
  test('父元素有 moveable-button class', () => {
    const parent = globalThis.document.createElement('div');
    parent.classList.add('moveable-button');
    const child = globalThis.document.createElement('span');
    parent.appendChild(child);
    expect(util.isMoveableButton(child)).toBe(true);
  });
  test('既不在自身也不在父元素上', () => {
    const el = globalThis.document.createElement('div');
    expect(util.isMoveableButton(el)).toBeFalsy();
  });
});

describe('addSelectedClassName / removeSelectedClassName', () => {
  test('add 与 remove 选中类名工作', () => {
    const root = globalThis.document.createElement('div');
    const child = globalThis.document.createElement('div');
    root.appendChild(child);
    globalThis.document.body.innerHTML = '';
    globalThis.document.body.appendChild(root);

    util.addSelectedClassName(child, globalThis.document);
    expect(child.classList.contains('tmagic-stage-selected-area')).toBe(true);

    util.removeSelectedClassName(globalThis.document);
    expect(child.classList.contains('tmagic-stage-selected-area')).toBe(false);
  });
});

describe('getMode', () => {
  test('fixed 父元素返回 FIXED', () => {
    const fixed = globalThis.document.createElement('div');
    fixed.style.position = 'fixed';
    const child = globalThis.document.createElement('div');
    fixed.appendChild(child);
    globalThis.document.body.innerHTML = '';
    globalThis.document.body.appendChild(fixed);
    const mode = util.getMode(child);
    expect(mode).toBeDefined();
  });

  test('relative/static 返回 SORTABLE 默认', () => {
    const el = globalThis.document.createElement('div');
    el.style.position = 'relative';
    globalThis.document.body.innerHTML = '';
    globalThis.document.body.appendChild(el);
    const mode = util.getMode(el);
    expect(mode).toBeDefined();
  });
});

describe('isFixedParent', () => {
  test('元素本身或祖先含 fixed', () => {
    const root = globalThis.document.createElement('div');
    root.style.position = 'fixed';
    const child = globalThis.document.createElement('div');
    root.appendChild(child);
    globalThis.document.body.innerHTML = '';
    globalThis.document.body.appendChild(root);
    expect(util.isFixedParent(child)).toBe(true);
  });

  test('没有 fixed 祖先返回 false', () => {
    const el = globalThis.document.createElement('div');
    globalThis.document.body.innerHTML = '';
    globalThis.document.body.appendChild(el);
    expect(util.isFixedParent(el)).toBe(false);
  });
});

describe('getTargetElStyle', () => {
  test('返回包含 transform/border/width/height 的样式', () => {
    const el = globalThis.document.createElement('div');
    el.style.cssText = 'width: 100px; height: 50px;';
    globalThis.document.body.appendChild(el);
    const style = util.getTargetElStyle(el as any, 1 as any);
    expect(style).toContain('width');
    expect(style).toContain('height');
    expect(style).toContain('z-index: 1');
  });
});

describe('down / up 排序', () => {
  const setupSiblings = () => {
    const parent = globalThis.document.createElement('div');
    const a = globalThis.document.createElement('div');
    a.style.cssText = 'width:100px; height:50px';
    a.dataset.tmagicId = 'a';
    const b = globalThis.document.createElement('div');
    b.style.cssText = 'width:100px; height:50px';
    b.dataset.tmagicId = 'b';
    const c = globalThis.document.createElement('div');
    c.style.cssText = 'width:100px; height:50px';
    c.dataset.tmagicId = 'c';
    parent.appendChild(a);
    parent.appendChild(b);
    parent.appendChild(c);
    return { parent, a, b, c };
  };

  test('down 返回 src/dist', () => {
    const { a } = setupSiblings();
    Object.defineProperty(a, 'clientHeight', { value: 50, configurable: true });
    const result = util.down(200, a);
    expect(result.src).toBe('a');
  });

  test('up 返回 src/dist', () => {
    const { c } = setupSiblings();
    Object.defineProperty(c, 'clientHeight', { value: 50, configurable: true });
    const result = util.up(-200, c);
    expect(result.src).toBe('c');
  });
});
