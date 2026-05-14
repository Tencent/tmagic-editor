/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import { useServices } from '@editor/hooks/use-services';

describe('useServices', () => {
  test('在没有 provide 时抛错', () => {
    const comp = defineComponent({
      setup() {
        useServices();
        return () => h('div');
      },
    });
    expect(() => mount(comp)).toThrow('services is required');
  });

  test('能取出 inject 的 services', () => {
    let services: any;
    const comp = defineComponent({
      setup() {
        services = useServices();
        return () => h('div');
      },
    });
    const fake = { editorService: {}, uiService: {} } as any;
    mount(comp, {
      global: {
        provide: { services: fake },
      },
    });
    expect(services).toBe(fake);
  });
});
