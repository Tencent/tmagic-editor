/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';

import NavMenuColumn from '@editor/layouts/NavMenuColumn.vue';

vi.mock('@editor/components/ToolButton.vue', () => ({
  default: defineComponent({
    name: 'ToolButton',
    props: ['data'],
    setup(props, { expose }) {
      const rootEl = ref<HTMLElement | null>(null);
      expose({ getElRef: () => rootEl });
      return () =>
        h(
          'button',
          {
            ref: rootEl,
            class: ['tool-btn', (props.data as any)?.className],
          },
          (props.data as any)?.text || '',
        );
    },
  }),
}));

vi.mock('@tmagic/design', () => ({
  TMagicButton: defineComponent({
    name: 'TMagicButton',
    props: ['icon', 'bg', 'type', 'size', 'text'],
    setup(_, { slots }) {
      return () => h('span', { class: 'tmagic-btn' }, slots.default?.());
    },
  }),
  TMagicPopover: defineComponent({
    name: 'TMagicPopover',
    props: ['placement', 'popperClass', 'width', 'visible'],
    setup(props, { slots }) {
      return () =>
        h('div', { class: 'tmagic-popover', 'data-visible': String(props.visible) }, [
          slots.reference?.(),
          h('div', { class: 'tmagic-popover-content' }, slots.default?.()),
        ]);
    },
  }),
}));

let roCallbacks: Array<(entries?: any) => void> = [];
class FakeResizeObserver {
  cb: any;
  constructor(cb: any) {
    this.cb = cb;
    roCallbacks.push(cb);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = FakeResizeObserver;

const flushRaf = async () => {
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  await nextTick();
};

beforeEach(() => {
  roCallbacks = [];
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('NavMenuColumn', () => {
  test('渲染 columnKey 对应类名与所有 ToolButton', () => {
    const items = [
      { type: 'button', className: 'a', text: 'A' },
      { type: 'button', className: 'b', text: 'B' },
    ];
    const wrapper = mount(NavMenuColumn as any, {
      props: { columnKey: 'left', items },
    });

    expect(wrapper.find('.menu-left').exists()).toBe(true);
    expect(wrapper.find('.m-editor-nav-menu-column').exists()).toBe(true);
    expect(wrapper.findAll('.tool-btn')).toHaveLength(items.length + /* overflow popover slot */ 0);
    expect(wrapper.find('.a').exists()).toBe(true);
    expect(wrapper.find('.b').exists()).toBe(true);
  });

  test('提供 width 时设置宽度样式', () => {
    const wrapper = mount(NavMenuColumn as any, {
      props: { columnKey: 'center', items: [], width: 240 },
    });
    const column = wrapper.find('.m-editor-nav-menu-column');
    expect((column.element as HTMLElement).getAttribute('style')).toContain('width: 240px');
  });

  test('未提供 width 时不设置宽度样式', () => {
    const wrapper = mount(NavMenuColumn as any, {
      props: { columnKey: 'center', items: [] },
    });
    const column = wrapper.find('.m-editor-nav-menu-column');
    const style = (column.element as HTMLElement).getAttribute('style') || '';
    expect(style).not.toContain('width');
  });

  test('始终渲染 more 按钮容器，无 overflow 时通过 hidden 类隐藏', () => {
    const wrapper = mount(NavMenuColumn as any, {
      props: { columnKey: 'left', items: [{ type: 'button', text: 'A' }] },
    });
    const moreWrapper = wrapper.find('.m-editor-nav-menu-more-wrapper');
    expect(moreWrapper.exists()).toBe(true);
    expect(moreWrapper.classes()).toContain('m-editor-nav-menu-more-wrapper-hidden');
  });

  test('点击 more 引用元素切换 popover 显示状态', async () => {
    const wrapper = mount(NavMenuColumn as any, {
      props: { columnKey: 'left', items: [{ type: 'button', text: 'A' }] },
    });

    const popover = wrapper.find('.tmagic-popover');
    expect(popover.attributes('data-visible')).toBe('false');

    await wrapper.find('.m-editor-nav-menu-more').trigger('click');
    expect(wrapper.find('.tmagic-popover').attributes('data-visible')).toBe('true');

    await wrapper.find('.m-editor-nav-menu-more').trigger('click');
    expect(wrapper.find('.tmagic-popover').attributes('data-visible')).toBe('false');
  });

  test('items 为空时仍可正常渲染，更多按钮容器隐藏', () => {
    const wrapper = mount(NavMenuColumn as any, {
      props: { columnKey: 'right', items: [] },
    });
    expect(wrapper.findAll('.tool-btn')).toHaveLength(0);
    expect(wrapper.find('.m-editor-nav-menu-more-wrapper').classes()).toContain(
      'm-editor-nav-menu-more-wrapper-hidden',
    );
  });

  test('items 变化时重置 overflow 状态（无 hidden 类）', async () => {
    const wrapper = mount(NavMenuColumn as any, {
      props: {
        columnKey: 'left',
        items: [
          { type: 'button', text: 'A' },
          { type: 'button', text: 'B' },
        ],
      },
    });

    await wrapper.setProps({
      items: [
        { type: 'button', text: 'X' },
        { type: 'button', text: 'Y' },
        { type: 'button', text: 'Z' },
      ],
    });
    await nextTick();

    const buttons = wrapper.findAll('.tool-btn');
    expect(buttons).toHaveLength(3);
    buttons.forEach((b) => {
      expect(b.classes()).not.toContain('m-editor-nav-menu-slot-hidden');
    });
  });

  test('容器宽度不足时应将溢出项标记为 hidden 并在 popover 中显示', async () => {
    const items = Array.from({ length: 5 }).map((_, i) => ({
      type: 'button',
      className: `btn-${i}`,
      text: `B${i}`,
    }));

    const wrapper = mount(NavMenuColumn as any, {
      props: { columnKey: 'left', items, width: 100 },
      attachTo: document.body,
    });

    const columnEl = wrapper.find('.m-editor-nav-menu-column').element as HTMLElement;
    Object.defineProperty(columnEl, 'clientWidth', { configurable: true, get: () => 100 });

    const moreEl = wrapper.find('.m-editor-nav-menu-more-wrapper').element as HTMLElement;
    moreEl.getBoundingClientRect = () => ({
      width: 30,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const itemEls = wrapper.findAll('.tool-btn');
    itemEls.forEach((b) => {
      const el = b.element as HTMLElement;
      el.getBoundingClientRect = () => ({
        width: 40,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });
    });

    roCallbacks.forEach((cb) => cb());
    await flushRaf();
    await flushRaf();

    const updated = wrapper.findAll('.tool-btn');
    const hiddenCount = updated.filter((b) => b.classes().includes('m-editor-nav-menu-slot-hidden')).length;
    expect(hiddenCount).toBeGreaterThan(0);

    expect(wrapper.find('.m-editor-nav-menu-more-wrapper').classes()).not.toContain(
      'm-editor-nav-menu-more-wrapper-hidden',
    );

    wrapper.unmount();
  });

  test('容器宽度足够时不隐藏任何项', async () => {
    const items = Array.from({ length: 3 }).map((_, i) => ({
      type: 'button',
      className: `btn-${i}`,
      text: `B${i}`,
    }));

    const wrapper = mount(NavMenuColumn as any, {
      props: { columnKey: 'left', items, width: 1000 },
      attachTo: document.body,
    });

    const columnEl = wrapper.find('.m-editor-nav-menu-column').element as HTMLElement;
    Object.defineProperty(columnEl, 'clientWidth', { configurable: true, get: () => 1000 });

    const moreEl = wrapper.find('.m-editor-nav-menu-more-wrapper').element as HTMLElement;
    moreEl.getBoundingClientRect = () => ({
      width: 30,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    wrapper.findAll('.tool-btn').forEach((b) => {
      const el = b.element as HTMLElement;
      el.getBoundingClientRect = () => ({
        width: 40,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });
    });

    roCallbacks.forEach((cb) => cb());
    await flushRaf();
    await flushRaf();

    wrapper.findAll('.tool-btn').forEach((b) => {
      expect(b.classes()).not.toContain('m-editor-nav-menu-slot-hidden');
    });
    expect(wrapper.find('.m-editor-nav-menu-more-wrapper').classes()).toContain(
      'm-editor-nav-menu-more-wrapper-hidden',
    );

    wrapper.unmount();
  });

  test('overflow 消失时自动关闭 popover', async () => {
    const items = Array.from({ length: 4 }).map((_, i) => ({ type: 'button', text: `B${i}` }));

    const wrapper = mount(NavMenuColumn as any, {
      props: { columnKey: 'left', items, width: 80 },
      attachTo: document.body,
    });

    const columnEl = wrapper.find('.m-editor-nav-menu-column').element as HTMLElement;
    let containerW = 80;
    Object.defineProperty(columnEl, 'clientWidth', { configurable: true, get: () => containerW });

    const moreEl = wrapper.find('.m-editor-nav-menu-more-wrapper').element as HTMLElement;
    moreEl.getBoundingClientRect = () => ({
      width: 30,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    wrapper.findAll('.tool-btn').forEach((b) => {
      const el = b.element as HTMLElement;
      el.getBoundingClientRect = () => ({
        width: 40,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });
    });

    roCallbacks.forEach((cb) => cb());
    await flushRaf();
    await flushRaf();

    await wrapper.find('.m-editor-nav-menu-more').trigger('click');
    expect(wrapper.find('.tmagic-popover').attributes('data-visible')).toBe('true');

    containerW = 1000;
    roCallbacks.forEach((cb) => cb());
    await flushRaf();
    await flushRaf();

    expect(wrapper.find('.tmagic-popover').attributes('data-visible')).toBe('false');

    wrapper.unmount();
  });

  test('卸载时清理 ResizeObserver', () => {
    const wrapper = mount(NavMenuColumn as any, {
      props: { columnKey: 'left', items: [{ type: 'button', text: 'A' }] },
    });

    const disconnectSpy = vi.fn();
    const originalDisconnect = FakeResizeObserver.prototype.disconnect;
    FakeResizeObserver.prototype.disconnect = disconnectSpy;

    wrapper.unmount();

    expect(disconnectSpy).toHaveBeenCalled();

    FakeResizeObserver.prototype.disconnect = originalDisconnect;
  });
});
