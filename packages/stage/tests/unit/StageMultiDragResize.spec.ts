/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';

import { setIdToEl } from '@tmagic/core';

import { DRAG_EL_ID_PREFIX } from '../../src/const';
import DragResizeHelper from '../../src/DragResizeHelper';
import StageMultiDragResize from '../../src/StageMultiDragResize';

const moveableHandlers: Record<string, Function[]> = {};

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
      onResizeGroupStart: vi.fn(),
      onResizeGroup: vi.fn(),
      onDragGroupStart: vi.fn(),
      onDragGroup: vi.fn(),
      getFrame: vi.fn(() => ({
        get: vi.fn(() => 'transform(1)'),
        toCSSObject: () => ({ transform: 'rotate(10deg)' }),
        properties: { transform: { translate: { value: ['0', '0'] } } },
      })),
    }),
  },
}));

vi.mock('moveable', () => ({
  default: class MockMoveable {
    public target: any = null;
    destroy = vi.fn();
    updateRect = vi.fn();
    updateTarget = vi.fn();
    on(event: string, handler: Function) {
      moveableHandlers[event] = moveableHandlers[event] || [];
      moveableHandlers[event].push(handler);
      return this;
    }
  },
}));

vi.mock('../../src/MoveableActionsAble', () => ({
  default: () => ({ name: 'actions' }),
}));

Object.defineProperties(globalThis.HTMLElement.prototype, {
  offsetTop: {
    get() {
      return parseFloat((this as HTMLElement).style.top) || 0;
    },
    configurable: true,
  },
  offsetLeft: {
    get() {
      return parseFloat((this as HTMLElement).style.left) || 0;
    },
    configurable: true,
  },
  clientWidth: {
    get() {
      return parseFloat((this as HTMLElement).style.width) || 100;
    },
    configurable: true,
  },
  clientHeight: {
    get() {
      return parseFloat((this as HTMLElement).style.height) || 80;
    },
    configurable: true,
  },
});

afterEach(() => {
  Object.keys(moveableHandlers).forEach((k) => delete moveableHandlers[k]);
  globalThis.document.body.innerHTML = '';
});

describe('StageMultiDragResize', () => {
  const createTarget = (id: string, left = '10px', top = '20px') => {
    const el = globalThis.document.createElement('div');
    el.style.cssText = `position:absolute;left:${left};top:${top};width:100px;height:80px;`;
    setIdToEl()(el, id);
    globalThis.document.body.appendChild(el);
    return el;
  };

  const createInstance = () => {
    const container = globalThis.document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true });
    globalThis.document.body.appendChild(container);
    const dragResizeHelper = new DragResizeHelper({ container });
    const multiDr = new StageMultiDragResize({
      container,
      getRootContainer: () => container,
      getRenderDocument: () => globalThis.document,
      dragResizeHelper,
      markContainerEnd: vi.fn(() => null),
      delayedMarkContainer: vi.fn(() => undefined),
    });
    return { container, multiDr, dragResizeHelper };
  };

  test('multiSelect 空数组直接返回', () => {
    const { multiDr } = createInstance();
    multiDr.multiSelect([]);
    expect(multiDr.targetList).toHaveLength(0);
    multiDr.destroy();
  });

  test('multiSelect 初始化 moveable 并绑定 group 事件', () => {
    const { multiDr } = createInstance();
    const els = [createTarget('a'), createTarget('b')];
    multiDr.multiSelect(els);
    expect(multiDr.targetList).toHaveLength(2);
    expect(multiDr.moveableForMulti).toBeDefined();
    multiDr.destroy();
  });

  test('canSelect 流式布局不可多选', () => {
    const { multiDr } = createInstance();
    const sortable = createTarget('sort');
    sortable.style.position = 'static';
    expect(multiDr.canSelect(sortable, null)).toBe(false);
    multiDr.destroy();
  });

  test('canSelect 不同定位模式不可混选', () => {
    const { multiDr } = createInstance();
    const abs = createTarget('abs1');
    const fixed = createTarget('fixed1');
    fixed.style.position = 'fixed';
    globalThis.document.body.appendChild(fixed);
    multiDr.multiSelect([abs]);
    expect(multiDr.canSelect(fixed, null)).toBe(false);
    multiDr.destroy();
  });

  test('clearSelectStatus 清空多选状态', () => {
    const { multiDr } = createInstance();
    multiDr.multiSelect([createTarget('a'), createTarget('b')]);
    multiDr.clearSelectStatus();
    expect(multiDr.targetList).toHaveLength(0);
    multiDr.destroy();
  });

  test('resizeGroupEnd 触发 update 事件', () => {
    const { multiDr } = createInstance();
    multiDr.multiSelect([createTarget('a'), createTarget('b')]);
    const fn = vi.fn();
    multiDr.on('update', fn);
    moveableHandlers.resizeGroupEnd?.forEach((handler) => handler());
    expect(fn).toHaveBeenCalled();
    multiDr.destroy();
  });

  test('clickGroup 多选态点击子元素触发 change-to-select', () => {
    const { multiDr, dragResizeHelper } = createInstance();
    multiDr.multiSelect([createTarget('a'), createTarget('b')]);
    const fn = vi.fn();
    multiDr.on('change-to-select', fn);
    const shadow = dragResizeHelper.getShadowEls()[0] as HTMLElement;
    setIdToEl()(shadow, `${DRAG_EL_ID_PREFIX}a`);
    moveableHandlers.clickGroup?.forEach((handler) =>
      handler({
        inputTarget: shadow,
        targets: dragResizeHelper.getShadowEls(),
        inputEvent: new MouseEvent('click'),
      }),
    );
    expect(fn).toHaveBeenCalledWith('a', expect.any(MouseEvent));
    multiDr.destroy();
  });

  test('dragGroupEnd 触发 update 并清理 timeout', () => {
    const markContainerEnd = vi.fn(() => null);
    const delayedMarkContainer = vi.fn(() => globalThis.setTimeout(() => {}, 1000));
    const container = globalThis.document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true });
    globalThis.document.body.appendChild(container);
    const dragResizeHelper = new DragResizeHelper({ container });
    const multiDr = new StageMultiDragResize({
      container,
      getRootContainer: () => container,
      getRenderDocument: () => globalThis.document,
      dragResizeHelper,
      markContainerEnd,
      delayedMarkContainer,
    });
    multiDr.multiSelect([createTarget('a'), createTarget('b')]);
    const fn = vi.fn();
    multiDr.on('update', fn);
    moveableHandlers.dragGroup?.forEach((handler) => handler({ inputEvent: new MouseEvent('mousemove'), events: [] }));
    moveableHandlers.dragGroupEnd?.forEach((handler) => handler());
    expect(fn).toHaveBeenCalled();
    multiDr.destroy();
  });

  test('updateMoveable 更新 moveable 配置', () => {
    const { multiDr } = createInstance();
    multiDr.multiSelect([createTarget('a'), createTarget('b')]);
    multiDr.updateMoveable();
    expect(multiDr.moveableForMulti?.updateRect).toHaveBeenCalled();
    multiDr.destroy();
  });

  test('canSelect 单选后追加多选', () => {
    const { multiDr } = createInstance();
    const abs = createTarget('abs2');
    expect(multiDr.canSelect(abs, abs)).toBe(true);
    multiDr.destroy();
  });

  test('updateMoveable 无 moveable 时直接返回', () => {
    const { multiDr } = createInstance();
    expect(() => multiDr.updateMoveable()).not.toThrow();
    multiDr.destroy();
  });
});
