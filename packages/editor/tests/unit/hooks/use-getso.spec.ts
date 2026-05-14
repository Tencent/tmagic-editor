/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick, useTemplateRef } from 'vue';
import { mount } from '@vue/test-utils';

import { useGetSo } from '@editor/hooks/use-getso';

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

describe('useGetSo', () => {
  test('挂载后注册 drag/dragStart/dragEnd', async () => {
    const comp = defineComponent({
      setup() {
        const target = useTemplateRef<HTMLDivElement>('t');
        const emit = vi.fn();
        useGetSo(target as any, emit as any);
        return () => h('div', { ref: 't' });
      },
    });
    mount(comp);
    await nextTick();
    const gestoMod: any = (await import('gesto')).default;
    const handlers: Map<string, (...args: any[]) => void> = gestoMod.__handlers;
    expect(handlers.get('drag')).toBeTypeOf('function');
    expect(handlers.get('dragStart')).toBeTypeOf('function');
    expect(handlers.get('dragEnd')).toBeTypeOf('function');
  });

  test('drag 时 emit change，dragStart/dragEnd 切换 isDragging', async () => {
    let captured: any;
    const emit = vi.fn();
    const comp = defineComponent({
      setup() {
        const target = useTemplateRef<HTMLDivElement>('t');
        captured = useGetSo(target as any, emit as any);
        return () => h('div', { ref: 't' });
      },
    });
    mount(comp);
    await nextTick();
    const gestoMod: any = (await import('gesto')).default;
    const handlers: Map<string, (...args: any[]) => void> = gestoMod.__handlers;

    handlers.get('dragStart')?.();
    expect(captured.isDragging.value).toBe(true);

    handlers.get('drag')?.({ x: 1 });
    expect(emit).toHaveBeenCalledWith('change', { x: 1 });

    handlers.get('dragEnd')?.();
    expect(captured.isDragging.value).toBe(false);
  });

  test('target 为空时不会创建 Gesto', () => {
    const comp = defineComponent({
      setup() {
        const target = useTemplateRef<HTMLDivElement>('not-exist');
        useGetSo(target as any, vi.fn());
        return () => h('div');
      },
    });
    expect(() => mount(comp)).not.toThrow();
  });
});
