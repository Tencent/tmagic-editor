/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';

import { setIdToEl } from '@tmagic/core';

import { Mode, ZIndex } from '../../src/const';
import TargetShadow from '../../src/TargetShadow';

const createTarget = (id = 'n1') => {
  const el = globalThis.document.createElement('div');
  el.style.cssText = 'position:absolute;left:10px;top:20px;width:50px;height:40px;';
  setIdToEl()(el, id);
  return el;
};

afterEach(() => {
  globalThis.document.body.innerHTML = '';
});

describe('TargetShadow', () => {
  test('update 创建并挂载 shadow 元素', () => {
    const container = globalThis.document.createElement('div');
    globalThis.document.body.appendChild(container);
    const shadow = new TargetShadow({ container, zIndex: ZIndex.DRAG_EL });

    const result = shadow.update(createTarget('a'));
    expect(result).toBeTruthy();
    expect(container.children.length).toBe(1);

    shadow.destroy();
  });

  test('updateGroup 同步多选 shadow 列表', () => {
    const container = globalThis.document.createElement('div');
    globalThis.document.body.appendChild(container);
    const shadow = new TargetShadow({ container });

    shadow.updateGroup([createTarget('a'), createTarget('b')]);
    expect(shadow.els).toHaveLength(2);

    shadow.updateGroup([createTarget('c')]);
    expect(shadow.els).toHaveLength(1);

    shadow.destroy();
  });

  test('customScroll 事件会更新 fixed/absolute 模式的 transform', () => {
    const container = globalThis.document.createElement('div');
    container.dataset.mode = Mode.ABSOLUTE;
    globalThis.document.body.appendChild(container);
    const updateDragEl = vi.fn();
    const shadow = new TargetShadow({ container, updateDragEl, idPrefix: 'test' });

    const target = createTarget('fixed-node');
    target.style.position = 'fixed';
    shadow.update(target);

    container.dispatchEvent(new CustomEvent('customScroll', { detail: { scrollLeft: 30, scrollTop: 40 } }));
    shadow.update(target);

    expect(updateDragEl).toHaveBeenCalled();
    shadow.destroy();
  });

  test('destroyEl / destroyEls / destroy 清理节点', () => {
    const container = globalThis.document.createElement('div');
    globalThis.document.body.appendChild(container);
    const shadow = new TargetShadow({ container });

    shadow.update(createTarget('a'));
    shadow.updateGroup([createTarget('b')]);
    shadow.destroyEl();
    expect(shadow.el).toBeUndefined();

    shadow.updateGroup([createTarget('c')]);
    shadow.destroyEls();
    expect(shadow.els).toHaveLength(0);

    shadow.update(createTarget('d'));
    shadow.destroy();
    expect(container.children.length).toBe(0);
  });
});
