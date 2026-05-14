/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';

import StageOverlay from '@editor/layouts/workspace/viewer/StageOverlay.vue';

const stageOverlayState = {
  stageOverlayVisible: ref(true),
  wrapWidth: ref(300),
  wrapHeight: ref(200),
  stage: null as any,
};

const stageOverlayService = {
  get: vi.fn((k: string) => (stageOverlayState as any)[k]?.value ?? (stageOverlayState as any)[k]),
  set: vi.fn((k: string, v: any) => {
    if ((stageOverlayState as any)[k] && 'value' in (stageOverlayState as any)[k]) {
      (stageOverlayState as any)[k].value = v;
    } else {
      (stageOverlayState as any)[k] = v;
    }
  }),
  closeOverlay: vi.fn(),
  createStage: vi.fn(),
  updateOverlay: vi.fn(),
};

const editorState = {
  stage: ref<any>({ id: 's1' }),
};
const editorService = {
  get: vi.fn((k: string) => (editorState as any)[k]?.value ?? null),
};

const uiState = {
  zoom: ref(1),
  columnWidth: ref({ left: 100, center: 800, right: 200 }),
  frameworkRect: ref({ height: 600 }),
};
const uiService = {
  get: vi.fn((k: string) => (uiState as any)[k]?.value),
};

vi.mock('@editor/hooks/use-services', () => ({
  useServices: () => ({ stageOverlayService, editorService, uiService }),
}));

vi.mock('@editor/components/ScrollViewer.vue', () => ({
  default: defineComponent({
    name: 'FakeScrollViewer',
    props: ['width', 'height', 'wrapWidth', 'wrapHeight', 'zoom'],
    setup(_p, { slots }) {
      return () => h('div', { class: 'fake-scroll-viewer' }, slots.default?.());
    },
  }),
}));

vi.mock('@tmagic/design', () => ({
  TMagicIcon: defineComponent({
    name: 'FakeIcon',
    setup(_p, { slots, attrs }) {
      return () => h('i', { ...attrs, class: 'fake-icon' }, slots.default?.());
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  stageOverlayState.stageOverlayVisible.value = true;
  stageOverlayState.wrapWidth.value = 300;
  stageOverlayState.wrapHeight.value = 200;
  stageOverlayState.stage = null;
  editorState.stage.value = { id: 's1' };
  uiState.zoom.value = 1;
});

describe('StageOverlay.vue', () => {
  test('stageOverlayVisible 为 true 时渲染', () => {
    const wrapper = mount(StageOverlay, {
      global: {
        provide: { stageOptions: { runtimeUrl: '' } },
      },
    });
    expect(wrapper.find('.m-editor-stage-overlay').exists()).toBe(true);
  });

  test('点击关闭按钮调用 closeOverlay', async () => {
    const wrapper = mount(StageOverlay, {
      global: { provide: { stageOptions: {} } },
    });
    await wrapper.find('.fake-icon').trigger('click');
    expect(stageOverlayService.closeOverlay).toHaveBeenCalled();
  });

  test('stage 变为 null 时调用 closeOverlay', async () => {
    const wrapper = mount(StageOverlay, {
      global: { provide: { stageOptions: {} } },
    });
    editorState.stage.value = null;
    await nextTick();
    void wrapper;
    expect(stageOverlayService.closeOverlay).toHaveBeenCalled();
  });

  test('zoom 变化时调用 stage.setZoom', async () => {
    const setZoom = vi.fn();
    stageOverlayService.createStage.mockReturnValue({
      setZoom,
      mount: vi.fn(),
      destroy: vi.fn(),
      mask: { showRule: vi.fn() },
      renderer: { contentWindow: { magic: { onRuntimeReady: vi.fn() } } },
    });
    mount(StageOverlay, { global: { provide: { stageOptions: {} } }, attachTo: document.body });
    await nextTick();
    uiState.zoom.value = 2;
    await nextTick();
    expect(setZoom).toHaveBeenCalledWith(2);
  });

  test('zoom 为 0 不调用 setZoom', async () => {
    const setZoom = vi.fn();
    stageOverlayService.createStage.mockReturnValue({
      setZoom,
      mount: vi.fn(),
      destroy: vi.fn(),
      mask: { showRule: vi.fn() },
      renderer: { contentWindow: { magic: { onRuntimeReady: vi.fn() } } },
    });
    mount(StageOverlay, { global: { provide: { stageOptions: {} } }, attachTo: document.body });
    await nextTick();
    uiState.zoom.value = 0;
    await nextTick();
    expect(setZoom).not.toHaveBeenCalled();
  });

  test('stageOverlay ref 触发 createStage 与 mount', async () => {
    const onRuntimeReady = vi.fn();
    const subStage = {
      mount: vi.fn(),
      destroy: vi.fn(),
      mask: { showRule: vi.fn() },
      renderer: { contentWindow: { magic: { onRuntimeReady } } },
    };
    stageOverlayService.createStage.mockReturnValue(subStage);
    mount(StageOverlay, { global: { provide: { stageOptions: { runtimeUrl: 'a' } } }, attachTo: document.body });
    await nextTick();
    expect(stageOverlayService.createStage).toHaveBeenCalled();
    expect(subStage.mount).toHaveBeenCalled();
    expect(subStage.mask.showRule).toHaveBeenCalledWith(false);
    expect(stageOverlayService.updateOverlay).toHaveBeenCalled();
    expect(onRuntimeReady).toHaveBeenCalled();
  });

  test('卸载时销毁 stage', async () => {
    const destroy = vi.fn();
    stageOverlayState.stage = { destroy };
    const wrapper = mount(StageOverlay, { global: { provide: { stageOptions: {} } } });
    wrapper.unmount();
    expect(destroy).toHaveBeenCalled();
    expect(stageOverlayService.set).toHaveBeenCalledWith('stage', null);
  });
});
