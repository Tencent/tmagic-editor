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
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import StageFlashHighlight, { FLASH_TIP_CLASS_NAME } from '../../src/StageFlashHighlight';

const createInstance = () => {
  const container = globalThis.document.createElement('div');
  globalThis.document.body.appendChild(container);
  const flash = new StageFlashHighlight({ container });
  return { container, flash };
};

const createTarget = () => {
  const el = globalThis.document.createElement('div');
  globalThis.document.body.appendChild(el);
  return el;
};

const getFlashEls = (container: HTMLElement) => container.querySelectorAll(`.${FLASH_TIP_CLASS_NAME}`);

const getStyleEls = () => globalThis.document.head.querySelectorAll('style');

describe('StageFlashHighlight', () => {
  let instance: StageFlashHighlight | null = null;

  beforeEach(() => {
    globalThis.document.body.innerHTML = '';
    globalThis.document.head.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    instance?.destroy();
    instance = null;
    vi.useRealTimers();
  });

  test('flash 会在容器内创建一个闪烁提示节点', () => {
    const { container, flash } = createInstance();
    instance = flash;

    flash.flash(createTarget());

    const els = getFlashEls(container);
    expect(els).toHaveLength(1);

    const flashEl = els[0] as HTMLElement;
    expect(flashEl.style.position).toBe('absolute');
    expect(flashEl.style.pointerEvents).toBe('none');
  });

  test('flash 会注入动画样式，且多次调用只注入一次', () => {
    const { flash } = createInstance();
    instance = flash;

    expect(getStyleEls()).toHaveLength(0);

    flash.flash(createTarget());
    expect(getStyleEls()).toHaveLength(1);
    expect(getStyleEls()[0].innerHTML).toContain('@keyframes');

    flash.flash(createTarget());
    expect(getStyleEls()).toHaveLength(1);
  });

  test('重复 flash 时始终只保留一个闪烁节点', () => {
    const { container, flash } = createInstance();
    instance = flash;

    flash.flash(createTarget());
    flash.flash(createTarget());
    flash.flash(createTarget());

    expect(getFlashEls(container)).toHaveLength(1);
  });

  test('动画结束后自动移除闪烁节点', () => {
    const { container, flash } = createInstance();
    instance = flash;

    flash.flash(createTarget());
    expect(getFlashEls(container)).toHaveLength(1);

    // 时长内仍然存在
    vi.advanceTimersByTime(100);
    expect(getFlashEls(container)).toHaveLength(1);

    // 超过动画时长后被移除
    vi.advanceTimersByTime(5000);
    expect(getFlashEls(container)).toHaveLength(0);
  });

  test('clear 会立即移除闪烁节点并清除定时器', () => {
    const { container, flash } = createInstance();
    instance = flash;

    flash.flash(createTarget());
    flash.clear();

    expect(getFlashEls(container)).toHaveLength(0);

    // clear 后不应再有残留的定时回调影响后续逻辑
    flash.flash(createTarget());
    vi.advanceTimersByTime(100);
    expect(getFlashEls(container)).toHaveLength(1);
  });

  test('falsy 元素不会创建节点也不会注入样式', () => {
    const { container, flash } = createInstance();
    instance = flash;

    flash.flash(null as unknown as HTMLElement);

    expect(getFlashEls(container)).toHaveLength(0);
    expect(getStyleEls()).toHaveLength(0);
  });

  test('destroy 会移除闪烁节点与注入的样式', () => {
    const { container, flash } = createInstance();

    flash.flash(createTarget());
    expect(getFlashEls(container)).toHaveLength(1);
    expect(getStyleEls()).toHaveLength(1);

    flash.destroy();

    expect(getFlashEls(container)).toHaveLength(0);
    expect(getStyleEls()).toHaveLength(0);
  });
});
