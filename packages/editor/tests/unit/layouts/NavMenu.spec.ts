/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import NavMenu from '@editor/layouts/NavMenu.vue';

const editorService = {
  get: vi.fn(),
  remove: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
};
const historyService = { state: { canUndo: true, canRedo: true } };
const uiService = {
  get: vi.fn(),
  set: vi.fn(),
  zoom: vi.fn(),
  calcZoom: vi.fn(async () => 0.5),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ editorService, historyService, uiService }),
}));

vi.mock('@editor/components/ToolButton.vue', () => ({
  default: defineComponent({
    name: 'ToolButton',
    props: ['data'],
    setup(props) {
      return () =>
        h(
          'button',
          {
            class: ['tool-btn', (props.data as any).className],
            onClick: () => (props.data as any).handler?.(),
          },
          (props.data as any).type === 'text' ? (props.data as any).text : '',
        );
    },
  }),
}));

vi.mock('@editor/type', async () => {
  const actual = await vi.importActual<any>('@editor/type');
  return { ...actual, ColumnLayout: { LEFT: 'left', CENTER: 'center', RIGHT: 'right' } };
});

class FakeResizeObserver {
  cb: any;
  constructor(cb: any) {
    this.cb = cb;
  }
  observe() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = FakeResizeObserver;

beforeEach(() => {
  vi.clearAllMocks();
  uiService.get.mockImplementation((k: string) => {
    if (k === 'columnWidth') return { left: 100, center: 200, right: 100 };
    if (k === 'zoom') return 1;
    if (k === 'showGuides') return true;
    if (k === 'hasGuides') return true;
    if (k === 'showRule') return true;
    return null;
  });
  editorService.get.mockReturnValue({ id: 'n1', type: 'text' });
});

describe('NavMenu', () => {
  test('支持 string 配置生成按钮', () => {
    const wrapper = mount(NavMenu, {
      props: {
        data: {
          left: ['delete', 'undo', 'redo'],
          center: ['/'],
          right: ['rule', 'guides'],
        },
      } as any,
    });
    expect(wrapper.findAll('.delete').length).toBe(1);
    expect(wrapper.findAll('.undo').length).toBe(1);
    expect(wrapper.findAll('.redo').length).toBe(1);
    expect(wrapper.findAll('.rule').length).toBe(1);
    expect(wrapper.findAll('.guides').length).toBe(1);
  });

  test('zoom 配置生成多个按钮和文本', () => {
    const wrapper = mount(NavMenu, { props: { data: { left: ['zoom'] } } as any });
    expect(wrapper.findAll('.zoom-out').length).toBe(1);
    expect(wrapper.findAll('.zoom-in').length).toBe(1);
    expect(wrapper.findAll('.scale-to-original').length).toBe(1);
    expect(wrapper.findAll('.scale-to-fit').length).toBe(1);
    expect(wrapper.text()).toContain('100%');
  });

  test('delete 按钮触发 editorService.remove', async () => {
    const wrapper = mount(NavMenu, { props: { data: { left: ['delete'] } } as any });
    await wrapper.find('.delete').trigger('click');
    expect(editorService.remove).toHaveBeenCalled();
  });

  test('undo 按钮触发 editorService.undo', async () => {
    const wrapper = mount(NavMenu, { props: { data: { left: ['undo'] } } as any });
    await wrapper.find('.undo').trigger('click');
    expect(editorService.undo).toHaveBeenCalled();
  });

  test('redo 按钮触发 editorService.redo', async () => {
    const wrapper = mount(NavMenu, { props: { data: { left: ['redo'] } } as any });
    await wrapper.find('.redo').trigger('click');
    expect(editorService.redo).toHaveBeenCalled();
  });

  test('zoom-in/out 触发 uiService.zoom', async () => {
    const wrapper = mount(NavMenu, { props: { data: { left: ['zoom'] } } as any });
    await wrapper.find('.zoom-in').trigger('click');
    expect(uiService.zoom).toHaveBeenCalledWith(0.1);
    await wrapper.find('.zoom-out').trigger('click');
    expect(uiService.zoom).toHaveBeenCalledWith(-0.1);
  });

  test('scale-to-original 触发 uiService.set zoom 1', async () => {
    const wrapper = mount(NavMenu, { props: { data: { left: ['zoom'] } } as any });
    await wrapper.find('.scale-to-original').trigger('click');
    expect(uiService.set).toHaveBeenCalledWith('zoom', 1);
  });

  test('scale-to-fit 触发 calcZoom', async () => {
    const wrapper = mount(NavMenu, { props: { data: { left: ['zoom'] } } as any });
    await wrapper.find('.scale-to-fit').trigger('click');
    await new Promise((r) => setTimeout(r, 0));
    expect(uiService.calcZoom).toHaveBeenCalled();
  });

  test('rule 切换 showRule', async () => {
    const wrapper = mount(NavMenu, { props: { data: { left: ['rule'] } } as any });
    await wrapper.find('.rule').trigger('click');
    expect(uiService.set).toHaveBeenCalledWith('showRule', false);
  });

  test('guides 切换 showGuides', async () => {
    const wrapper = mount(NavMenu, { props: { data: { left: ['guides'] } } as any });
    await wrapper.find('.guides').trigger('click');
    expect(uiService.set).toHaveBeenCalledWith('showGuides', false);
  });

  test('hasGuides 为 false 时不渲染 guides 按钮', () => {
    uiService.get.mockImplementation((k: string) => {
      if (k === 'columnWidth') return { left: 100, center: 200, right: 100 };
      if (k === 'hasGuides') return false;
      if (k === 'zoom') return 1;
      return null;
    });
    const wrapper = mount(NavMenu, { props: { data: { left: ['guides'] } } as any });
    expect(wrapper.find('.guides').exists()).toBe(false);
  });

  test('对象配置直接传递', () => {
    const wrapper = mount(NavMenu, {
      props: { data: { left: [{ type: 'button', className: 'custom', text: 'A' }] } } as any,
    });
    expect(wrapper.find('.custom').exists()).toBe(true);
  });

  test('未知字符串生成 text 配置', () => {
    const wrapper = mount(NavMenu, { props: { data: { left: ['xxxxx'] } } as any });
    expect(wrapper.text()).toContain('xxxxx');
  });
});
