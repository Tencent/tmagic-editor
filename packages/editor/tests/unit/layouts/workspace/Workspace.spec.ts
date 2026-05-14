/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import Workspace from '@editor/layouts/workspace/Workspace.vue';

const editorService = {
  get: vi.fn(),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ editorService }),
}));

vi.mock('@editor/layouts/workspace/viewer/Stage.vue', () => ({
  default: defineComponent({
    name: 'FakeStage',
    props: ['stageOptions', 'disabledStageOverlay', 'stageContentMenu', 'customContentMenu'],
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-stage' }, [slots['stage-top']?.()]);
    },
  }),
}));

vi.mock('@editor/layouts/workspace/Breadcrumb.vue', () => ({
  default: defineComponent({
    name: 'FakeBreadcrumb',
    setup() {
      return () => h('div', { class: 'fake-breadcrumb' });
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Workspace.vue', () => {
  test('page 存在且 stageOptions 含 render 时渲染 Stage', () => {
    editorService.get.mockReturnValue({ id: 'p1' });
    const wrapper = mount(Workspace, {
      props: {
        stageContentMenu: [] as any,
        customContentMenu: ((m: any) => m) as any,
      },
      global: {
        provide: {
          stageOptions: { render: () => ({}) },
        },
      },
    });
    expect(wrapper.find('.fake-stage').exists()).toBe(true);
    expect(wrapper.find('.fake-breadcrumb').exists()).toBe(true);
  });

  test('page 不存在时不渲染 Stage', () => {
    editorService.get.mockReturnValue(null);
    const wrapper = mount(Workspace, {
      props: {
        stageContentMenu: [] as any,
        customContentMenu: ((m: any) => m) as any,
      },
      global: {
        provide: {
          stageOptions: { render: () => ({}) },
        },
      },
    });
    expect(wrapper.find('.fake-stage').exists()).toBe(false);
  });

  test('使用 stage 插槽自定义舞台', () => {
    editorService.get.mockReturnValue({ id: 'p1' });
    const wrapper = mount(Workspace, {
      props: {
        stageContentMenu: [] as any,
        customContentMenu: ((m: any) => m) as any,
      },
      slots: {
        stage: () => h('div', { class: 'custom-stage' }, 'custom'),
        'workspace-content': () => h('div', { class: 'ws-content' }, 'ws'),
      },
    });
    expect(wrapper.find('.custom-stage').exists()).toBe(true);
    expect(wrapper.find('.fake-stage').exists()).toBe(false);
    expect(wrapper.find('.ws-content').exists()).toBe(true);
  });
});
