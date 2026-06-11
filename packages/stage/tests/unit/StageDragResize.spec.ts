/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';

import { setIdToEl } from '@tmagic/core';

import { GuidesType, StageDragStatus } from '../../src/const';
import DragResizeHelper from '../../src/DragResizeHelper';
import StageDragResize from '../../src/StageDragResize';

const makeDomRect = (partial: Partial<DOMRect>): DOMRect => ({
  x: partial.x ?? partial.left ?? 0,
  y: partial.y ?? partial.top ?? 0,
  width: partial.width ?? 0,
  height: partial.height ?? 0,
  top: partial.top ?? 0,
  left: partial.left ?? 0,
  right: partial.right ?? 0,
  bottom: partial.bottom ?? 0,
  toJSON: () => ({}),
});

vi.mock('moveable-helper', () => ({
  default: {
    create: () => ({
      clear: vi.fn(),
      onResizeStart: vi.fn(),
      onResize: vi.fn(),
      onDragStart: vi.fn(),
      onDrag: vi.fn(),
      onRotateStart: vi.fn(),
      onRotate: vi.fn(),
      onScaleStart: vi.fn(),
      onScale: vi.fn(),
      getFrame: vi.fn(() => ({
        get: vi.fn(() => 'transform(1)'),
        toCSSObject: () => ({ transform: 'rotate(10deg)' }),
        properties: { transform: { translate: { value: ['0', '0'] } } },
      })),
      getUpdatedElRect: vi.fn(() => ({ left: 1, top: 2, width: 3, height: 4 })),
    }),
  },
}));

const moveableHandlers: Record<string, Function[]> = {};

vi.mock('moveable', () => ({
  default: class MockMoveable {
    public target: any = null;
    destroy = vi.fn();
    updateRect = vi.fn();
    dragStart = vi.fn();
    on(event: string, handler: Function) {
      moveableHandlers[event] = moveableHandlers[event] || [];
      moveableHandlers[event].push(handler);
      return this;
    }
  },
}));

afterEach(() => {
  Object.keys(moveableHandlers).forEach((k) => delete moveableHandlers[k]);
  globalThis.document.body.innerHTML = '';
});

describe('StageDragResize', () => {
  const createInstance = () => {
    const container = globalThis.document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true });
    globalThis.document.body.appendChild(container);
    const dragResizeHelper = new DragResizeHelper({ container });
    const dr = new StageDragResize({
      container,
      getRootContainer: () => container,
      getRenderDocument: () => globalThis.document,
      dragResizeHelper,
      markContainerEnd: vi.fn(() => null),
      delayedMarkContainer: vi.fn(() => undefined),
    });
    return { container, dr, dragResizeHelper };
  };

  const createTarget = () => {
    const el = globalThis.document.createElement('div');
    el.style.cssText = 'position:absolute;left:10px;top:20px;width:100px;height:80px;';
    setIdToEl()(el, 'node_1');
    globalThis.document.body.appendChild(el);
    return el;
  };

  test('select null 销毁 moveable', () => {
    const { dr } = createInstance();
    const target = createTarget();
    dr.select(target);
    dr.select(null);
    expect((dr as any).moveable).toBeUndefined();
    dr.destroy();
  });

  test('select 初始化 moveable 并 updateMoveable', () => {
    const { dr } = createInstance();
    const target = createTarget();
    dr.select(target);
    expect(dr.getTarget()).toBe(target);
    dr.updateMoveable(target);
    dr.destroy();
  });

  test('clearSelectStatus 清空选中框', () => {
    const { dr } = createInstance();
    dr.select(createTarget());
    dr.clearSelectStatus();
    dr.destroy();
  });

  test('setGuidelines / clearGuides 更新参考线', () => {
    const { dr } = createInstance();
    const fn = vi.fn();
    dr.on('update-moveable', fn);
    dr.setGuidelines(GuidesType.HORIZONTAL, [10]);
    dr.clearGuides();
    expect(fn).toHaveBeenCalled();
    dr.destroy();
  });

  test('resizeEnd 触发 update 事件', () => {
    const { dr } = createInstance();
    const target = createTarget();
    dr.select(target);
    const updateFn = vi.fn();
    dr.on('update', updateFn);

    moveableHandlers.resizeEnd?.[0]?.();
    expect(dr.getDragStatus()).toBe(StageDragStatus.END);
    expect(updateFn).toHaveBeenCalled();
    dr.destroy();
  });

  test('rotateEnd / scaleEnd 触发 update 事件', () => {
    const { dr } = createInstance();
    const target = createTarget();
    dr.select(target);
    const updateFn = vi.fn();
    dr.on('update', updateFn);
    const shadow = (dr as any).dragResizeHelper.getShadowEl();

    moveableHandlers.rotateEnd?.forEach((fn) => fn({ target: shadow }));
    moveableHandlers.scaleEnd?.forEach((fn) => fn({ target: shadow }));
    expect(updateFn).toHaveBeenCalled();
    dr.destroy();
  });

  test('dragEnd 在拖动过程中触发 update', () => {
    const markContainerEnd = vi.fn(() => null);
    const { dr } = createInstance();
    (dr as any).markContainerEnd = markContainerEnd;
    const target = createTarget();
    dr.select(target);
    const updateFn = vi.fn();
    dr.on('update', updateFn);
    const shadow = (dr as any).dragResizeHelper.getShadowEl();

    moveableHandlers.dragStart?.forEach((fn) => fn({ target: shadow }));
    moveableHandlers.drag?.forEach((fn) =>
      fn({ target: shadow, beforeTranslate: [5, 5], inputEvent: new MouseEvent('mousemove') }),
    );
    moveableHandlers.dragEnd?.forEach((fn) => fn());
    expect(updateFn).toHaveBeenCalled();
    dr.destroy();
  });

  test('dragEnd 带 parentEl 时传递 parentEl', () => {
    const parent = globalThis.document.createElement('div');
    const { dr } = createInstance();
    (dr as any).markContainerEnd = vi.fn(() => parent);
    const target = createTarget();
    dr.select(target);
    const updateFn = vi.fn();
    dr.on('update', updateFn);
    const shadow = (dr as any).dragResizeHelper.getShadowEl();

    moveableHandlers.dragStart?.forEach((fn) => fn({ target: shadow }));
    moveableHandlers.drag?.forEach((fn) =>
      fn({ target: shadow, beforeTranslate: [5, 5], inputEvent: new MouseEvent('mousemove') }),
    );
    moveableHandlers.dragEnd?.forEach((fn) => fn());
    expect(updateFn).toHaveBeenCalledWith(expect.objectContaining({ parentEl: parent }));
    dr.destroy();
  });

  test('SORTABLE 模式 dragEnd 触发 sort 事件', () => {
    const { dr, dragResizeHelper } = createInstance();
    const target = globalThis.document.createElement('div');
    target.style.cssText = 'position:static;width:100px;height:80px;';
    setIdToEl()(target, 'sort-node');
    globalThis.document.body.appendChild(target);
    dr.select(target);
    const sortFn = vi.fn();
    dr.on('sort', sortFn);
    const shadow = dragResizeHelper.getShadowEl();

    moveableHandlers.dragStart?.forEach((fn) => fn({ target: shadow }));
    moveableHandlers.drag?.forEach((fn) =>
      fn({ target: shadow, beforeTranslate: [5, 5], inputEvent: new MouseEvent('mousemove') }),
    );
    const ghost = dragResizeHelper.getGhostEl();
    if (ghost) {
      ghost.getBoundingClientRect = () => makeDomRect({ top: 200, left: 0 });
    }
    target.getBoundingClientRect = () => makeDomRect({ top: 0, left: 0 });
    moveableHandlers.dragEnd?.forEach((fn) => fn());
    expect(sortFn).toHaveBeenCalled();
    dr.destroy();
  });

  test('init 时 overflow auto 会被设为 hidden', () => {
    const { dr } = createInstance();
    const target = createTarget();
    target.style.overflow = 'auto';
    dr.select(target);
    expect(target.style.overflow).toBe('hidden');
    dr.destroy();
  });

  test('select 带 event 时调用 dragStart', () => {
    const { dr } = createInstance();
    const target = createTarget();
    dr.select(target);
    const event = new MouseEvent('mousedown');
    dr.select(target, event);
    expect((dr as any).moveable?.dragStart).toHaveBeenCalled();
    dr.destroy();
  });
});
