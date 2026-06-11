/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';

import { setIdToEl } from '@tmagic/core';

import { AbleActionEventType, GuidesType, Mode } from '../../src/const';
import MoveableOptionsManager from '../../src/MoveableOptionsManager';

class TestMoveableOptionsManager extends MoveableOptionsManager {
  public exposeGetOptions(isMultiSelect: boolean, runtimeOptions = {}) {
    return this.getOptions(isMultiSelect, runtimeOptions);
  }

  public exposeSetElementGuidelines(selected: HTMLElement[]) {
    return this.setElementGuidelines(selected);
  }

  public triggerAction(type: AbleActionEventType) {
    (this as any).actionHandler(type);
  }
}

vi.mock('../../src/MoveableActionsAble', () => ({
  default: () => ({ name: 'actions' }),
}));

afterEach(() => {
  globalThis.document.body.innerHTML = '';
});

describe('MoveableOptionsManager', () => {
  const createManager = (
    overrides: Partial<Parameters<(typeof TestMoveableOptionsManager)['prototype']['constructor']>[0]> = {},
  ) => {
    const container = globalThis.document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true });
    globalThis.document.body.appendChild(container);
    return new TestMoveableOptionsManager({
      container,
      getRootContainer: () => container,
      ...overrides,
    });
  };

  test('setGuidelines / clearGuides 触发 update-moveable', () => {
    const manager = createManager();
    const fn = vi.fn();
    manager.on('update-moveable', fn);
    manager.setGuidelines(GuidesType.HORIZONTAL, [10]);
    manager.setGuidelines(GuidesType.VERTICAL, [20]);
    manager.clearGuides();
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test('getOptions 合并默认、自定义与运行时参数', () => {
    const manager = createManager({
      moveableOptions: { draggable: false, zoom: 2 },
    });
    const options = manager.exposeGetOptions(false, { resizable: false });
    expect(options.draggable).toBe(false);
    expect(options.zoom).toBe(2);
    expect(options.resizable).toBe(false);
    expect(options.horizontalGuidelines).toEqual([]);
  });

  test('函数形式 customizedOptions 会被调用', () => {
    const customized = vi.fn(() => ({ snapGap: false }));
    const manager = createManager({ moveableOptions: customized });
    manager.exposeGetOptions(true);
    expect(customized).toHaveBeenCalled();
  });

  test('setElementGuidelines 在 ABSOLUTE 模式下创建辅助对齐元素', () => {
    const manager = createManager();
    manager.mode = Mode.ABSOLUTE;
    const selected = globalThis.document.createElement('div');
    setIdToEl()(selected, 'sel');
    selected.style.cssText = 'position:absolute;left:0;top:0;width:100px;height:100px;';

    const sibling = globalThis.document.createElement('div');
    setIdToEl()(sibling, 'other');
    sibling.style.cssText = 'position:absolute;left:120px;top:0;width:80px;height:80px;';
    const parent = globalThis.document.createElement('div');
    parent.append(selected, sibling);
    globalThis.document.body.appendChild(parent);

    Object.defineProperty(sibling, 'getBoundingClientRect', {
      value: () => ({ width: 80, height: 80, left: 120, top: 0 }),
    });

    manager.exposeSetElementGuidelines([selected]);
    const options = manager.exposeGetOptions(false);
    expect(options.elementGuidelines?.length).toBeGreaterThan(0);
  });

  test('actionHandler 会 emit AbleActionEventType', () => {
    const manager = createManager();
    const fn = vi.fn();
    manager.on(AbleActionEventType.REMOVE, fn);
    manager.triggerAction(AbleActionEventType.REMOVE);
    expect(fn).toHaveBeenCalled();
  });
});
