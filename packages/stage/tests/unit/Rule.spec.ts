/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';

import { GuidesType } from '../../src/const';
import Rule from '../../src/Rule';

const guideInstances: any[] = [];

vi.mock('@scena/guides', () => ({
  default: class MockGuides {
    public on = vi.fn();
    public off = vi.fn();
    public destroy = vi.fn();
    public resize = vi.fn();
    public setState = vi.fn();
    public scroll = vi.fn();
    public scrollGuides = vi.fn();
    constructor() {
      guideInstances.push(this);
    }
  },
}));

afterEach(() => {
  guideInstances.length = 0;
  globalThis.document.body.innerHTML = '';
});

describe('Rule', () => {
  test('disabledRule 时不创建 guides', () => {
    const container = globalThis.document.createElement('div');
    const rule = new Rule(container, { disabledRule: true });
    expect(rule.hGuides).toBeUndefined();
    expect(rule.vGuides).toBeUndefined();
    rule.destroy();
  });

  test('setGuides / clearGuides 更新参考线并派发事件', () => {
    const container = globalThis.document.createElement('div');
    globalThis.document.body.appendChild(container);
    const rule = new Rule(container);
    const fn = vi.fn();
    rule.on('change-guides', fn);

    rule.setGuides([
      [10, 20],
      [30, 40],
    ]);
    expect(rule.horizontalGuidelines).toEqual([10, 20]);
    expect(rule.verticalGuidelines).toEqual([30, 40]);
    expect(fn).toHaveBeenCalledTimes(2);

    rule.clearGuides();
    expect(rule.horizontalGuidelines).toEqual([]);
    expect(rule.verticalGuidelines).toEqual([]);
    rule.destroy();
  });

  test('showGuides 切换显示状态', () => {
    const container = globalThis.document.createElement('div');
    const rule = new Rule(container);
    rule.showGuides(false);
    expect(guideInstances[0]?.setState).toHaveBeenCalledWith({ showGuides: false });
    rule.destroy();
  });

  test('showRule(false) 隐藏标尺，showRule(true) 重建 guides', () => {
    const container = globalThis.document.createElement('div');
    globalThis.document.body.appendChild(container);
    const rule = new Rule(container);
    const before = guideInstances.length;
    rule.showRule(false);
    rule.showRule(true);
    expect(guideInstances.length).toBeGreaterThan(before);
    rule.destroy();
  });

  test('scrollRule 调用 guides 滚动', () => {
    const container = globalThis.document.createElement('div');
    const rule = new Rule(container);
    rule.scrollRule(120);
    expect(guideInstances[0]?.scrollGuides).toHaveBeenCalled();
    rule.destroy();
  });

  test('guides changeGuides 回调会同步 horizontal/vertical 并 emit', () => {
    const container = globalThis.document.createElement('div');
    const rule = new Rule(container);
    const fn = vi.fn();
    rule.on('change-guides', fn);

    const hHandler = guideInstances[0].on.mock.calls.find((c: any[]) => c[0] === 'changeGuides')?.[1];
    hHandler?.({ guides: [5, 6] });
    expect(rule.horizontalGuidelines).toEqual([5, 6]);
    expect(fn).toHaveBeenCalledWith({ type: GuidesType.HORIZONTAL, guides: [5, 6] });
    rule.destroy();
  });
});
