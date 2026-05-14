/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { defineComponent, h, nextTick, reactive } from 'vue';
import { mount } from '@vue/test-utils';

import { useEditorContentHeight } from '@editor/hooks/use-editor-content-height';

describe('useEditorContentHeight', () => {
  test('计算 framework 与 navMenu 高度差', async () => {
    const state = reactive({
      frameworkRect: { height: 800 },
      navMenuRect: { height: 60 },
    });
    let captured: any;
    const comp = defineComponent({
      setup() {
        captured = useEditorContentHeight();
        return () => h('div');
      },
    });
    mount(comp, {
      global: {
        provide: {
          services: {
            uiService: {
              get: (k: string) => (state as any)[k],
            },
          },
        },
      },
    });
    expect(captured.height.value).toBe(740);

    state.navMenuRect.height = 100;
    await nextTick();
    expect(captured.height.value).toBe(700);
  });
});
