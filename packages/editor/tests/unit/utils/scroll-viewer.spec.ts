/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { ScrollViewer } from '@editor/utils/scroll-viewer';

const setupBoundingRect = (el: HTMLElement, rect: Partial<DOMRect>) => {
  el.getBoundingClientRect = () => ({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...rect,
  });
};

describe('ScrollViewer', () => {
  let container: HTMLDivElement;
  let target: HTMLDivElement;
  let viewer: ScrollViewer;

  beforeEach(() => {
    container = document.createElement('div');
    target = document.createElement('div');
    document.body.appendChild(container);
    container.appendChild(target);
    setupBoundingRect(container, { width: 200, height: 200 });
    setupBoundingRect(target, { width: 400, height: 400 });
  });

  afterEach(() => {
    viewer?.destroy();
    document.body.innerHTML = '';
  });

  test('实例化与 scrollTo 应用 transform', () => {
    viewer = new ScrollViewer({ container, target, zoom: 1 });
    viewer.scrollTo({ left: 50, top: 30 });
    expect(target.style.transform).toContain('translate');
  });

  test('setZoom 改变缩放并更新 scroll 尺寸', () => {
    viewer = new ScrollViewer({ container, target, zoom: 1 });
    viewer.setZoom(2);
  });

  test('wheel 事件触发 scroll 事件回调', () => {
    viewer = new ScrollViewer({ container, target, zoom: 1 });
    const spy = vi.fn();
    viewer.on('scroll', spy);

    const wheel = new WheelEvent('wheel', { deltaX: 10, deltaY: 10, bubbles: true });
    container.dispatchEvent(wheel);
    expect(spy).toHaveBeenCalled();
  });

  test('correctionScrollSize 影响 scrollSize', () => {
    viewer = new ScrollViewer({
      container,
      target,
      zoom: 1,
      correctionScrollSize: { width: 100, height: 50 },
    });
    expect(viewer).toBeInstanceOf(ScrollViewer);
  });

  test('destroy 解除事件监听', () => {
    viewer = new ScrollViewer({ container, target, zoom: 1 });
    viewer.destroy();
    const spy = vi.fn();
    viewer.on('scroll', spy);
    container.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true }));
    expect(spy).not.toHaveBeenCalled();
  });

  test('wheel 事件 currentTarget 不匹配时直接返回', () => {
    viewer = new ScrollViewer({ container, target, zoom: 1 });
    const spy = vi.fn();
    viewer.on('scroll', spy);
    spy.mockClear();
    const inner = document.createElement('div');
    container.appendChild(inner);
    const wheel = new WheelEvent('wheel', { deltaY: 100, bubbles: true });
    Object.defineProperty(wheel, 'currentTarget', { value: inner });
    container.dispatchEvent(wheel);
  });

  test('wheel 滚动到顶端边界时不再继续向上', () => {
    setupBoundingRect(target, { width: 400, height: 400 });
    viewer = new ScrollViewer({ container, target, zoom: 1 });
    container.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true }));
    container.dispatchEvent(new WheelEvent('wheel', { deltaY: 50, bubbles: true }));
    container.dispatchEvent(new WheelEvent('wheel', { deltaY: -1000, bubbles: true }));
  });

  test('scrollTo 仅传 left 或 top 也能工作', () => {
    viewer = new ScrollViewer({ container, target, zoom: 1 });
    viewer.scrollTo({ left: 10 });
    viewer.scrollTo({ top: 20 });
    expect(target.style.transform).toContain('translate');
  });

  test('zoom 变化触发 setScrollSize 缩进路径', () => {
    setupBoundingRect(container, { width: 1000, height: 1000 });
    setupBoundingRect(target, { width: 100, height: 100 });
    viewer = new ScrollViewer({ container, target, zoom: 1 });
    viewer.setZoom(0.5);
  });

  test('target.style.marginTop 影响 scrollHeight 计算', () => {
    target.style.marginTop = '50';
    viewer = new ScrollViewer({ container, target, zoom: 1 });
    container.dispatchEvent(new WheelEvent('wheel', { deltaY: 1000, bubbles: true }));
  });
});
