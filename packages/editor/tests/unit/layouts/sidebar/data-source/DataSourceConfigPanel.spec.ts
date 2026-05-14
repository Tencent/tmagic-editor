/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';

import DataSourceConfigPanel from '@editor/layouts/sidebar/data-source/DataSourceConfigPanel.vue';

const dataSourceService = {
  getFormConfig: vi.fn(() => [{ name: 'a' }]),
};
const uiService = { get: vi.fn() };

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ uiService, dataSourceService }),
}));

vi.mock('@editor/hooks/use-editor-content-height', () => ({
  useEditorContentHeight: () => ({ height: ref(600) }),
}));

const calcBoxPosition = vi.fn();
vi.mock('@editor/hooks/use-next-float-box-position', () => ({
  useNextFloatBoxPosition: () => ({
    boxPosition: ref({ x: 100, y: 100 }),
    calcBoxPosition,
  }),
}));

vi.mock('@editor/components/FloatingBox.vue', () => ({
  default: defineComponent({
    name: 'FloatingBox',
    props: ['visible', 'width', 'height', 'title', 'position'],
    emits: ['update:visible', 'update:width', 'update:height'],
    setup(props, { slots }) {
      return () => h('div', { class: 'fake-floating', 'data-visible': String(props.visible) }, slots.body?.());
    },
  }),
}));

vi.mock('@tmagic/form', async () => {
  const actual = await vi.importActual<any>('@tmagic/form');
  return {
    ...actual,
    MFormBox: defineComponent({
      name: 'MFormBox',
      props: ['title', 'config', 'values', 'disabled'],
      emits: ['submit', 'error'],
      setup(_p, { emit }) {
        return () =>
          h('div', { class: 'fake-form-box' }, [
            h('button', { class: 'submit-btn', onClick: () => emit('submit', { id: 'a' }, { changeRecords: [] }) }),
            h('button', { class: 'error-btn', onClick: () => emit('error', new Error('xxx')) }),
          ]);
      },
    }),
  };
});

const { tMagicMessageError } = vi.hoisted(() => ({ tMagicMessageError: vi.fn() }));
vi.mock('@tmagic/design', () => ({
  tMagicMessage: { error: tMagicMessageError },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DataSourceConfigPanel', () => {
  test('show 调用 calcBoxPosition 并设置 visible', async () => {
    const wrapper = mount(DataSourceConfigPanel, {
      props: { title: 't', values: {}, disabled: false } as any,
    });
    (wrapper.vm as any).show();
    await nextTick();
    expect(calcBoxPosition).toHaveBeenCalled();
    expect(wrapper.find('.fake-floating').attributes('data-visible')).toBe('true');
  });

  test('hide 设置 visible false', async () => {
    const wrapper = mount(DataSourceConfigPanel, {
      props: { title: 't', values: {}, disabled: false } as any,
    });
    (wrapper.vm as any).show();
    await nextTick();
    (wrapper.vm as any).hide();
    await nextTick();
    expect(wrapper.find('.fake-floating').attributes('data-visible')).toBe('false');
  });

  test('submit 触发 submit 事件', async () => {
    const wrapper = mount(DataSourceConfigPanel, {
      props: { title: 't', values: {}, disabled: false } as any,
    });
    await wrapper.find('.submit-btn').trigger('click');
    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual({ id: 'a' });
  });

  test('error 调用 tMagicMessage.error', async () => {
    const wrapper = mount(DataSourceConfigPanel, {
      props: { title: 't', values: {}, disabled: false } as any,
    });
    await wrapper.find('.error-btn').trigger('click');
    expect(tMagicMessageError).toHaveBeenCalledWith('xxx');
  });

  test('boxVisible 切换为 true 且有 id 时 emit open', async () => {
    const wrapper = mount(DataSourceConfigPanel, {
      props: { title: 't', values: { id: 'd1', type: 'http' }, disabled: false } as any,
    });
    (wrapper.vm as any).show();
    await nextTick();
    await nextTick();
    expect(wrapper.emitted('open')?.[0]?.[0]).toBe('d1');
  });

  test('boxVisible 切换为 false 时 emit close', async () => {
    const wrapper = mount(DataSourceConfigPanel, {
      props: { title: 't', values: {}, disabled: false } as any,
    });
    (wrapper.vm as any).show();
    await nextTick();
    await nextTick();
    (wrapper.vm as any).hide();
    await nextTick();
    await nextTick();
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  test('values 改变时调用 getFormConfig', async () => {
    const wrapper = mount(DataSourceConfigPanel, {
      props: { title: 't', values: { type: 'http' }, disabled: false } as any,
    });
    await nextTick();
    expect(dataSourceService.getFormConfig).toHaveBeenCalledWith('http');
    await wrapper.setProps({ values: { type: 'base' } } as any);
    await nextTick();
    expect(dataSourceService.getFormConfig).toHaveBeenCalledWith('base');
  });
});
