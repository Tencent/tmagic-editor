/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import Resizer from '@editor/components/Resizer.vue';

vi.mock('gesto', () => {
  const handlers = new Map<string, (...args: any[]) => void>();
  class FakeGesto {
    public on(event: string, fn: (...args: any[]) => void) {
      handlers.set(event, fn);
      return this;
    }
    public unset() {}
  }
  (FakeGesto as any).__handlers = handlers;
  return { default: FakeGesto };
});

describe('Resizer.vue', () => {
  test('渲染 m-editor-resizer 容器', () => {
    const wrapper = mount(Resizer as any, {
      slots: { default: '<span class="inner">x</span>' },
    });
    expect(wrapper.find('.m-editor-resizer').exists()).toBe(true);
    expect(wrapper.find('.inner').exists()).toBe(true);
  });

  test('isDragging 切换时增加拖拽样式类', async () => {
    const wrapper = mount(Resizer as any);
    const gestoMod: any = (await import('gesto')).default;
    const handlers: Map<string, (...args: any[]) => void> = gestoMod.__handlers;

    handlers.get('dragStart')?.();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.m-editor-resizer').classes()).toContain('m-editor-resizer-dragging');

    handlers.get('dragEnd')?.();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.m-editor-resizer').classes()).not.toContain('m-editor-resizer-dragging');
  });
});
