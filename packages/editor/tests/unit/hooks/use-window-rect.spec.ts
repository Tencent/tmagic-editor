/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import { useWindowRect } from '@editor/hooks/use-window-rect';

describe('useWindowRect', () => {
  test('返回当前 innerWidth/innerHeight，并随 resize 同步', async () => {
    let api: ReturnType<typeof useWindowRect> | undefined;
    const comp = defineComponent({
      setup() {
        api = useWindowRect();
        return () => h('div');
      },
    });
    const wrapper = mount(comp);
    expect(api?.rect.width).toBe(globalThis.innerWidth);
    expect(api?.rect.height).toBe(globalThis.innerHeight);

    Object.defineProperty(globalThis, 'innerWidth', { configurable: true, value: 1234 });
    Object.defineProperty(globalThis, 'innerHeight', { configurable: true, value: 567 });
    globalThis.dispatchEvent(new Event('resize'));
    expect(api?.rect.width).toBe(1234);
    expect(api?.rect.height).toBe(567);
    wrapper.unmount();
  });
});
