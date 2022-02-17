/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
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
        if (parent.style && parent.style.position === 'absolute') {
          return parent;
        }
        parent = parent.parentNode;
      }
    },
  },
});

const createElement = () => {
  const el = globalThis.document.createElement('div');
  el.style.cssText = `width: 100px; height: 100px; position: absolute; left: 100px; top: 100px;`;
  return el;
};

describe('getOffset', () => {
  /**
   * @jest-environment jsdom
   */
  const root = globalThis.document.createElement('div');
  const div = globalThis.document.createElement('div');

  beforeEach(() => {
    globalThis.document.body.innerHTML = '';
    globalThis.document.body.appendChild(root);
  });

  it('没有offsetParent， 没有left、top', () => {
    div.style.cssText = `width: 100px; height: 100px`;
    root.appendChild(div);
    const offset = util.getOffset(div);
    expect(offset.left).toBe(0);
    expect(offset.top).toBe(0);
  });

  it('没有offsetParent， 有left、top', () => {
    const el = createElement();
    root.appendChild(el);
    const offset = util.getOffset(el);
    expect(offset.left).toBe(100);
    expect(offset.top).toBe(100);
  });

  it('有offsetParent， 没有left、top', () => {
    const parent = createElement();
    div.style.cssText = `width: 100px; height: 100px`;
    parent.appendChild(div);
    root.appendChild(parent);

    const offset = util.getOffset(div);
    expect(offset.left).toBe(100);
    expect(offset.top).toBe(100);
  });
});

describe('getAbsolutePosition', () => {
  /**
   * @jest-environment jsdom
   */
  const root = globalThis.document.createElement('div');
  const div = globalThis.document.createElement('div');

  beforeEach(() => {
    globalThis.document.body.innerHTML = '';
    globalThis.document.body.appendChild(root);
  });

  it('有offsetParent', () => {
    const parent = createElement();
    div.style.cssText = `width: 100px; height: 100px`;
    parent.appendChild(div);
    root.appendChild(parent);
    const offset = util.getAbsolutePosition(div, { left: 100, top: 100 });
    expect(offset.left).toBe(0);
    expect(offset.top).toBe(0);
  });

  it('没有offsetParent', () => {
    const el = createElement();
    root.appendChild(el);
    const offset = util.getAbsolutePosition(el, { left: 100, top: 100 });
    expect(offset.left).toBe(100);
    expect(offset.top).toBe(100);
  });
});

describe('getHost', () => {
  it('正常', () => {
    const host = util.getHost('https://film.qq.com/index.html');
    expect(host).toBe('film.qq.com');
  });
});

describe('isSameDomain', () => {
  it('正常', () => {
    const flag = util.isSameDomain('https://film.qq.com/index.html', 'film.qq.com');
    expect(flag).toBeTruthy();
  });

  it('不正常', () => {
    const flag = util.isSameDomain('https://film.qq.com/index.html', 'test.film.qq.com');
    expect(flag).toBeFalsy();
  });

  it('不是http', () => {
    const flag = util.isSameDomain('ftp://film.qq.com/index.html', 'test.film.qq.com');
    expect(flag).toBeTruthy();
  });
});
