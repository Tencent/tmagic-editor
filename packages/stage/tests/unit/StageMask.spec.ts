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

  // 构造一个带滚动容器的页面结构：body > scrollParent(overflow: auto) > page
  const setupScrollablePage = (m: StageMask) => {
    const scrollParent = globalThis.document.createElement('div');
    scrollParent.style.overflow = 'auto';
    scrollParent.style.position = 'relative';
    globalThis.document.body.appendChild(scrollParent);
    Object.defineProperty(scrollParent, 'clientHeight', { value: 300, configurable: true });
    Object.defineProperty(scrollParent, 'scrollTop', { value: 0, writable: true, configurable: true });
    scrollParent.scrollTo = vi.fn();
    scrollParent.getBoundingClientRect = () =>
      makeDomRect({ left: 0, top: 0, right: 400, bottom: 300, width: 400, height: 300 });

    const page = globalThis.document.createElement('div');
    Object.defineProperty(page, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(page, 'clientHeight', { value: 1000, configurable: true });
    Object.defineProperty(page, 'scrollWidth', { value: 400, configurable: true });
    scrollParent.appendChild(page);

    m.observe(page);
    m.pageResize([makeResizeEntry(page)]);
    m.wrapperWidth = 400;
    m.wrapperHeight = 300;

    return { scrollParent, page };
  };

  test('observe 后 observerIntersection 触发 scrollIntoView，只滚动页面滚动容器', () => {
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
      const { scrollParent, page } = setupScrollablePage(mask);

      const el = globalThis.document.createElement('div');
      page.appendChild(el);
      el.scrollIntoView = vi.fn();
      // 元素在可视区域（300）下方
      el.getBoundingClientRect = () =>
        makeDomRect({ left: 0, top: 500, right: 10, bottom: 600, width: 10, height: 100 });

      mask.observerIntersection(el);

      // 不调用原生 scrollIntoView，避免编辑器外层滚动容器被连带滚动
      expect(el.scrollIntoView).not.toHaveBeenCalled();
      // 只滚动页面所在的滚动容器：600 - 300 = 300
      expect(scrollParent.scrollTop).toBe(300);
      expect(mask.scrollTop).toBe(300);
    } finally {
      globalThis.IntersectionObserver = originalIo;
    }
  });

  test('scrollIntoView：元素已在可视区域内时不滚动', () => {
    mask = new StageMask({ disabledRule: true });
    const { scrollParent, page } = setupScrollablePage(mask);

    const el = globalThis.document.createElement('div');
    page.appendChild(el);
    el.getBoundingClientRect = () => makeDomRect({ left: 0, top: 50, right: 10, bottom: 150, width: 10, height: 100 });

    mask.scrollIntoView(el);

    expect(scrollParent.scrollTop).toBe(0);
    expect(mask.scrollTop).toBe(0);
  });

  test('scrollIntoView：元素在可视区域上方时向上滚动', () => {
    mask = new StageMask({ disabledRule: true });
    const { scrollParent, page } = setupScrollablePage(mask);
    scrollParent.scrollTop = 200;

    const el = globalThis.document.createElement('div');
    page.appendChild(el);
    el.getBoundingClientRect = () => makeDomRect({ left: 0, top: -100, right: 10, bottom: 0, width: 10, height: 100 });

    mask.scrollIntoView(el);

    // 200 - 100 = 100
    expect(scrollParent.scrollTop).toBe(100);
    expect(mask.scrollTop).toBe(100);
  });

  test('scrollIntoView：元素高于可视区域时优先让顶部可见', () => {
    mask = new StageMask({ disabledRule: true });
    const { scrollParent, page } = setupScrollablePage(mask);

    const el = globalThis.document.createElement('div');
    page.appendChild(el);
    // 元素高度 700，超过可视区域高度 300
    el.getBoundingClientRect = () =>
      makeDomRect({ left: 0, top: 500, right: 10, bottom: 1200, width: 10, height: 700 });

    mask.scrollIntoView(el);

    // 对齐顶部：滚动 500，而不是 1200 - 300 = 900
    expect(scrollParent.scrollTop).toBe(500);
    expect(mask.scrollTop).toBe(500);
  });

  test('scrollIntoView：元素在内部滚动容器中时，滚动页面滚动容器使内部容器可见', () => {
    mask = new StageMask({ disabledRule: true });
    const { scrollParent, page } = setupScrollablePage(mask);

    const innerScroll = globalThis.document.createElement('div');
    innerScroll.style.overflow = 'auto';
    innerScroll.style.position = 'relative';
    page.appendChild(innerScroll);
    innerScroll.getBoundingClientRect = () =>
      makeDomRect({ left: 0, top: 500, right: 100, bottom: 700, width: 100, height: 200 });

    const el = globalThis.document.createElement('div');
    innerScroll.appendChild(el);
    el.getBoundingClientRect = () => makeDomRect({ left: 0, top: 500, right: 10, bottom: 600, width: 10, height: 100 });

    mask.scrollIntoView(el);

    // 递归滚动页面滚动容器，使内部滚动容器完整可见：700 - 300 = 400
    expect(scrollParent.scrollTop).toBe(400);
    expect(mask.scrollTop).toBe(400);
  });

  test('scrollIntoView：pageScrollParent 不存在时不滚动', () => {
    mask = new StageMask({ disabledRule: true });
    const page = globalThis.document.createElement('div');
    Object.defineProperty(page, 'scrollWidth', { value: 400, configurable: true });
    mask.observe(page);

    const el = globalThis.document.createElement('div');
    page.appendChild(el);
    el.scrollIntoView = vi.fn();
    el.getBoundingClientRect = () => makeDomRect({ left: 0, top: 500, right: 10, bottom: 600, width: 10, height: 100 });

    expect(() => mask.scrollIntoView(el)).not.toThrow();
    expect(el.scrollIntoView).not.toHaveBeenCalled();
  });

  test('destroy 清理 observer 与 page', () => {
    mask = new StageMask({ disabledRule: true });
    const page = globalThis.document.createElement('div');
    mask.observe(page);
    mask.destroy();
    expect(mask.page).toBeNull();
  });
});
