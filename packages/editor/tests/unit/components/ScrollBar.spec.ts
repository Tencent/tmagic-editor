/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import ScrollBar from '@editor/components/ScrollBar.vue';

vi.mock('gesto', () => {
  const handlers = new Map<string, (...args: any[]) => void>();
  class FakeGesto {
    public on(event: string, fn: (...args: any[]) => void) {
      handlers.set(event, fn);
      return this;
    }
    public off() {}
  }
  (FakeGesto as any).__handlers = handlers;
  return { default: FakeGesto };
});

const baseProps = {
  size: 100,
  scrollSize: 200,
  pos: 0,
};

describe('ScrollBar.vue', () => {
  test('垂直方向渲染竖向类名', () => {
    const wrapper = mount(ScrollBar as any, { props: { ...baseProps } });
    expect(wrapper.find('.m-editor-scroll-bar').classes()).toContain('vertical');
  });

  test('水平方向渲染横向类名', () => {
    const wrapper = mount(ScrollBar as any, {
      props: { ...baseProps, isHorizontal: true },
    });
    expect(wrapper.find('.m-editor-scroll-bar').classes()).toContain('horizontal');
  });

  test('thumb 大小由 size/scrollSize 计算', () => {
    const wrapper = mount(ScrollBar as any, { props: { ...baseProps } });
    const thumb = wrapper.find('.m-editor-scroll-bar-thumb');
    const style = thumb.attributes('style') || '';
    expect(style).toContain('height');
  });

  const getHandlers = async (): Promise<Map<string, (...args: any[]) => void>> => {
    const gestoMod: any = (await import('gesto')).default;
    return gestoMod.__handlers;
  };

  test('滚动到顶部时 emit 0', async () => {
    const wrapper = mount(ScrollBar as any, { props: { ...baseProps, pos: 0 } });
    const handlers = await getHandlers();
    handlers.get('drag')?.({ deltaY: -10, deltaX: 0 });
    expect((wrapper.emitted('scroll') as any[])[0][0]).toBe(0);
  });

  test('向下滚动 emit 正值', async () => {
    const wrapper = mount(ScrollBar as any, { props: { ...baseProps, pos: 0 } });
    const handlers = await getHandlers();
    handlers.get('drag')?.({ deltaY: 5, deltaX: 0 });
    const events = wrapper.emitted('scroll') as any[];
    expect(events[events.length - 1][0]).toBeGreaterThan(0);
  });

  test('已滚动到底部时再向下 emit 0', async () => {
    const wrapper = mount(ScrollBar as any, {
      props: { size: 100, scrollSize: 100, pos: 0 },
    });
    const handlers = await getHandlers();
    handlers.get('drag')?.({ deltaY: 10, deltaX: 0 });
    const events = wrapper.emitted('scroll') as any[];
    expect(events[events.length - 1][0]).toBe(0);
  });

  test('dragStart 阻止默认事件', async () => {
    mount(ScrollBar as any, { props: { ...baseProps } });
    const handlers = await getHandlers();
    const stopPropagation = vi.fn();
    const preventDefault = vi.fn();
    handlers.get('dragStart')?.({ inputEvent: { stopPropagation, preventDefault } });
    expect(stopPropagation).toHaveBeenCalled();
    expect(preventDefault).toHaveBeenCalled();
  });
});
