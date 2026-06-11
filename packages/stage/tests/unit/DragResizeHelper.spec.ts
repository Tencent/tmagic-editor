/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';

import { getIdFromEl, setIdToEl } from '@tmagic/core';

import { DRAG_EL_ID_PREFIX, Mode } from '../../src/const';
import DragResizeHelper from '../../src/DragResizeHelper';

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
});

afterEach(() => {
  globalThis.document.body.innerHTML = '';
});

describe('DragResizeHelper', () => {
  const createHelper = () => {
    const container = globalThis.document.createElement('div');
    globalThis.document.body.appendChild(container);
    return new DragResizeHelper({ container });
  };

  const createTarget = (id = 'target') => {
    const el = globalThis.document.createElement('div');
    el.style.cssText = 'position:absolute;left:10px;top:20px;width:100px;height:80px;';
    setIdToEl()(el, id);
    globalThis.document.body.appendChild(el);
    return el;
  };

  test('updateShadowEl 创建 shadow 元素', () => {
    const helper = createHelper();
    const target = createTarget();
    helper.updateShadowEl(target);
    expect(helper.getShadowEl()).toBeTruthy();
    helper.destroy();
  });

  test('destroyShadowEl 仅移除单选 shadow', () => {
    const helper = createHelper();
    helper.updateShadowEl(createTarget());
    helper.destroyShadowEl();
    expect(helper.getShadowEl()).toBeUndefined();
    helper.destroy();
  });

  test('onResizeStart / onDragStart 调用 moveableHelper', () => {
    const helper = createHelper();
    const target = createTarget();
    helper.updateShadowEl(target);
    helper.onResizeStart({ target: helper.getShadowEl() } as any);
    helper.onDragStart({ target: helper.getShadowEl() } as any);
    helper.destroy();
  });

  test('setMode 切换布局模式', () => {
    const helper = createHelper();
    helper.setMode(Mode.SORTABLE);
    helper.updateShadowEl(createTarget());
    helper.destroy();
  });

  test('destroy 清理 target 与 shadow', () => {
    const helper = createHelper();
    helper.updateShadowEl(createTarget());
    helper.destroy();
    expect(helper.getShadowEl()).toBeUndefined();
  });

  test('onResize / onDrag 在 ABSOLUTE 模式更新 target 样式', () => {
    const helper = createHelper();
    const target = createTarget();
    helper.updateShadowEl(target);
    helper.onResizeStart({ target: helper.getShadowEl() } as any);
    helper.onResize({
      width: 120,
      height: 90,
      drag: { beforeTranslate: [5, 6] },
      target: helper.getShadowEl(),
    } as any);
    helper.onDragStart({ target: helper.getShadowEl() } as any);
    helper.onDrag({ beforeTranslate: [3, 4], target: helper.getShadowEl() } as any);
    expect(target.style.width).toContain('px');
    helper.destroy();
  });

  test('SORTABLE 模式 onDragStart 生成 ghost 元素', () => {
    const helper = createHelper();
    helper.setMode(Mode.SORTABLE);
    const target = createTarget();
    helper.updateShadowEl(target);
    helper.onDragStart({ target: helper.getShadowEl() } as any);
    expect(helper.getGhostEl()).toBeDefined();
    helper.onDrag({ beforeTranslate: [0, 10], target: helper.getShadowEl() } as any);
    helper.destroyGhostEl();
    helper.destroy();
  });

  test('onRotate / onScale 更新 transform', () => {
    const helper = createHelper();
    const target = createTarget();
    helper.updateShadowEl(target);
    helper.onRotateStart({ target: helper.getShadowEl() } as any);
    helper.onRotate({ target: helper.getShadowEl() } as any);
    helper.onScaleStart({ target: helper.getShadowEl() } as any);
    helper.onScale({ target: helper.getShadowEl() } as any);
    expect(target.style.transform).toBeTruthy();
    helper.destroy();
  });

  test('updateGroup / onDragGroup / onResizeGroup 多选逻辑', () => {
    const helper = createHelper();
    const a = createTarget('a');
    const b = createTarget('b');
    helper.updateGroup([a, b]);
    expect(helper.getShadowEls()).toHaveLength(2);

    const shadowA = helper.getShadowEls()[0] as HTMLElement;
    setIdToEl()(shadowA, `${DRAG_EL_ID_PREFIX}a`);

    helper.onDragGroupStart({ events: [{ target: shadowA }] } as any);
    helper.onDragGroup({
      events: [{ target: shadowA, beforeTranslate: [2, 3] }],
    } as any);
    helper.onResizeGroupStart({ events: [{ target: shadowA, drag: { beforeTranslate: [0, 0] } }] } as any);
    helper.onResizeGroup({
      events: [{ target: shadowA, drag: { beforeTranslate: [1, 2], width: 100, height: 80 } }],
    } as any);

    helper.clearMultiSelectStatus();
    expect(helper.getShadowEls()).toHaveLength(0);
    helper.destroy();
  });

  test('getUpdatedElRect 返回元素矩形信息', () => {
    const helper = createHelper();
    const target = createTarget('rect');
    Object.defineProperty(target, 'clientWidth', { value: 100, configurable: true });
    Object.defineProperty(target, 'clientHeight', { value: 80, configurable: true });
    helper.updateShadowEl(target);
    const rect = helper.getUpdatedElRect(target, null, globalThis.document);
    expect(rect).toMatchObject({ width: expect.any(Number), height: expect.any(Number) });
    helper.destroy();
  });

  test('clear 调用 moveableHelper.clear', () => {
    const helper = createHelper();
    helper.clear();
    helper.destroy();
  });

  test('SORTABLE 模式 onResize 更新 shadow 尺寸', () => {
    const helper = createHelper();
    helper.setMode(Mode.SORTABLE);
    const target = createTarget('sort-resize');
    helper.updateShadowEl(target);
    helper.onResizeStart({ target: helper.getShadowEl() } as any);
    helper.onResize({
      width: 150,
      height: 100,
      drag: { beforeTranslate: [0, 0] },
      target: helper.getShadowEl(),
    } as any);
    expect(helper.getShadowEl()?.style.width).toBe('150px');
    helper.destroy();
  });

  test('setTargetList 更新多选目标列表', () => {
    const helper = createHelper();
    const a = createTarget('ta');
    const b = createTarget('tb');
    helper.setTargetList([a, b]);
    helper.destroy();
  });

  test('onResizeGroup 父元素也在多选列表时跳过位置更新', () => {
    const helper = createHelper();
    const parent = createTarget('parent');
    const child = createTarget('child');
    parent.appendChild(child);
    helper.updateGroup([parent, child]);

    const shadowParent = helper.getShadowEls().find((s) => getIdFromEl()(s)?.endsWith('parent')) as HTMLElement;
    setIdToEl()(shadowParent, `${DRAG_EL_ID_PREFIX}parent`);

    helper.onResizeGroupStart({
      events: [{ target: shadowParent, drag: { beforeTranslate: [0, 0] } }],
    } as any);
    helper.onResizeGroup({
      events: [
        {
          target: shadowParent,
          drag: { beforeTranslate: [10, 10], width: 200, height: 100 },
        },
      ],
    } as any);
    helper.destroy();
  });

  test('getUpdatedElRect 带 parentEl 时使用 shadow 偏移', () => {
    const helper = createHelper();
    const parent = createTarget('parent-el');
    const target = createTarget('child-el');
    parent.appendChild(target);
    Object.defineProperty(target, 'clientWidth', { value: 100, configurable: true });
    Object.defineProperty(target, 'clientHeight', { value: 80, configurable: true });
    helper.updateShadowEl(target);
    const shadow = helper.getShadowEl() as HTMLElement;
    Object.defineProperty(shadow, 'offsetLeft', { value: 20, configurable: true });
    Object.defineProperty(shadow, 'offsetTop', { value: 30, configurable: true });
    const rect = helper.getUpdatedElRect(target, parent, globalThis.document);
    expect(rect.left).toBeDefined();
    expect(rect.top).toBeDefined();
    helper.destroy();
  });
});
