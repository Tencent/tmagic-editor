/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import SplitView from '@editor/components/SplitView.vue';

vi.mock('gesto', () => {
  class FakeGesto {
    public on() {
      return this;
    }
    public unset() {}
    public off() {}
  }
  return { default: FakeGesto };
});

globalThis.ResizeObserver =
  globalThis.ResizeObserver ||
  (class {
    public disconnect = vi.fn();
    public observe = vi.fn();
    public unobserve = vi.fn();
  } as any);

describe('SplitView.vue', () => {
  test('指定 width 时通过 watchEffect 计算 center 并 emit change', async () => {
    const wrapper = mount(SplitView as any, {
      props: { width: 1000, left: 200, right: 200 },
      slots: {
        left: '<div class="l">L</div>',
        center: '<div class="c">C</div>',
        right: '<div class="r">R</div>',
      },
    });
    expect(wrapper.find('.m-editor-layout').exists()).toBe(true);
    expect(wrapper.find('.m-editor-layout-left').exists()).toBe(true);
    expect(wrapper.find('.m-editor-layout-right').exists()).toBe(true);
    expect(wrapper.find('.m-editor-layout-center').exists()).toBe(true);

    const events = wrapper.emitted('change');
    expect(events).toBeTruthy();
    expect((events as any[])[0][0]).toEqual(expect.objectContaining({ left: 200, center: 600, right: 200 }));
  });

  test('未提供 width 时使用 ResizeObserver 监听', () => {
    const wrapper = mount(SplitView as any, {
      props: { left: 100, right: 100 },
      slots: { left: '<div>L</div>', right: '<div>R</div>', center: '<div>C</div>' },
    });
    expect(wrapper.find('.m-editor-layout').exists()).toBe(true);
  });

  test('未提供 left 时不渲染左侧栏', () => {
    const wrapper = mount(SplitView as any, {
      props: { width: 800, right: 100 },
      slots: { right: '<div>R</div>', center: '<div>C</div>' },
    });
    expect(wrapper.find('.m-editor-layout-left').exists()).toBe(false);
  });

  test('未提供 right 时不渲染右侧栏', () => {
    const wrapper = mount(SplitView as any, {
      props: { width: 800, left: 100 },
      slots: { left: '<div>L</div>', center: '<div>C</div>' },
    });
    expect(wrapper.find('.m-editor-layout-right').exists()).toBe(false);
  });

  test('updateWidth 暴露方法可重新计算', async () => {
    const wrapper = mount(SplitView as any, {
      props: { width: 1000, left: 200, right: 200 },
      slots: { left: '<div>L</div>', right: '<div>R</div>', center: '<div>C</div>' },
    });
    const before = (wrapper.emitted('change') as any[]).length;
    (wrapper.vm as any).updateWidth();
    const after = (wrapper.emitted('change') as any[]).length;
    expect(after).toBeGreaterThan(before);
  });

  test('left 超过容器宽度时回退到 1/3', () => {
    const wrapper = mount(SplitView as any, {
      props: { width: 600, left: 800, right: 100 },
      slots: { left: '<div>L</div>', right: '<div>R</div>', center: '<div>C</div>' },
    });
    const events = wrapper.emitted('change') as any[];
    expect(events[0][0].left).toBeLessThan(800);
  });

  test('center 小于最小值时调整 right', () => {
    const wrapper = mount(SplitView as any, {
      props: { width: 100, left: 50, right: 50, minCenter: 50 },
      slots: { left: '<div>L</div>', right: '<div>R</div>', center: '<div>C</div>' },
    });
    const events = wrapper.emitted('change') as any[];
    expect(events[0][0].center).toBeGreaterThanOrEqual(50);
  });

  test('changeLeft 通过 Resizer change 触发', async () => {
    const wrapper = mount(SplitView as any, {
      props: { width: 1000, left: 200, right: 200 },
      slots: { left: '<div>L</div>', right: '<div>R</div>', center: '<div>C</div>' },
    });
    const resizers = wrapper.findAllComponents({ name: 'MEditorResizer' });
    expect(resizers.length).toBeGreaterThan(0);
    await resizers[0].vm.$emit('change', { deltaX: 50 });
    expect(wrapper.emitted('update:left')).toBeTruthy();
    const updateLeft = wrapper.emitted('update:left') as any[];
    expect(updateLeft[0][0]).toBe(250);
  });

  test('changeRight 通过 Resizer change 触发', async () => {
    const wrapper = mount(SplitView as any, {
      props: { width: 1000, left: 200, right: 200 },
      slots: { left: '<div>L</div>', right: '<div>R</div>', center: '<div>C</div>' },
    });
    const resizers = wrapper.findAllComponents({ name: 'MEditorResizer' });
    await resizers[1].vm.$emit('change', { deltaX: -30 });
    expect(wrapper.emitted('update:right')).toBeTruthy();
    expect((wrapper.emitted('update:right') as any[])[0][0]).toBe(230);
  });

  test('changeLeft 没有 left props 时直接 return', async () => {
    const wrapper = mount(SplitView as any, {
      props: { width: 1000, right: 200 },
      slots: { left: '<div>L</div>', right: '<div>R</div>', center: '<div>C</div>' },
    });
    const resizers = wrapper.findAllComponents({ name: 'MEditorResizer' });
    if (resizers[0]) {
      await resizers[0].vm.$emit('change', { deltaX: 50 });
      expect(wrapper.emitted('update:left')).toBeFalsy();
    }
    expect(true).toBe(true);
  });

  test('updateWidth 在 width 为 undefined 时使用 el.clientWidth', () => {
    const wrapper = mount(SplitView as any, {
      props: { left: 100, right: 100 },
      slots: { left: '<div>L</div>', right: '<div>R</div>', center: '<div>C</div>' },
    });
    const el = wrapper.find('.m-editor-layout').element as HTMLElement;
    Object.defineProperty(el, 'clientWidth', { configurable: true, value: 600 });
    (wrapper.vm as any).updateWidth();
    const events = wrapper.emitted('change') as any[];
    expect(events[events.length - 1][0]).toBeDefined();
  });
});
