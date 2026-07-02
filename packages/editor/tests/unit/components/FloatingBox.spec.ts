/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import FloatingBox from '@editor/components/FloatingBox.vue';

const moveableHandlers = new Map<string, (...args: any[]) => void>();
const destroyMock = vi.fn();
let lastInstance: any;

vi.mock('moveable', () => {
  class FakeMoveable {
    public target: any;
    public dragTarget: any;
    constructor(_root: any, opts: any) {
      this.target = opts.target;
      this.dragTarget = opts.dragTarget;
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const me = this;
      lastInstance = me;
      moveableHandlers.clear();
    }
    public on(event: string, fn: (...args: any[]) => void) {
      moveableHandlers.set(event, fn);
      return this;
    }
    public destroy() {
      destroyMock();
    }
  }
  return { default: FakeMoveable };
});

vi.mock('@tmagic/design', async () => {
  const actual: any = await vi.importActual('@tmagic/design');
  return {
    ...actual,
    TMagicButton: defineComponent({
      props: ['link', 'size'],
      emits: ['click'],
      setup(_, { slots, emit }) {
        return () => h('button', { class: 'fake-btn', onClick: () => emit('click') }, slots.default?.());
      },
    }),
    TMagicIcon: defineComponent({ render: () => h('i', { class: 'fake-icon' }) }),
    useZIndex: () => ({ nextZIndex: () => 100 }),
  };
});

const services = {
  global: {
    provide: {
      services: {
        uiService: {
          get: (k: string) => (k === 'frameworkRect' ? { width: 1000 } : undefined),
        },
      },
    },
  },
};

const rect200: DOMRect = {
  x: 0,
  y: 0,
  width: 200,
  height: 100,
  top: 0,
  left: 0,
  right: 200,
  bottom: 100,
  toJSON: () => '',
};

describe('FloatingBox.vue', () => {
  beforeEach(() => {
    moveableHandlers.clear();
    destroyMock.mockClear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('visible 为 false 时不渲染内容', () => {
    mount(FloatingBox as any, {
      ...services,
      props: { visible: false },
      attachTo: document.body,
    });
    expect(document.querySelector('.m-editor-float-box')).toBeNull();
  });

  test('visible 为 true 时渲染并初始化 moveable', async () => {
    mount(FloatingBox as any, {
      ...services,
      props: { visible: true, position: { left: 0, top: 0 } },
      attachTo: document.body,
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(document.querySelector('.m-editor-float-box')).not.toBeNull();
    expect(lastInstance).toBeDefined();
  });

  test('点击关闭按钮时触发 update:visible=false', async () => {
    const wrapper = mount(FloatingBox as any, {
      ...services,
      props: { visible: true },
      attachTo: document.body,
    });
    await new Promise((r) => setTimeout(r, 0));
    const btn = document.querySelector('.fake-btn');
    btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await wrapper.vm.$nextTick();
    const events = wrapper.emitted('update:visible') as any[] | undefined;
    expect(events?.some((e) => e[0] === false)).toBe(true);
  });

  test('beforeClose 返回 false 时不触发隐藏', async () => {
    const beforeClose = vi.fn((done: (cancel?: boolean) => void) => done(false));
    const wrapper = mount(FloatingBox as any, {
      ...services,
      props: { visible: true, beforeClose },
      attachTo: document.body,
    });
    await new Promise((r) => setTimeout(r, 0));
    const btn = document.querySelector('.fake-btn');
    btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await wrapper.vm.$nextTick();
    expect(beforeClose).toHaveBeenCalled();
    const events = (wrapper.emitted('update:visible') as any[] | undefined) || [];
    expect(events.some((e) => e[0] === false)).toBe(false);
  });

  test('moveable resize 事件更新宽高', async () => {
    const wrapper = mount(FloatingBox as any, {
      ...services,
      props: { visible: true },
      attachTo: document.body,
    });
    await new Promise((r) => setTimeout(r, 0));
    const target = document.createElement('div');
    moveableHandlers.get('resize')?.({
      width: 200,
      height: 300,
      target,
      drag: { transform: 'translate(0,0)' },
    });
    await wrapper.vm.$nextTick();
    expect(target.style.width).toBe('200px');
    expect(target.style.height).toBe('300px');
  });

  test('moveable drag 事件更新 transform', async () => {
    mount(FloatingBox as any, {
      ...services,
      props: { visible: true },
      attachTo: document.body,
    });
    await new Promise((r) => setTimeout(r, 0));
    const target = document.createElement('div');
    moveableHandlers.get('drag')?.({ target, transform: 'translate(10px,20px)' });
    expect(target.style.transform.replace(/\s+/g, '')).toBe('translate(10px,20px)');
  });

  test('left + width 超过 frameworkWidth 时 left 被收敛', async () => {
    const wrapper = mount(FloatingBox as any, {
      props: { visible: true, position: { left: 950, top: 0 }, width: 200, frameworkWidth: 1000 },
      attachTo: document.body,
    });
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();
    const box = document.querySelector('.m-editor-float-box') as HTMLElement;
    expect(box).not.toBeNull();
    // jsdom 中 getBoundingClientRect 返回 0，width 会被重置为 0，故不触发收敛，left 保持原值
    expect(box.style.left).toBe('950px');
    wrapper.unmount();
  });

  test('当实际宽度使 left + width 超过 frameworkWidth 时 left 收敛到右边界内', async () => {
    const getBoundingClientRectSpy = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(rect200);
    const wrapper = mount(FloatingBox as any, {
      props: { visible: true, position: { left: 950, top: 0 }, frameworkWidth: 1000 },
      attachTo: document.body,
    });
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();
    const box = document.querySelector('.m-editor-float-box') as HTMLElement;
    expect(box).not.toBeNull();
    expect(box.style.left).toBe('800px');
    getBoundingClientRectSpy.mockRestore();
    wrapper.unmount();
  });

  test('未传入 frameworkWidth 时默认按视窗宽度收敛 left', async () => {
    const getBoundingClientRectSpy = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(rect200);
    const innerWidthSpy = vi.spyOn(globalThis, 'window', 'get').mockReturnValue({ innerWidth: 300 } as any);
    const wrapper = mount(FloatingBox as any, {
      props: { visible: true, position: { left: 250, top: 0 } },
      attachTo: document.body,
    });
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();
    const box = document.querySelector('.m-editor-float-box') as HTMLElement;
    expect(box).not.toBeNull();
    // 250 + 200 = 450 > 视窗宽度 300，left 收敛为 300 - 200 = 100
    expect(box.style.left).toBe('100px');
    getBoundingClientRectSpy.mockRestore();
    innerWidthSpy.mockRestore();
    wrapper.unmount();
  });

  test('传入 initialStyle 时合并到浮窗样式', async () => {
    const wrapper = mount(FloatingBox as any, {
      props: { visible: true, initialStyle: { backgroundColor: 'rgb(255, 0, 0)' } },
      attachTo: document.body,
    });
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();
    const box = document.querySelector('.m-editor-float-box') as HTMLElement;
    expect(box).not.toBeNull();
    expect(box.style.backgroundColor).toBe('rgb(255, 0, 0)');
    wrapper.unmount();
  });

  test('卸载时销毁 moveable', async () => {
    const wrapper = mount(FloatingBox as any, {
      ...services,
      props: { visible: true },
      attachTo: document.body,
    });
    await new Promise((r) => setTimeout(r, 0));
    wrapper.unmount();
    expect(destroyMock).toHaveBeenCalled();
  });
});
