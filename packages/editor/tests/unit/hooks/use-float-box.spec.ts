/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { computed, defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';

import { useFloatBox } from '@editor/hooks/use-float-box';

const setup = (slideKeys: ReturnType<typeof computed<string[]>>) => {
  let captured: any;
  const comp = defineComponent({
    setup() {
      captured = useFloatBox(slideKeys);
      return () => h('div');
    },
  });
  const wrapper = mount(comp, {
    global: {
      provide: {
        services: {
          uiService: {
            get: (k: string) => (k === 'navMenuRect' ? { top: 5, height: 10 } : undefined),
          },
        },
      },
    },
  });
  return { wrapper, ...captured } as any;
};

describe('useFloatBox', () => {
  test('初始化为每个 key 创建状态', () => {
    const keys = computed(() => ['a', 'b']);
    const { floatBoxStates } = setup(keys);
    expect(floatBoxStates.value.a).toMatchObject({ status: false, top: 0, left: 0 });
    expect(floatBoxStates.value.b).toMatchObject({ status: false, top: 0, left: 0 });
  });

  test('未拖拽时 dragend 不会修改状态', () => {
    const keys = computed(() => ['a']);
    const { floatBoxStates, dragendHandler } = setup(keys);
    dragendHandler('a', { clientX: 100, clientY: 100 } as any);
    expect(floatBoxStates.value.a.status).toBe(false);
  });

  test('拖拽距离超过阈值时打开 float box', () => {
    const keys = computed(() => ['a']);
    const { floatBoxStates, dragstartHandler, dragendHandler } = setup(keys);
    dragstartHandler({ clientX: 0, clientY: 0 } as any);
    dragendHandler('a', { clientX: 50, clientY: 50 } as any);
    expect(floatBoxStates.value.a).toMatchObject({ status: true, top: 15, left: 50 });
  });

  test('拖拽距离不足时不会打开', () => {
    const keys = computed(() => ['a']);
    const { floatBoxStates, dragstartHandler, dragendHandler } = setup(keys);
    dragstartHandler({ clientX: 10, clientY: 10 } as any);
    dragendHandler('a', { clientX: 12, clientY: 12 } as any);
    expect(floatBoxStates.value.a.status).toBe(false);
  });

  test('showingBoxKeys 反映当前打开状态', async () => {
    const keys = computed(() => ['a', 'b']);
    const { floatBoxStates, showingBoxKeys } = setup(keys);
    floatBoxStates.value.a.status = true;
    await nextTick();
    expect(showingBoxKeys.value).toContain('a');
  });

  test('slideKeys 增加时补齐状态', async () => {
    const keys = ref<string[]>(['a']);
    const { floatBoxStates } = setup(computed(() => keys.value));
    keys.value = ['a', 'b'];
    await nextTick();
    expect(floatBoxStates.value.b).toBeDefined();
  });
});
