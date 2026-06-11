/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { MoveableOptions } from 'moveable';

import ActionManager from '../../src/ActionManager';
import { AbleActionEventType, ContainerHighlightType } from '../../src/const';
import type { ActionManagerConfig } from '../../src/types';

const mouseAtOrigin = (): MouseEvent => new MouseEvent('click', { clientX: 0, clientY: 0 });

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
    on() {
      return this;
    }
    off() {
      return this;
    }
    destroy() {}
    request() {}
    updateRect() {}
    updateTarget() {}
    dragStart() {}
  },
}));
vi.mock('../../src/MoveableActionsAble', () => ({
  default: () => ({ name: 'actions' }),
}));

const createConfig = (overrides: Partial<ActionManagerConfig> = {}): ActionManagerConfig => {
  const container = globalThis.document.createElement('div');
  globalThis.document.body.appendChild(container);
  Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true });
  Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true });
  return {
    container,
    getTargetElement: () => null,
    getElementsFromPoint: () => [],
    getRenderDocument: () => globalThis.document,
    getRootContainer: () => undefined,
    ...overrides,
  };
};

describe('ActionManager - alwaysMultiSelect', () => {
  let am: ActionManager | null = null;

  beforeEach(() => {
    globalThis.document.body.innerHTML = '';
  });

  afterEach(() => {
    am?.destroy();
    am = null;
  });

  test('默认配置下不会自动开启多选状态', () => {
    am = new ActionManager(createConfig());
    expect((am as any).isMultiSelectStatus).toBe(false);
    expect((am as any).alwaysMultiSelect).toBe(false);
  });

  test('alwaysMultiSelect=true 构造后即处于多选状态', () => {
    am = new ActionManager(createConfig({ alwaysMultiSelect: true }));
    expect((am as any).isMultiSelectStatus).toBe(true);
    expect((am as any).alwaysMultiSelect).toBe(true);
  });

  test('disabledMultiSelect=true 时 alwaysMultiSelect=true 也不会开启多选', () => {
    am = new ActionManager(
      createConfig({
        disabledMultiSelect: true,
        alwaysMultiSelect: true,
      }),
    );
    expect((am as any).isMultiSelectStatus).toBe(false);
    expect((am as any).disabledMultiSelect).toBe(true);
  });

  test('setAlwaysMultiSelect(true) 切换为多选状态', () => {
    am = new ActionManager(createConfig());
    expect((am as any).isMultiSelectStatus).toBe(false);

    am.setAlwaysMultiSelect(true);
    expect((am as any).alwaysMultiSelect).toBe(true);
    expect((am as any).isMultiSelectStatus).toBe(true);

    am.setAlwaysMultiSelect(false);
    expect((am as any).alwaysMultiSelect).toBe(false);
    expect((am as any).isMultiSelectStatus).toBe(false);
  });

  test('setAlwaysMultiSelect 不能突破 disabledMultiSelect 限制', () => {
    am = new ActionManager(createConfig({ disabledMultiSelect: true }));
    am.setAlwaysMultiSelect(true);
    expect((am as any).alwaysMultiSelect).toBe(true);
    expect((am as any).isMultiSelectStatus).toBe(false);
  });

  test('disableMultiSelect() 会重置多选状态', () => {
    am = new ActionManager(createConfig({ alwaysMultiSelect: true }));
    expect((am as any).isMultiSelectStatus).toBe(true);

    am.disableMultiSelect();
    expect((am as any).disabledMultiSelect).toBe(true);
    expect((am as any).isMultiSelectStatus).toBe(false);
  });

  test('enableMultiSelect() 后若 alwaysMultiSelect=true 恢复多选状态', () => {
    am = new ActionManager(createConfig({ alwaysMultiSelect: true }));
    am.disableMultiSelect();
    expect((am as any).isMultiSelectStatus).toBe(false);

    am.enableMultiSelect();
    expect((am as any).disabledMultiSelect).toBe(false);
    expect((am as any).isMultiSelectStatus).toBe(true);
  });

  test('setGuidelines / clearGuides 代理到 dr/multiDr', () => {
    am = new ActionManager(createConfig());
    expect(() => am.setGuidelines('horizontal' as any, [10])).not.toThrow();
    expect(() => am.clearGuides()).not.toThrow();
  });

  test('select / isSelectedEl / getSelectedEl', () => {
    am = new ActionManager(createConfig());
    const el = globalThis.document.createElement('div');
    el.dataset.tmagicId = 'n1';
    am.select(el);
    expect(am.getSelectedEl()).toBe(el);
    expect(am.isSelectedEl(el)).toBe(true);
  });

  test('highlight 选中元素不高亮', () => {
    const el = globalThis.document.createElement('div');
    el.dataset.tmagicId = 'n1';
    am = new ActionManager(
      createConfig({
        getTargetElement: () => el,
      }),
    );
    am.select(el);
    am.highlight('n1');
    expect(am.getHighlightEl()).toBeUndefined();
  });

  test('getElementFromPoint 返回第一个可选中元素', async () => {
    const el = globalThis.document.createElement('div');
    el.dataset.tmagicId = 'n1';
    am = new ActionManager(
      createConfig({
        getElementsFromPoint: () => [el],
        canSelect: () => true,
      }),
    );
    const result = await am.getElementFromPoint(mouseAtOrigin());
    expect(result).toBe(el);
  });

  test('canMultiSelect 在 page 元素上返回 false 并 stop', () => {
    am = new ActionManager(createConfig({ alwaysMultiSelect: true }));
    const pageEl = globalThis.document.createElement('div');
    pageEl.className = 'magic-ui-page';
    let stopped = false;
    expect(am.canMultiSelect(pageEl, () => (stopped = true))).toBe(false);
    expect(stopped).toBe(true);
  });

  test('multiSelect 收集目标元素', () => {
    const el = globalThis.document.createElement('div');
    el.dataset.tmagicId = 'n1';
    am = new ActionManager(
      createConfig({
        getTargetElement: (id) => (id === 'n1' ? el : null),
      }),
    );
    am.multiSelect(['n1']);
    expect(am.getSelectedElList()).toEqual([el]);
  });

  test('destroy 清理实例', () => {
    am = new ActionManager(createConfig());
    expect(() => am?.destroy()).not.toThrow();
    am = null;
  });
});

describe('ActionManager - 交互与事件', () => {
  let am: ActionManager | null = null;

  beforeEach(() => {
    globalThis.document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    am?.destroy();
    am = null;
    vi.useRealTimers();
  });

  test('highlight 派发 highlight 事件', () => {
    const el = globalThis.document.createElement('div');
    el.dataset.tmagicId = 'h1';
    el.style.cssText = 'position:absolute;width:10px;height:10px;';
    globalThis.document.body.appendChild(el);
    am = new ActionManager(
      createConfig({
        getTargetElement: () => el,
      }),
    );
    const fn = vi.fn();
    am.on('highlight', fn);
    am.highlight('h1');
    expect(fn).toHaveBeenCalledWith(el);
  });

  test('getNextElementFromPoint 跳过第一个可选中元素', async () => {
    const el1 = globalThis.document.createElement('div');
    el1.dataset.tmagicId = 'n1';
    const el2 = globalThis.document.createElement('div');
    el2.dataset.tmagicId = 'n2';
    am = new ActionManager(
      createConfig({
        getElementsFromPoint: () => [el1, el2],
        canSelect: () => true,
      }),
    );
    const result = await am.getNextElementFromPoint(mouseAtOrigin());
    expect(result).toBe(el2);
  });

  test('delayedMarkContainer 延迟高亮容器', async () => {
    const containerEl = globalThis.document.createElement('div');
    containerEl.dataset.tmagicId = 'container_1';
    am = new ActionManager(
      createConfig({
        containerHighlightType: ContainerHighlightType.DEFAULT,
        getElementsFromPoint: () => [containerEl],
        isContainer: async () => true,
      }),
    );
    const id = am.delayedMarkContainer(mouseAtOrigin());
    expect(id).toBeDefined();
    vi.advanceTimersByTime(900);
    await Promise.resolve();
    expect(containerEl.classList.contains('tmagic-stage-container-highlight')).toBe(true);
  });

  test('updateMoveableOptions / getDragStatus 可调用', () => {
    am = new ActionManager(createConfig());
    expect(() => am.updateMoveableOptions()).not.toThrow();
    expect(am.getDragStatus()).toBeDefined();
  });

  test('moveableOptions 为函数时会注入选中上下文', () => {
    const el = globalThis.document.createElement('div');
    el.dataset.tmagicId = 'opt';
    const optionsFn = vi.fn(() => ({ draggable: false }));
    am = new ActionManager(createConfig({ moveableOptions: optionsFn }));
    am.select(el);
    am.updateMoveable(el);
    expect(optionsFn).toHaveBeenCalled();
  });

  test('dblclick / mouseleave 事件透传', () => {
    am = new ActionManager(createConfig());
    const dbl = vi.fn();
    const leave = vi.fn();
    am.on('dblclick', dbl);
    am.on('mouseleave', leave);
    am.container.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    am.container.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    expect(dbl).toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(leave).toHaveBeenCalled();
  });

  test('dr 触发 remove / select-parent / rerender 事件', () => {
    am = new ActionManager(createConfig());
    const removeFn = vi.fn();
    const parentFn = vi.fn();
    const rerenderFn = vi.fn();
    am.on('remove', removeFn);
    am.on('select-parent', parentFn);
    am.on('rerender', rerenderFn);

    const el = globalThis.document.createElement('div');
    el.dataset.tmagicId = 'rm';
    el.style.cssText = 'position:absolute;width:10px;height:10px;';
    globalThis.document.body.appendChild(el);
    am.select(el);

    (am as any).dr?.emit(AbleActionEventType.REMOVE);
    (am as any).dr?.emit(AbleActionEventType.SELECT_PARENT);
    (am as any).dr?.emit(AbleActionEventType.RERENDER);
    expect(removeFn).toHaveBeenCalled();
    expect(parentFn).toHaveBeenCalled();
    expect(rerenderFn).toHaveBeenCalled();
  });

  test('wheel 事件清除高亮', async () => {
    const el = globalThis.document.createElement('div');
    el.dataset.tmagicId = 'w1';
    el.style.cssText = 'position:absolute;width:10px;height:10px;';
    globalThis.document.body.appendChild(el);
    am = new ActionManager(
      createConfig({
        getTargetElement: () => el,
        getElementsFromPoint: () => [el],
      }),
    );
    am.highlight('w1');
    am.container.dispatchEvent(new WheelEvent('wheel', { bubbles: true }));
    expect(am.getHighlightEl()).toBeUndefined();
  });

  test('addContainerHighlightClassName 支持 canDropIn 重定向', async () => {
    const containerEl = globalThis.document.createElement('div');
    containerEl.dataset.tmagicId = 'outer';
    const innerEl = globalThis.document.createElement('div');
    innerEl.dataset.tmagicId = 'inner';
    am = new ActionManager(
      createConfig({
        containerHighlightType: ContainerHighlightType.DEFAULT,
        getElementsFromPoint: () => [containerEl],
        isContainer: async () => true,
        canDropIn: () => 'inner',
        getTargetElement: (id) => (id === 'inner' ? innerEl : null),
      }),
    );
    await am.addContainerHighlightClassName(mouseAtOrigin(), []);
    expect(innerEl.classList.contains('tmagic-stage-container-highlight')).toBe(true);
  });

  test('addContainerHighlightClassName canDropIn 返回 false 跳过高亮', async () => {
    const containerEl = globalThis.document.createElement('div');
    containerEl.dataset.tmagicId = 'blocked';
    am = new ActionManager(
      createConfig({
        getElementsFromPoint: () => [containerEl],
        isContainer: async () => true,
        canDropIn: () => false,
      }),
    );
    await am.addContainerHighlightClassName(mouseAtOrigin(), []);
    expect(containerEl.classList.contains('tmagic-stage-container-highlight')).toBe(false);
  });

  test('highlight getTargetElement 异常时清除高亮', () => {
    am = new ActionManager(
      createConfig({
        getTargetElement: () => {
          throw new Error('fail');
        },
      }),
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    am.highlight('bad');
    expect(am.getHighlightEl()).toBeUndefined();
    warn.mockRestore();
  });

  test('getMoveableOption 多选时返回 multiDr 配置', () => {
    const el = globalThis.document.createElement('div');
    el.dataset.tmagicId = 'm1';
    el.style.cssText = 'position:absolute;width:10px;height:10px;';
    globalThis.document.body.appendChild(el);
    am = new ActionManager(
      createConfig({
        moveableOptions: { draggable: true },
        getTargetElement: (id) => (id === 'm1' ? el : null),
      }),
    );
    am.multiSelect(['m1']);
    expect(am.getMoveableOption('draggable' satisfies keyof MoveableOptions)).toBeDefined();
  });

  test('isElCanSelect 多选状态下走 canMultiSelect', async () => {
    const el1 = globalThis.document.createElement('div');
    el1.dataset.tmagicId = 'ms1';
    el1.style.cssText = 'position:absolute;width:10px;height:10px;';
    const el2 = globalThis.document.createElement('div');
    el2.dataset.tmagicId = 'ms2';
    el2.style.cssText = 'position:absolute;width:10px;height:10px;';
    globalThis.document.body.append(el1, el2);
    am = new ActionManager(createConfig({ alwaysMultiSelect: true }));
    am.select(el1);
    const stop = vi.fn();
    expect(await am.isElCanSelect(el2, new MouseEvent('click'), stop)).toBe(true);
  });

  test('multiDr update 事件透传为 multi-update', () => {
    am = new ActionManager(createConfig());
    const fn = vi.fn();
    am.on('multi-update', fn);
    (am as any).multiDr?.emit('update', { data: [], parentEl: null });
    expect(fn).toHaveBeenCalled();
  });
});
