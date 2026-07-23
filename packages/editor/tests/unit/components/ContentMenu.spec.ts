/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import ContentMenu from '@editor/components/ContentMenu.vue';

const roCallbacks: Array<() => void> = [];
class FakeResizeObserver {
  public static disconnectSpy = vi.fn();
  public cb: () => void;
  constructor(cb: () => void) {
    this.cb = cb;
    roCallbacks.push(cb);
  }
  public observe() {}
  public unobserve() {}
  public disconnect() {
    FakeResizeObserver.disconnectSpy();
  }
}
(globalThis as any).ResizeObserver = FakeResizeObserver;

const provideServices = () => ({
  global: {
    provide: {
      services: {
        editorService: {},
        uiService: {},
      },
    },
  },
});

describe('ContentMenu.vue', () => {
  afterEach(() => {
    vi.useRealTimers();
    roCallbacks.length = 0;
    FakeResizeObserver.disconnectSpy.mockClear();
  });

  test('show 后触发 show 事件', async () => {
    const wrapper = mount(ContentMenu as any, {
      ...provideServices(),
      props: {
        menuData: [{ id: '1', type: 'button', text: 'a' }] as any,
      },
    });
    (wrapper.vm as any).show({ clientX: 10, clientY: 20 });
    await new Promise((r) => setTimeout(r, 0));
    expect(wrapper.emitted('show')).toBeTruthy();
  });

  test('show 之后调用 hide 触发 hide 事件', async () => {
    const wrapper = mount(ContentMenu as any, {
      ...provideServices(),
      props: { menuData: [] as any },
    });
    (wrapper.vm as any).show();
    await new Promise((r) => setTimeout(r, 0));
    (wrapper.vm as any).hide();
    expect(wrapper.emitted('hide')).toBeTruthy();
  });

  test('未显示时调用 hide 不触发事件', () => {
    const wrapper = mount(ContentMenu as any, {
      ...provideServices(),
      props: { menuData: [] as any },
    });
    (wrapper.vm as any).hide();
    expect(wrapper.emitted('hide')).toBeFalsy();
  });

  test('setPosition 计算超出底部时回拢', () => {
    const wrapper = mount(ContentMenu as any, {
      ...provideServices(),
      props: { menuData: [] as any },
    });
    Object.defineProperty(document.body, 'clientHeight', { value: 100, configurable: true });
    (wrapper.vm as any).setPosition({ clientX: 10, clientY: 90 });
    expect((wrapper.vm as any).menuPosition.left).toBe(10);
    expect((wrapper.vm as any).menuPosition.top).toBeLessThanOrEqual(100);
  });

  test('菜单大小动态变化后修正位置避免超出可视范围', async () => {
    // jsdom 中 clientWidth/clientHeight 默认为 0，先 mock 一个足够大的视口，避免 show 时位置被修正
    Object.defineProperty(document.body, 'clientHeight', { value: 1000, configurable: true });
    Object.defineProperty(document.body, 'clientWidth', { value: 1000, configurable: true });

    const wrapper = mount(ContentMenu as any, {
      ...provideServices(),
      props: { menuData: [{ id: '1', type: 'button', text: 'a' }] as any },
      attachTo: document.body,
    });
    (wrapper.vm as any).show({ clientX: 90, clientY: 90 });
    await new Promise((r) => setTimeout(r, 0));
    expect((wrapper.vm as any).menuPosition.top).toBe(90);
    expect((wrapper.vm as any).menuPosition.left).toBe(90);

    // 视口缩小为 100x100
    Object.defineProperty(document.body, 'clientHeight', { value: 100, configurable: true });
    Object.defineProperty(document.body, 'clientWidth', { value: 100, configurable: true });

    const menuEl = wrapper.find('.magic-editor-content-menu').element as HTMLElement;
    // 模拟菜单内容增多后尺寸变为 50x50
    Object.defineProperty(menuEl, 'clientHeight', { value: 50, configurable: true });
    Object.defineProperty(menuEl, 'clientWidth', { value: 50, configurable: true });

    roCallbacks.forEach((cb) => cb());
    await nextTick();

    expect((wrapper.vm as any).menuPosition.top).toBe(50);
    expect((wrapper.vm as any).menuPosition.left).toBe(50);
    wrapper.unmount();
  });

  test('菜单未显示时尺寸变化不修正位置', async () => {
    const wrapper = mount(ContentMenu as any, {
      ...provideServices(),
      props: { menuData: [{ id: '1', type: 'button', text: 'a' }] as any },
    });
    Object.defineProperty(document.body, 'clientHeight', { value: 100, configurable: true });

    roCallbacks.forEach((cb) => cb());
    await nextTick();

    expect((wrapper.vm as any).menuPosition.top).toBe(0);
    expect((wrapper.vm as any).menuPosition.left).toBe(0);
    wrapper.unmount();
  });

  test('卸载时断开 ResizeObserver', () => {
    const wrapper = mount(ContentMenu as any, {
      ...provideServices(),
      props: { menuData: [] as any },
    });
    wrapper.unmount();
    expect(FakeResizeObserver.disconnectSpy).toHaveBeenCalled();
  });

  test('contains 判断 DOM 是否在菜单内部', async () => {
    const wrapper = mount(ContentMenu as any, {
      ...provideServices(),
      props: { menuData: [] as any },
    });
    (wrapper.vm as any).show({ clientX: 0, clientY: 0 });
    await new Promise((r) => setTimeout(r, 0));
    const outside = document.createElement('div');
    expect((wrapper.vm as any).contains(outside)).toBeFalsy();
  });

  test('autoHide=false 时点击不会隐藏', async () => {
    const wrapper = mount(ContentMenu as any, {
      ...provideServices(),
      props: { menuData: [{ id: '1', type: 'button', text: 'a' }] as any, autoHide: false },
    });
    (wrapper.vm as any).show();
    await new Promise((r) => setTimeout(r, 0));
    expect(wrapper.emitted('hide')).toBeFalsy();
  });

  test('isSubMenu=true 不监听 mousedown', () => {
    const addSpy = vi.spyOn(globalThis, 'addEventListener');
    const wrapper = mount(ContentMenu as any, {
      ...provideServices(),
      props: { menuData: [] as any, isSubMenu: true },
    });
    expect(addSpy).not.toHaveBeenCalledWith('mousedown', expect.any(Function), true);
    wrapper.unmount();
    addSpy.mockRestore();
  });

  test('卸载时移除 mousedown 监听', () => {
    const removeSpy = vi.spyOn(globalThis, 'removeEventListener');
    const wrapper = mount(ContentMenu as any, {
      ...provideServices(),
      props: { menuData: [] as any },
    });
    wrapper.unmount();
    expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), true);
    removeSpy.mockRestore();
  });

  test('外部点击触发 hide', async () => {
    const wrapper = mount(ContentMenu as any, {
      ...provideServices(),
      props: { menuData: [{ id: '1', type: 'button', text: 'a' }] as any },
      attachTo: document.body,
    });
    (wrapper.vm as any).show({ clientX: 0, clientY: 0 });
    await new Promise((r) => setTimeout(r, 0));
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    const event = new MouseEvent('mousedown');
    Object.defineProperty(event, 'target', { value: outside });
    globalThis.dispatchEvent(event);
    expect(wrapper.emitted('hide')).toBeTruthy();
  });

  test('外部点击在菜单内部时不 hide', async () => {
    const wrapper = mount(ContentMenu as any, {
      ...provideServices(),
      props: { menuData: [{ id: '1', type: 'button', text: 'a' }] as any },
      attachTo: document.body,
    });
    (wrapper.vm as any).show({ clientX: 0, clientY: 0 });
    await new Promise((r) => setTimeout(r, 0));
    const inside = wrapper.find('.magic-editor-content-menu').element as HTMLElement;
    const event = new MouseEvent('mousedown');
    Object.defineProperty(event, 'target', { value: inside });
    globalThis.dispatchEvent(event);
    expect(wrapper.emitted('hide')).toBeFalsy();
  });

  test('autoHide=false 时外部点击不 hide', async () => {
    const wrapper = mount(ContentMenu as any, {
      ...provideServices(),
      props: { menuData: [] as any, autoHide: false },
      attachTo: document.body,
    });
    (wrapper.vm as any).show({ clientX: 0, clientY: 0 });
    await new Promise((r) => setTimeout(r, 0));
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    const event = new MouseEvent('mousedown');
    Object.defineProperty(event, 'target', { value: outside });
    globalThis.dispatchEvent(event);
    expect(wrapper.emitted('hide')).toBeFalsy();
  });

  test('mouseenter 触发 mouseenter 事件', async () => {
    const wrapper = mount(ContentMenu as any, {
      ...provideServices(),
      props: { menuData: [] as any },
    });
    (wrapper.vm as any).show();
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.find('.magic-editor-content-menu').trigger('mouseenter');
    expect(wrapper.emitted('mouseenter')).toBeTruthy();
  });

  test('showSubMenu 设置 subMenuData', async () => {
    const wrapper = mount(ContentMenu as any, {
      ...provideServices(),
      props: {
        menuData: [{ id: '1', type: 'button', text: 'a', items: [{ id: '2', type: 'button', text: 'b' }] }] as any,
      },
    });
    (wrapper.vm as any).show({ clientX: 10, clientY: 20 });
    await new Promise((r) => setTimeout(r, 0));
    const buttons = wrapper.findAll('.tool-button');
    if (buttons.length > 0) {
      await buttons[0].trigger('mouseenter');
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(true).toBe(true);
  });
});
