/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import UISelect from '@editor/fields/UISelect.vue';

const editorService = {
  get: vi.fn(),
  set: vi.fn(),
  select: vi.fn(),
  highlight: vi.fn(),
  getNodeById: vi.fn((id: any) => ({ name: `name_${id}` })),
};
const stage = { select: vi.fn(), highlight: vi.fn(), clearHighlight: vi.fn() };
const overlayStage = { select: vi.fn(), highlight: vi.fn(), clearHighlight: vi.fn() };
const uiService = { set: vi.fn() };
const stageOverlayService = { get: vi.fn(() => overlayStage) };

editorService.get.mockImplementation((k: string) => (k === 'stage' ? stage : null));

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ editorService, uiService, stageOverlayService }),
}));

vi.mock('@tmagic/utils', async () => {
  const actual = await vi.importActual<any>('@tmagic/utils');
  return { ...actual, getIdFromEl: () => (el: any) => el?.dataset?.tmagicId };
});

vi.mock('@tmagic/design', () => ({
  TMagicButton: defineComponent({
    name: 'TMagicButton',
    props: ['type', 'icon', 'disabled', 'size', 'link'],
    emits: ['click', 'mouseenter', 'mouseleave'],
    setup(_p, { emit, slots }) {
      return () =>
        h(
          'button',
          {
            onClick: (e: Event) => emit('click', e),
            onMouseenter: () => emit('mouseenter'),
            onMouseleave: () => emit('mouseleave'),
          },
          slots.default?.(),
        );
    },
  }),
  TMagicTooltip: defineComponent({
    name: 'TMagicTooltip',
    props: ['content', 'placement'],
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-tooltip' }, slots.default?.());
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  editorService.get.mockImplementation((k: string) => (k === 'stage' ? stage : null));
});

const baseProps = (extra: any = {}) => ({
  config: { type: 'ui-select' },
  name: 'to',
  prop: 'to',
  model: { to: '' },
  size: 'default',
  ...extra,
});

describe('UISelect', () => {
  test('val 为空时显示"点击此处选择"', () => {
    const wrapper = mount(UISelect, { props: baseProps() as any });
    expect(wrapper.html()).toContain('点击此处选择');
  });

  test('val 存在时显示 toName', () => {
    const wrapper = mount(UISelect, { props: baseProps({ model: { to: 'n1' } }) as any });
    expect(wrapper.html()).toContain('name_n1_n1');
  });

  test('startSelect 启用 uiSelectMode 并注册事件', async () => {
    const addSpy = vi.spyOn(globalThis.document, 'addEventListener');
    const wrapper = mount(UISelect, { props: baseProps() as any });
    await wrapper.find('button').trigger('click');
    expect(uiService.set).toHaveBeenCalledWith('uiSelectMode', true);
    expect(addSpy).toHaveBeenCalled();
    addSpy.mockRestore();
  });

  test('cancelHandler 关闭 uiSelectMode', async () => {
    const removeSpy = vi.spyOn(globalThis.document, 'removeEventListener');
    const wrapper = mount(UISelect, { props: baseProps() as any });
    await wrapper.find('button').trigger('click');
    await wrapper.find('.m-fields-ui-select').trigger('click');
    expect(uiService.set).toHaveBeenCalledWith('uiSelectMode', false);
    expect(removeSpy).toHaveBeenCalled();
    removeSpy.mockRestore();
  });

  test('deleteHandler 触发 emit("change","")', async () => {
    const wrapper = mount(UISelect, { props: baseProps({ model: { to: 'n1' } }) as any });
    const buttons = wrapper.findAll('button');
    await buttons[0].trigger('click');
    expect(wrapper.emitted('change')?.[0]?.[0]).toBe('');
  });

  test('selectNode 调用 editorService.select 与 stage.select', async () => {
    const wrapper = mount(UISelect, { props: baseProps({ model: { to: 'n1' } }) as any });
    const buttons = wrapper.findAll('button');
    await buttons[1].trigger('click');
    expect(editorService.select).toHaveBeenCalledWith('n1');
    expect(stage.select).toHaveBeenCalledWith('n1');
    expect(overlayStage.select).toHaveBeenCalledWith('n1');
  });

  test('highlight/unhighlight', async () => {
    const wrapper = mount(UISelect, { props: baseProps({ model: { to: 'n1' } }) as any });
    const buttons = wrapper.findAll('button');
    await buttons[1].trigger('mouseenter');
    await new Promise((r) => setTimeout(r, 0));
    expect(editorService.highlight).toHaveBeenCalledWith('n1');
    await buttons[1].trigger('mouseleave');
    expect(editorService.set).toHaveBeenCalledWith('highlightNode', null);
    expect(stage.clearHighlight).toHaveBeenCalled();
    expect(overlayStage.clearHighlight).toHaveBeenCalled();
  });
});
