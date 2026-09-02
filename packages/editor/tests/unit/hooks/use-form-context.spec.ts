/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';
import { computed, type ComputedRef, defineComponent, h, provide, ref } from 'vue';
import { mount } from '@vue/test-utils';

import { FORM_CONTEXT_KEY, type FormContext } from '@tmagic/form';

import { useEditorFormContext } from '@editor/hooks/use-form-context';
import type { Services } from '@editor/type';

const makeServices = (stage: any = { name: 'stage' }): Services =>
  ({
    editorService: { get: (key: string) => (key === 'stage' ? stage : undefined) },
    propsService: {},
  }) as unknown as Services;

/**
 * 在组件 setup 里调用 hook 并把结果取出来，可选地先在外层 provide 宿主上下文。
 */
const setup = (getServices: () => Services | undefined, hostContext?: ComputedRef<FormContext>) => {
  let context: ComputedRef<FormContext> | undefined;

  const inner = defineComponent({
    setup() {
      context = useEditorFormContext(getServices);
      return () => h('div');
    },
  });

  const outer = defineComponent({
    setup() {
      if (hostContext) provide(FORM_CONTEXT_KEY, hostContext);
      return () => h(inner);
    },
  });

  mount(outer);

  return context!;
};

describe('useEditorFormContext', () => {
  test('没有宿主上下文时只提供 services 与 stage', () => {
    const stage = { name: 'stage-1' };
    const context = setup(() => makeServices(stage)) as any;

    expect(context.value.services.editorService).toBeDefined();
    expect(context.value.stage).toBe(stage);
  });

  test('getServices 返回 undefined 时不抛错', () => {
    const context = setup(() => undefined) as any;

    expect(context.value.services).toBeUndefined();
    expect(context.value.stage).toBeUndefined();
  });

  test('stage 读时求值，切换画布后拿到新实例', () => {
    const stage = ref<any>({ name: 'stage-1' });
    const context = setup(() => makeServices(stage.value)) as any;

    expect(context.value.stage).toEqual({ name: 'stage-1' });
    stage.value = { name: 'stage-2' };
    expect(context.value.stage).toEqual({ name: 'stage-2' });
  });

  test('合并宿主在外层 provide 的上下文，宿主字段不被遮蔽', () => {
    const host = computed(() => ({ username: 'alice', $store: { getters: {} } }) as unknown as FormContext);
    const context = setup(() => makeServices(), host) as any;

    expect(context.value.username).toBe('alice');
    expect(context.value.$store.getters).toBeDefined();
    expect(context.value.services).toBeDefined();
  });

  test('services / stage 由编辑器兜底，优先级高于宿主同名字段', () => {
    const stage = { name: 'editor-stage' };
    const host = computed(() => ({ stage: 'host-stage', services: 'host-services' }) as unknown as FormContext);
    const context = setup(() => makeServices(stage), host) as any;

    expect(context.value.stage).toBe(stage);
    expect(context.value.services).not.toBe('host-services');
  });

  /**
   * Editor.vue 已经用同一份 services 合并过，FormPanel / useCompareForm 都是它的后代。
   * 再合并一次只会多套一层 Proxy，让每次属性 miss 多一轮线性查找。
   */
  test('上层已用同一份 services 合并过时直接复用，不再套一层 Proxy', () => {
    const services = makeServices();
    const host = computed(() => ({ services, username: 'alice' }) as unknown as FormContext);
    const context = setup(() => services, host) as any;

    expect(context.value).toBe(host.value);
    expect(context.value.username).toBe('alice');
  });

  test('services 不同则仍然合并，编辑器的 services 优先', () => {
    const hostServices = makeServices();
    const ownServices = makeServices({ name: 'own-stage' });
    const host = computed(() => ({ services: hostServices }) as unknown as FormContext);
    const context = setup(() => ownServices, host) as any;

    expect(context.value).not.toBe(host.value);
    expect(context.value.services).toBe(ownServices);
  });

  test('宿主上下文里的 accessor 保持读时求值', () => {
    const counter = ref(0);
    const host = computed(
      () =>
        ({
          get buildVersion() {
            return counter.value;
          },
        }) as unknown as FormContext,
    );
    const context = setup(() => makeServices(), host) as any;

    expect(context.value.buildVersion).toBe(0);
    counter.value = 3;
    expect(context.value.buildVersion).toBe(3);
  });
});
