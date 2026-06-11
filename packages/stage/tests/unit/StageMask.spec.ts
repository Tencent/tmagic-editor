/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { Mode } from '../../src/const';
import StageMask from '../../src/StageMask';

const makeResizeEntry = (target: Element): ResizeObserverEntry => ({
  target,
  contentRect: target.getBoundingClientRect(),
  borderBoxSize: [],
  contentBoxSize: [],
  devicePixelContentBoxSize: [],
});

const makeDomRect = (partial: Partial<DOMRect>): DOMRect => ({
  x: partial.x ?? partial.left ?? 0,
  y: partial.y ?? partial.top ?? 0,
  width: partial.width ?? partial.height ?? 0,
  height: partial.height ?? partial.width ?? 0,
  top: partial.top ?? 0,
  left: partial.left ?? 0,
  right: partial.right ?? 0,
  bottom: partial.bottom ?? 0,
  toJSON: () => ({}),
});

vi.mock('@scena/guides', () => ({
  default: class MockGuides {
    on = vi.fn();
    off = vi.fn();
    destroy = vi.fn();
    resize = vi.fn();
    setState = vi.fn();
    scroll = vi.fn();
    scrollGuides = vi.fn();
  },
}));

describe('StageMask', () => {
  let mask: StageMask | null = null;

  beforeEach(() => {
    globalThis.document.body.innerHTML = '';
  });

  afterEach(() => {
    mask?.destroy();
    mask = null;
  });

  test('mount 将 wrapper 挂到容器', () => {
    mask = new StageMask({ disabledRule: true });
    const host = globalThis.document.createElement('div');
    globalThis.document.body.appendChild(host);
    mask.mount(host);
    expect(host.contains(mask.wrapper)).toBe(true);
  });

  test('setLayout 根据 fixed 父节点切换 mode', () => {
    mask = new StageMask({ disabledRule: true });
    const el = globalThis.document.createElement('div');
    el.style.position = 'absolute';
    mask.setLayout(el);
    expect(mask.content.dataset.mode).toBe(Mode.ABSOLUTE);

    const fixed = globalThis.document.createElement('div');
    fixed.style.position = 'fixed';
    globalThis.document.body.appendChild(fixed);
    mask.setLayout(fixed);
    expect(mask.content.dataset.mode).toBe(Mode.FIXED);
  });

  test('pageResize 同步宽高并触发 scroll', () => {
    mask = new StageMask({ disabledRule: true });
    const page = globalThis.document.createElement('div');
    Object.defineProperty(page, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(page, 'clientHeight', { value: 300, configurable: true });
    mask.observe(page);

    mask.pageResize([makeResizeEntry(page)]);
    expect(mask.width).toBe(400);
    expect(mask.height).toBe(300);
  });

  test('wheel 事件更新 scroll 并 emit scroll', () => {
    mask = new StageMask({ disabledRule: true });
    const page = globalThis.document.createElement('div');
    Object.defineProperty(page, 'clientWidth', { value: 1000, configurable: true });
    Object.defineProperty(page, 'clientHeight', { value: 1000, configurable: true });
    mask.observe(page);
    mask.pageResize([makeResizeEntry(page)]);
    mask.wrapperWidth = 400;
    mask.wrapperHeight = 300;
    (mask as any).setMaxScrollLeft();
    (mask as any).setMaxScrollTop();

    const fn = vi.fn();
    mask.on('scroll', fn);
    mask.content.dispatchEvent(new WheelEvent('wheel', { deltaY: 10, deltaX: 5, bubbles: true }));
    expect(fn).toHaveBeenCalled();
    expect(mask.scrollTop).not.toBe(0);
  });

  test('setGuides / clearGuides 透传 Rule 能力', () => {
    mask = new StageMask({ disabledRule: true });
    const fn = vi.fn();
    mask.on('change-guides', fn);
    mask.setGuides([[1], [2]]);
    mask.clearGuides();
    expect(fn).toHaveBeenCalled();
  });

  test('observe 后 observerIntersection 触发 scrollIntoView', () => {
    const originalIo = globalThis.IntersectionObserver;
    const MockIntersectionObserver = vi.fn(function (
      this: {
        observe: ReturnType<typeof vi.fn>;
        unobserve: ReturnType<typeof vi.fn>;
        disconnect: ReturnType<typeof vi.fn>;
      },
      callback: IntersectionObserverCallback,
    ) {
      this.observe = vi.fn((target: Element) => {
        const entry: IntersectionObserverEntry = {
          target,
          intersectionRatio: 0,
          isIntersecting: false,
          boundingClientRect: makeDomRect({}),
          intersectionRect: makeDomRect({}),
          rootBounds: null,
          time: 0,
        };
        callback([entry], this as unknown as IntersectionObserver);
      });
      this.unobserve = vi.fn();
      this.disconnect = vi.fn();
    });
    globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

    try {
      mask = new StageMask({ disabledRule: true });
      const page = globalThis.document.createElement('div');
      Object.defineProperty(page, 'clientWidth', { value: 400, configurable: true });
      Object.defineProperty(page, 'clientHeight', { value: 300, configurable: true });
      Object.defineProperty(page, 'scrollWidth', { value: 400, configurable: true });
      mask.observe(page);
      mask.pageResize([makeResizeEntry(page)]);
      mask.wrapperWidth = 400;
      mask.wrapperHeight = 300;

      const el = globalThis.document.createElement('div');
      page.appendChild(el);
      el.scrollIntoView = vi.fn();
      el.getBoundingClientRect = () => makeDomRect({ left: 0, top: 0, width: 10, height: 10 });

      mask.observerIntersection(el);
      expect(el.scrollIntoView).toHaveBeenCalled();
    } finally {
      globalThis.IntersectionObserver = originalIo;
    }
  });

  test('destroy 清理 observer 与 page', () => {
    mask = new StageMask({ disabledRule: true });
    const page = globalThis.document.createElement('div');
    mask.observe(page);
    mask.destroy();
    expect(mask.page).toBeNull();
  });
});
