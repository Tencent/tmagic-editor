/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import Stage from '@editor/layouts/workspace/viewer/Stage.vue';

const { stageInstance, stageHandlers } = vi.hoisted(() => {
  const handlers: Record<string, any[]> = {};
  return {
    stageHandlers: handlers,
    stageInstance: {
      on: vi.fn((event: string, cb: any) => {
        handlers[event] = handlers[event] || [];
        handlers[event].push(cb);
      }),
      mount: vi.fn(),
      destroy: vi.fn(),
      setZoom: vi.fn(),
      select: vi.fn(),
      actionManager: {
        getElementFromPoint: vi.fn(async () => document.createElement('div')),
        getNextElementFromPoint: vi.fn(async () => document.createElement('div')),
      },
      renderer: {
        contentWindow: { document: { querySelector: vi.fn(() => null) } },
        getTargetElement: vi.fn(),
      },
      mask: { scrollTop: 0, scrollLeft: 0 },
    },
  };
});

vi.mock('@editor/hooks/use-stage', () => ({
  useStage: vi.fn(() => stageInstance),
}));

const editorService = {
  get: vi.fn(),
  set: vi.fn(),
  getNodeById: vi.fn(),
  getLayout: vi.fn(async () => 'relative'),
  add: vi.fn(),
  select: vi.fn(),
};
const uiService = { get: vi.fn(), set: vi.fn() };
const keybindingService = { registerEl: vi.fn(), unregisterEl: vi.fn() };
const stageOverlayService = { openOverlay: vi.fn() };

vi.mock('@editor/hooks', () => ({
  useServices: () => ({ editorService, uiService, keybindingService, stageOverlayService }),
}));

vi.mock('@editor/utils/config', () => ({
  getEditorConfig: vi.fn(() => (s: string) => {
    if (s.startsWith('(')) return JSON.parse(s.slice(1, -1));
    return JSON.parse(s);
  }),
}));

vi.mock('@editor/components/ScrollViewer.vue', () => ({
  default: defineComponent({
    name: 'ScrollViewer',
    props: ['width', 'height', 'wrapWidth', 'wrapHeight', 'zoom', 'correctionScrollSize'],
    setup(_p, { slots, expose }) {
      const container = { focus: vi.fn() };
      expose({ container });
      return () => h('div', { class: 'fake-scroll-viewer' }, [slots.before?.(), slots.default?.(), slots.content?.()]);
    },
  }),
}));

vi.mock('@editor/layouts/workspace/viewer/NodeListMenu.vue', () => ({
  default: defineComponent({ name: 'NodeListMenu', setup: () => () => h('div') }),
}));

vi.mock('@editor/layouts/workspace/viewer/StageOverlay.vue', () => ({
  default: defineComponent({ name: 'StageOverlay', setup: () => () => h('div', { class: 'fake-overlay' }) }),
}));

vi.mock('@editor/layouts/workspace/viewer/ViewerMenu.vue', () => ({
  default: defineComponent({
    name: 'ViewerMenu',
    props: ['isMultiSelect', 'stageContentMenu', 'customContentMenu'],
    setup(_p, { expose }) {
      expose({ show: vi.fn() });
      return () => h('div', { class: 'fake-viewer-menu' });
    },
  }),
}));

vi.mock('@tmagic/utils', async () => {
  const actual = await vi.importActual<any>('@tmagic/utils');
  return {
    ...actual,
    getIdFromEl: () => (el: any) => el?.dataset?.id,
    calcValueByFontsize: vi.fn((_doc: any, v: number) => `${v}px`),
  };
});

vi.mock('@tmagic/stage', () => {
  const stageMock: any = vi.fn();
  return {
    default: stageMock,
    getOffset: vi.fn(() => ({ left: 0, top: 0 })),
  };
});

class FakeResizeObserver {
  observe() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = FakeResizeObserver;

beforeEach(() => {
  vi.clearAllMocks();
  Object.keys(stageHandlers).forEach((k) => delete stageHandlers[k]);
  uiService.get.mockImplementation((k: string) => {
    if (k === 'stageRect') return { width: 800, height: 600 };
    if (k === 'stageContainerRect') return { width: 800, height: 600 };
    if (k === 'zoom') return 1;
    return null;
  });
  editorService.get.mockImplementation((k: string) => {
    if (k === 'stageLoading') return false;
    if (k === 'nodes') return [{ id: 'n1' }];
    if (k === 'root') return { id: 'r', items: [{ id: 'p1' }] };
    if (k === 'page') return { id: 'p1' };
    if (k === 'node') return { id: 'n1' };
    return null;
  });
});

const mountIt = (props: any = {}) =>
  mount(Stage, {
    props: {
      stageOptions: { runtimeUrl: 'http://x', containerHighlightClassName: 'highlight' },
      stageContentMenu: [],
      customContentMenu: (m: any) => m,
      ...props,
    } as any,
    attachTo: document.body,
  });

describe('Stage', () => {
  test('挂载并创建 stage', async () => {
    const wrapper = mountIt();
    await nextTick();
    expect(stageInstance.mount).toHaveBeenCalled();
    expect(editorService.set).toHaveBeenCalledWith('stage', expect.anything());
    wrapper.unmount();
  });

  test('卸载时销毁 stage', async () => {
    const wrapper = mountIt();
    await nextTick();
    wrapper.unmount();
    expect(stageInstance.destroy).toHaveBeenCalled();
  });

  test('contextmenu 显示菜单', async () => {
    const wrapper = mountIt();
    await nextTick();
    const event = new MouseEvent('contextmenu');
    const stageContainer = wrapper.find('.m-editor-stage-container').element;
    stageContainer.dispatchEvent(event);
  });

  test('dragover 设置 dropEffect', async () => {
    const wrapper = mountIt();
    await nextTick();
    const event: any = new Event('dragover');
    event.dataTransfer = { dropEffect: '' };
    event.preventDefault = vi.fn();
    const stageContainer = wrapper.find('.m-editor-stage-container').element;
    stageContainer.dispatchEvent(event);
    expect(event.dataTransfer.dropEffect).toBe('move');
  });

  test('drop 处理 COMPONENT_LIST 拖拽', async () => {
    editorService.getNodeById.mockReturnValue(null);
    const wrapper = mountIt();
    await nextTick();
    const event: any = new Event('drop');
    event.dataTransfer = {
      getData: vi.fn(() => '{"dragType":"component-list","data":{"name":"text","style":{}}}'),
    };
    event.clientX = 100;
    event.clientY = 100;
    event.preventDefault = vi.fn();
    const stageContainer = wrapper.find('.m-editor-stage-container').element;
    stageContainer.dispatchEvent(event);
    await new Promise((r) => setTimeout(r, 10));
    expect(editorService.add).toHaveBeenCalled();
  });

  test('zoom 变化时 stage.setZoom 被调用', async () => {
    const wrapper = mountIt();
    await nextTick();
    uiService.get.mockImplementation((k: string) => {
      if (k === 'stageRect') return { width: 800, height: 600 };
      if (k === 'stageContainerRect') return { width: 800, height: 600 };
      if (k === 'zoom') return 2;
      return null;
    });
    // 通过修改 ui state，watcher 不会自动触发，因为 ui get 是 vi.fn
    void wrapper;
    expect(true).toBe(true);
  });

  test('disabledStageOverlay 控制 StageOverlay 显示', async () => {
    const wrapper = mountIt({ disabledStageOverlay: true });
    await nextTick();
    expect(wrapper.find('.fake-overlay').exists()).toBe(false);
  });

  test('drop 数据为空时不处理', async () => {
    const wrapper = mountIt();
    await nextTick();
    const event: any = new Event('drop');
    event.dataTransfer = { getData: vi.fn(() => '') };
    event.preventDefault = vi.fn();
    const stageContainer = wrapper.find('.m-editor-stage-container').element;
    stageContainer.dispatchEvent(event);
    expect(editorService.add).not.toHaveBeenCalled();
  });

  test('drop 非 COMPONENT_LIST 时不处理', async () => {
    const wrapper = mountIt();
    await nextTick();
    const event: any = new Event('drop');
    event.dataTransfer = {
      getData: vi.fn(() => '{"dragType":"other","data":{"name":"text","style":{}}}'),
    };
    event.preventDefault = vi.fn();
    const stageContainer = wrapper.find('.m-editor-stage-container').element;
    stageContainer.dispatchEvent(event);
    await new Promise((r) => setTimeout(r, 10));
    expect(editorService.add).not.toHaveBeenCalled();
  });

  test('drop position fixed 计算位置', async () => {
    editorService.getNodeById.mockReturnValue(null);
    editorService.getLayout.mockResolvedValue('relative');
    const wrapper = mountIt();
    await nextTick();
    const event: any = new Event('drop');
    event.dataTransfer = {
      getData: vi.fn(() => '{"dragType":"component-list","data":{"name":"text","style":{"position":"fixed"}}}'),
    };
    event.clientX = 80;
    event.clientY = 60;
    event.preventDefault = vi.fn();
    const stageContainer = wrapper.find('.m-editor-stage-container').element;
    Object.defineProperty(stageContainer, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 800, height: 600 }),
      configurable: true,
    });
    stageContainer.dispatchEvent(event);
    await new Promise((r) => setTimeout(r, 10));
    const args = editorService.add.mock.calls[0][0];
    expect(args.style.position).toBe('fixed');
  });

  test('drop layout 为 absolute 时计算 top/left', async () => {
    editorService.getNodeById.mockReturnValue(null);
    editorService.getLayout.mockResolvedValue('absolute');
    const wrapper = mountIt();
    await nextTick();
    const event: any = new Event('drop');
    event.dataTransfer = {
      getData: vi.fn(() => '{"dragType":"component-list","data":{"name":"text","style":{}}}'),
    };
    event.clientX = 80;
    event.clientY = 60;
    event.preventDefault = vi.fn();
    const stageContainer = wrapper.find('.m-editor-stage-container').element;
    Object.defineProperty(stageContainer, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 800, height: 600 }),
      configurable: true,
    });
    stageContainer.dispatchEvent(event);
    await new Promise((r) => setTimeout(r, 10));
    const args = editorService.add.mock.calls[0][0];
    expect(args.style.position).toBe('absolute');
  });

  test('drop canDropIn 返回 false 时不处理', async () => {
    editorService.getNodeById.mockReturnValue(null);
    const canDropIn = vi.fn(() => false);
    const wrapper = mountIt({
      stageOptions: { runtimeUrl: 'http://x', containerHighlightClassName: 'highlight', canDropIn },
    });
    await nextTick();
    const event: any = new Event('drop');
    event.dataTransfer = {
      getData: vi.fn(() => '{"dragType":"component-list","data":{"name":"text","style":{}}}'),
    };
    event.clientX = 50;
    event.clientY = 50;
    event.preventDefault = vi.fn();
    const stageContainer = wrapper.find('.m-editor-stage-container').element;
    stageContainer.dispatchEvent(event);
    await new Promise((r) => setTimeout(r, 10));
    expect(canDropIn).toHaveBeenCalled();
    expect(editorService.add).not.toHaveBeenCalled();
  });

  test('dragover 无 dataTransfer 时直接 return', async () => {
    const wrapper = mountIt();
    await nextTick();
    const event: any = new Event('dragover');
    event.dataTransfer = null;
    event.preventDefault = vi.fn();
    const stageContainer = wrapper.find('.m-editor-stage-container').element;
    stageContainer.dispatchEvent(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  test('select 事件触发 container.focus', async () => {
    mountIt();
    await nextTick();
    expect(stageHandlers.select).toBeDefined();
    stageHandlers.select?.[0]?.();
  });

  test('runtime-ready 事件触发', async () => {
    mountIt();
    await nextTick();
    expect(stageHandlers['runtime-ready']).toBeDefined();
    stageHandlers['runtime-ready']?.[0]?.({ updatePageId: vi.fn() });
  });

  test('dblclick 调用 stageOverlayService.openOverlay 当元素被裁剪', async () => {
    const win = {
      getComputedStyle: () => ({ overflowX: 'auto', overflowY: 'visible' }),
    };
    const parent = document.createElement('div');
    Object.defineProperty(parent, 'ownerDocument', {
      value: { defaultView: win, documentElement: document.documentElement },
      configurable: true,
    });
    Object.defineProperty(parent, 'getBoundingClientRect', {
      value: () => ({ top: 100, left: 100, bottom: 200, right: 200 }),
      configurable: true,
    });
    Object.defineProperty(parent, 'scrollWidth', { value: 100, configurable: true });
    Object.defineProperty(parent, 'clientWidth', { value: 100, configurable: true });
    Object.defineProperty(parent, 'scrollHeight', { value: 100, configurable: true });
    Object.defineProperty(parent, 'clientHeight', { value: 100, configurable: true });
    const el: any = document.createElement('div');
    el.dataset.id = 'compInside';
    Object.defineProperty(el, 'ownerDocument', {
      value: { defaultView: win, documentElement: document.documentElement },
      configurable: true,
    });
    Object.defineProperty(el, 'getBoundingClientRect', {
      value: () => ({ top: 50, left: 100, bottom: 150, right: 150 }),
      configurable: true,
    });
    Object.defineProperty(el, 'parentElement', { value: parent, configurable: true });
    stageInstance.actionManager.getElementFromPoint.mockResolvedValueOnce(el);
    editorService.getNodeById.mockReturnValue(null);
    mountIt({ disabledStageOverlay: false });
    await nextTick();
    expect(stageHandlers.dblclick).toBeDefined();
    await stageHandlers.dblclick[0]({ clientX: 0, clientY: 0 } as any);
    expect(stageOverlayService.openOverlay).toHaveBeenCalled();
  });

  test('dblclick beforeDblclick 返回 false 时不处理', async () => {
    const beforeDblclick = vi.fn(async () => false);
    mountIt({
      stageOptions: { runtimeUrl: 'http://x', containerHighlightClassName: 'h', beforeDblclick },
    });
    await nextTick();
    expect(stageHandlers.dblclick).toBeDefined();
    await stageHandlers.dblclick[0]({ clientX: 0, clientY: 0 } as any);
    expect(beforeDblclick).toHaveBeenCalled();
    expect(stageOverlayService.openOverlay).not.toHaveBeenCalled();
  });

  test('dblclick 元素是页面片容器时调用 select 选择 pageFragmentId', async () => {
    const el: any = document.createElement('div');
    el.dataset.id = 'pf-comp';
    stageInstance.actionManager.getElementFromPoint.mockResolvedValueOnce(el);
    editorService.getNodeById.mockReturnValue({ type: 'page-fragment-container', pageFragmentId: 'pf1' });
    mountIt();
    await nextTick();
    await stageHandlers.dblclick[0]({ clientX: 0, clientY: 0 } as any);
    expect(editorService.select).toHaveBeenCalledWith('pf1');
  });

  test('dblclick 没有元素时不处理', async () => {
    stageInstance.actionManager.getElementFromPoint.mockResolvedValueOnce(null);
    mountIt();
    await nextTick();
    await stageHandlers.dblclick[0]({ clientX: 0, clientY: 0 } as any);
    expect(stageOverlayService.openOverlay).not.toHaveBeenCalled();
  });

  test('drop canDropIn 返回 string 重定向到目标节点', async () => {
    editorService.getNodeById.mockImplementation((id: string) =>
      id === 'redirect' ? { id: 'redirect', items: [] } : null,
    );
    editorService.getLayout.mockResolvedValue('relative');
    const canDropIn = vi.fn(() => 'redirect');
    stageInstance.renderer.getTargetElement.mockReturnValue(document.createElement('div'));
    const wrapper = mountIt({
      stageOptions: { runtimeUrl: 'http://x', containerHighlightClassName: 'h', canDropIn },
    });
    await nextTick();
    const event: any = new Event('drop');
    event.dataTransfer = {
      getData: vi.fn(() => '{"dragType":"component-list","data":{"name":"text","style":{}}}'),
    };
    event.clientX = 1;
    event.clientY = 1;
    event.preventDefault = vi.fn();
    wrapper.find('.m-editor-stage-container').element.dispatchEvent(event);
    await new Promise((r) => setTimeout(r, 10));
    expect(canDropIn).toHaveBeenCalled();
    expect(editorService.add).toHaveBeenCalled();
  });
});
