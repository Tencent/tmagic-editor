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
    globalThis.document.body.appendChild(page);
    mask.observe(page);

    mask.pageResize([makeResizeEntry(page)]);
    expect(mask.width).toBe(400);
    expect(mask.height).toBe(300);
    expect(mask.content.style.width).toBe('400px');
    expect(mask.content.style.height).toBe('300px');
  });

  test('observe 切到新页面时重置页面与 mask 滚动', () => {
    mask = new StageMask({ disabledRule: true });
    const tallScrollParent = globalThis.document.createElement('div');
    tallScrollParent.style.overflow = 'auto';
    Object.defineProperty(tallScrollParent, 'scrollTop', { value: 0, writable: true, configurable: true });
    Object.defineProperty(tallScrollParent, 'scrollLeft', { value: 0, writable: true, configurable: true });
    tallScrollParent.scrollTo = vi.fn(({ top = 0, left = 0 }: ScrollToOptions = {}) => {
      tallScrollParent.scrollTop = Number(top);
      tallScrollParent.scrollLeft = Number(left);
    });
    globalThis.document.body.appendChild(tallScrollParent);

    const tallPage = globalThis.document.createElement('div');
    Object.defineProperty(tallPage, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(tallPage, 'clientHeight', { value: 1000, configurable: true });
    tallScrollParent.appendChild(tallPage);
    mask.observe(tallPage);
    mask.wrapperWidth = 400;
    mask.wrapperHeight = 300;
    (mask as any).setMaxScrollLeft();
    (mask as any).setMaxScrollTop();
    mask.scrollTop = 500;
    mask.scrollLeft = 80;
    (mask as any).scroll();
    expect(mask.scrollTop).toBe(500);
    expect(tallScrollParent.scrollTop).toBe(500);

    const shortScrollParent = globalThis.document.createElement('div');
    shortScrollParent.style.overflow = 'auto';
    // 模拟新页挂载前滚动容器仍残留偏移（如 iframe documentElement）
    Object.defineProperty(shortScrollParent, 'scrollTop', { value: 500, writable: true, configurable: true });
    Object.defineProperty(shortScrollParent, 'scrollLeft', { value: 80, writable: true, configurable: true });
    shortScrollParent.scrollTo = vi.fn(({ top = 0, left = 0 }: ScrollToOptions = {}) => {
      shortScrollParent.scrollTop = Number(top);
      shortScrollParent.scrollLeft = Number(left);
    });
    globalThis.document.body.appendChild(shortScrollParent);

    const shortPage = globalThis.document.createElement('div');
    Object.defineProperty(shortPage, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(shortPage, 'clientHeight', { value: 400, configurable: true });
    shortScrollParent.appendChild(shortPage);
    mask.observe(shortPage);

    expect(mask.width).toBe(400);
    expect(mask.height).toBe(400);
    expect(mask.maxScrollTop).toBe(100);
    expect(shortScrollParent.scrollTop).toBe(0);
    expect(shortScrollParent.scrollLeft).toBe(0);
    expect(mask.scrollTop).toBe(0);
    expect(mask.scrollLeft).toBe(0);
    expect(mask.content.style.transform).toBe('translate3d(0px, 0px, 0)');
  });

  test('observe 同一页面 DOM 时不重新同步滚动；同页尺寸变化仅修正偏移', () => {
    mask = new StageMask({ disabledRule: true });
    const page = globalThis.document.createElement('div');
    Object.defineProperty(page, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(page, 'clientHeight', { value: 1000, configurable: true });
    globalThis.document.body.appendChild(page);
    mask.observe(page);
    mask.wrapperWidth = 400;
    mask.wrapperHeight = 300;
    (mask as any).setMaxScrollLeft();
    (mask as any).setMaxScrollTop();
    mask.scrollTop = 500;
    (mask as any).scroll();
    expect(mask.scrollTop).toBe(500);

    mask.observe(page);
    expect(mask.scrollTop).toBe(500);

    Object.defineProperty(page, 'clientHeight', { value: 400, configurable: true });
    mask.pageResize([makeResizeEntry(page)]);
    expect(mask.height).toBe(400);
    expect(mask.maxScrollTop).toBe(100);
    expect(mask.scrollTop).toBe(100);
  });

  test('observe 切到 0 尺寸页面时仍重置 transform，不依赖 syncPageSize', () => {
    mask = new StageMask({ disabledRule: true });
    const tallScrollParent = globalThis.document.createElement('div');
    tallScrollParent.style.overflow = 'auto';
    Object.defineProperty(tallScrollParent, 'scrollTop', { value: 0, writable: true, configurable: true });
    tallScrollParent.scrollTo = vi.fn(({ top = 0 }: ScrollToOptions = {}) => {
      tallScrollParent.scrollTop = Number(top);
    });
    globalThis.document.body.appendChild(tallScrollParent);

    const tallPage = globalThis.document.createElement('div');
    Object.defineProperty(tallPage, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(tallPage, 'clientHeight', { value: 1000, configurable: true });
    tallScrollParent.appendChild(tallPage);
    mask.observe(tallPage);
    mask.wrapperWidth = 400;
    mask.wrapperHeight = 300;
    (mask as any).setMaxScrollTop();
    mask.scrollTop = 500;
    (mask as any).scroll();
    expect(mask.content.style.transform).toBe('translate3d(0px, -500px, 0)');

    const emptyScrollParent = globalThis.document.createElement('div');
    emptyScrollParent.style.overflow = 'auto';
    Object.defineProperty(emptyScrollParent, 'scrollTop', { value: 500, writable: true, configurable: true });
    emptyScrollParent.scrollTo = vi.fn(({ top = 0 }: ScrollToOptions = {}) => {
      emptyScrollParent.scrollTop = Number(top);
    });
    globalThis.document.body.appendChild(emptyScrollParent);

    const emptyPage = globalThis.document.createElement('div');
    Object.defineProperty(emptyPage, 'clientWidth', { value: 0, configurable: true });
    Object.defineProperty(emptyPage, 'clientHeight', { value: 0, configurable: true });
    emptyScrollParent.appendChild(emptyPage);

    const customScrollHandler = vi.fn();
    mask.content.addEventListener('customScroll', customScrollHandler);
    mask.observe(emptyPage);

    // 尺寸保持旧值（syncPageSize 忽略 0），但滚动视觉状态必须立刻归零
    expect(mask.width).toBe(400);
    expect(mask.height).toBe(1000);
    expect(mask.scrollTop).toBe(0);
    expect(emptyScrollParent.scrollTop).toBe(0);
    expect(mask.content.style.transform).toBe('translate3d(0px, 0px, 0)');
    expect(customScrollHandler).toHaveBeenCalled();
    expect(customScrollHandler.mock.calls.at(-1)?.[0].detail).toEqual({
      scrollLeft: 0,
      scrollTop: 0,
    });
  });

  test('observe 无 pageScrollParent 时仍重置 mask 滚动并刷新 transform', () => {
    mask = new StageMask({ disabledRule: true });
    // position: fixed 时 getScrollParent 返回 null
    const page = globalThis.document.createElement('div');
    page.style.position = 'fixed';
    Object.defineProperty(page, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(page, 'clientHeight', { value: 1000, configurable: true });
    globalThis.document.body.appendChild(page);
    mask.observe(page);
    expect((mask as any).pageScrollParent).toBeNull();
    mask.wrapperWidth = 400;
    mask.wrapperHeight = 300;
    (mask as any).setMaxScrollTop();
    mask.scrollTop = 500;
    (mask as any).scroll();
    expect(mask.content.style.transform).toBe('translate3d(0px, -500px, 0)');

    const nextPage = globalThis.document.createElement('div');
    nextPage.style.position = 'fixed';
    Object.defineProperty(nextPage, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(nextPage, 'clientHeight', { value: 400, configurable: true });
    globalThis.document.body.appendChild(nextPage);
    mask.observe(nextPage);

    expect((mask as any).pageScrollParent).toBeNull();
    expect(mask.scrollTop).toBe(0);
    expect(mask.content.style.transform).toBe('translate3d(0px, 0px, 0)');
  });

  test('pageResize 忽略非当前页、已卸载页与 0 尺寸，避免切换页面后 editor-mask 变为 0', () => {
    mask = new StageMask({ disabledRule: true });
    const oldPage = globalThis.document.createElement('div');
    Object.defineProperty(oldPage, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(oldPage, 'clientHeight', { value: 300, configurable: true });
    globalThis.document.body.appendChild(oldPage);
    mask.observe(oldPage);
    expect(mask.width).toBe(400);
    expect(mask.height).toBe(300);

    const newPage = globalThis.document.createElement('div');
    Object.defineProperty(newPage, 'clientWidth', { value: 500, configurable: true });
    Object.defineProperty(newPage, 'clientHeight', { value: 600, configurable: true });
    globalThis.document.body.appendChild(newPage);
    mask.observe(newPage);
    expect(mask.width).toBe(500);
    expect(mask.height).toBe(600);
    expect(mask.content.style.width).toBe('500px');
    expect(mask.content.style.height).toBe('600px');

    // 仍连接但不是当前 page：忽略
    Object.defineProperty(oldPage, 'clientWidth', { value: 100, configurable: true });
    Object.defineProperty(oldPage, 'clientHeight', { value: 100, configurable: true });
    mask.pageResize([makeResizeEntry(oldPage)]);
    expect(mask.width).toBe(500);
    expect(mask.height).toBe(600);

    // batch 首项是旧页、后续是当前页：仍应应用当前页尺寸
    Object.defineProperty(newPage, 'clientWidth', { value: 520, configurable: true });
    Object.defineProperty(newPage, 'clientHeight', { value: 620, configurable: true });
    mask.pageResize([makeResizeEntry(oldPage), makeResizeEntry(newPage)]);
    expect(mask.width).toBe(520);
    expect(mask.height).toBe(620);

    // 旧页面卸载后 ResizeObserver 可能仍回调，不应覆盖当前蒙层尺寸
    Object.defineProperty(oldPage, 'clientWidth', { value: 0, configurable: true });
    Object.defineProperty(oldPage, 'clientHeight', { value: 0, configurable: true });
    oldPage.remove();
    mask.pageResize([makeResizeEntry(oldPage)]);
    expect(mask.width).toBe(520);
    expect(mask.height).toBe(620);

    // 当前 page 已断开连接：忽略
    newPage.remove();
    Object.defineProperty(newPage, 'clientWidth', { value: 100, configurable: true });
    Object.defineProperty(newPage, 'clientHeight', { value: 100, configurable: true });
    mask.pageResize([makeResizeEntry(newPage)]);
    expect(mask.width).toBe(520);
    expect(mask.height).toBe(620);
    expect(mask.content.style.width).toBe('520px');
    expect(mask.content.style.height).toBe('620px');

    // 重新挂载后短暂为 0 时也应忽略
    globalThis.document.body.appendChild(newPage);
    Object.defineProperty(newPage, 'clientWidth', { value: 0, configurable: true });
    Object.defineProperty(newPage, 'clientHeight', { value: 0, configurable: true });
    mask.pageResize([makeResizeEntry(newPage)]);
    expect(mask.width).toBe(520);
    expect(mask.height).toBe(620);
    expect(mask.content.style.width).toBe('520px');
    expect(mask.content.style.height).toBe('620px');
  });

  test('observe 时 page 宽高为 0 不更新蒙层尺寸', () => {
    mask = new StageMask({ disabledRule: true });
    const firstPage = globalThis.document.createElement('div');
    Object.defineProperty(firstPage, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(firstPage, 'clientHeight', { value: 300, configurable: true });
    globalThis.document.body.appendChild(firstPage);
    mask.observe(firstPage);

    const emptyPage = globalThis.document.createElement('div');
    Object.defineProperty(emptyPage, 'clientWidth', { value: 0, configurable: true });
    Object.defineProperty(emptyPage, 'clientHeight', { value: 0, configurable: true });
    globalThis.document.body.appendChild(emptyPage);
    mask.observe(emptyPage);

    expect(mask.page).toBe(emptyPage);
    expect(mask.width).toBe(400);
    expect(mask.height).toBe(300);
  });

  test('wheel 事件更新 scroll 并 emit scroll', () => {
    mask = new StageMask({ disabledRule: true });
    const page = globalThis.document.createElement('div');
    Object.defineProperty(page, 'clientWidth', { value: 1000, configurable: true });
    Object.defineProperty(page, 'clientHeight', { value: 1000, configurable: true });
    globalThis.document.body.appendChild(page);
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
