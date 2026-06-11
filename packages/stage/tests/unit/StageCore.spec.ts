/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { MoveableOptions } from 'moveable';

import { setIdToEl } from '@tmagic/core';

import { RenderType } from '../../src/const';
import StageCore from '../../src/StageCore';

const mouseAtOrigin = (): MouseEvent => new MouseEvent('click', { clientX: 0, clientY: 0 });

vi.mock('moveable-helper', () => ({
  default: {
    create: () => ({
      clear: vi.fn(),
      onResizeStart: vi.fn(),
      onResize: vi.fn(),
      onDragStart: vi.fn(),
      onDrag: vi.fn(),
      onRotateStart: vi.fn(),
      onRotate: vi.fn(),
      onScaleStart: vi.fn(),
      onScale: vi.fn(),
      getFrame: vi.fn(() => ({ get: vi.fn(() => 'transform(1)') })),
      getUpdatedElRect: vi.fn(() => ({ left: 0, top: 0, width: 100, height: 100 })),
    }),
  },
}));

vi.mock('moveable', () => ({
  default: class MockMoveable {
    on() {
      return this;
    }
    destroy() {}
    updateRect() {}
    dragStart() {}
  },
}));

vi.mock('@scena/guides', () => ({
  default: class MockGuides {
    on = vi.fn();
    off = vi.fn();
    destroy = vi.fn();
    resize = vi.fn();
    setState = vi.fn();
    scroll = vi.fn();
    scrollGuides = vi.fn();
  },
}));

vi.mock('@zumer/snapdom', () => ({
  snapdom: vi.fn(async () => ({
    toPng: vi.fn(async () => 'png-data'),
  })),
}));

afterEach(() => {
  globalThis.document.body.innerHTML = '';
  vi.clearAllMocks();
});

describe('StageCore', () => {
  const createStage = () => {
    const host = globalThis.document.createElement('div');
    globalThis.document.body.appendChild(host);
    const page = globalThis.document.createElement('div');
    page.className = 'magic-ui-page';
    setIdToEl()(page, 'page_1');
    page.style.cssText = 'position:relative;width:375px;height:667px;';

    const stage = new StageCore({
      renderType: RenderType.NATIVE,
      disabledRule: true,
      render: async () => page,
    });
    return { host, page, stage };
  };

  const mountRuntime = (stage: StageCore) => {
    stage.renderer?.getMagicApi().onRuntimeReady({
      add: vi.fn(),
      remove: vi.fn(),
      update: vi.fn(),
      select: vi.fn(async () => undefined),
    } as any);
  };

  test('mount 挂载 renderer 与 mask 并派发 mounted', async () => {
    const { host, stage } = createStage();
    const fn = vi.fn();
    stage.on('mounted', fn);
    await stage.mount(host);
    expect(fn).toHaveBeenCalled();
    stage.destroy();
  });

  test('select 选中节点并触发 flash', async () => {
    const { host, page, stage } = createStage();
    await stage.mount(host);
    mountRuntime(stage);
    const node = globalThis.document.createElement('div');
    setIdToEl()(node, 'btn_1');
    node.style.cssText = 'position:absolute;left:0;top:0;width:50px;height:30px;';
    page.appendChild(node);

    const selectFn = vi.fn();
    stage.on('select', selectFn);
    await stage.select('btn_1');
    expect(stage.actionManager?.getSelectedEl()).toBe(node);
    stage.destroy();
  });

  test('multiSelect / highlight / clearHighlight', async () => {
    const { host, page, stage } = createStage();
    await stage.mount(host);
    mountRuntime(stage);
    const n1 = globalThis.document.createElement('div');
    setIdToEl()(n1, 'n1');
    n1.style.cssText = 'position:absolute;width:10px;height:10px;';
    const n2 = globalThis.document.createElement('div');
    setIdToEl()(n2, 'n2');
    n2.style.cssText = 'position:absolute;width:10px;height:10px;';
    page.append(n1, n2);

    await stage.multiSelect(['n1', 'n2']);
    expect(stage.actionManager?.getSelectedElList()).toHaveLength(2);

    stage.highlight('n1');
    expect(stage.actionManager?.getHighlightEl()).toBe(n1);
    stage.clearHighlight();
    expect(stage.actionManager?.getHighlightEl()).toBeUndefined();
    stage.destroy();
  });

  test('clearGuides / setZoom / disableMultiSelect 代理到子模块', async () => {
    const { host, stage } = createStage();
    await stage.mount(host);
    stage.setZoom(1.2);
    stage.clearGuides();
    stage.disableMultiSelect();
    stage.enableMultiSelect();
    stage.setAlwaysMultiSelect(true);
    expect(stage.actionManager).toBeTruthy();
    stage.destroy();
  });

  test('destroy 清理所有子模块', async () => {
    const { host, stage } = createStage();
    await stage.mount(host);
    stage.destroy();
    expect(stage.renderer).toBeNull();
    expect(stage.mask).toBeNull();
    expect(stage.actionManager).toBeNull();
  });

  test('update / add / remove 代理 renderer', async () => {
    const { host, stage } = createStage();
    await stage.mount(host);
    mountRuntime(stage);
    const runtime = await stage.renderer!.getRuntime();
    await stage.add({ config: { id: 'a' } } as any);
    await stage.remove({ id: 'a' } as any);
    await stage.update({ config: { id: 'a' } } as any);
    expect(runtime.add).toHaveBeenCalled();
    expect(runtime.remove).toHaveBeenCalled();
    expect(runtime.update).toHaveBeenCalled();
    stage.destroy();
  });

  test('delayedMarkContainer 与 getMoveableOption 可调用', async () => {
    const { host, stage } = createStage();
    await stage.mount(host);
    expect(stage.delayedMarkContainer(mouseAtOrigin())).toBeUndefined();
    expect(stage.getMoveableOption('draggable' satisfies keyof MoveableOptions)).toBeUndefined();
    stage.destroy();
  });

  test('autoScrollIntoView 选中时调用 mask.observerIntersection', async () => {
    const host = globalThis.document.createElement('div');
    globalThis.document.body.appendChild(host);
    const page = globalThis.document.createElement('div');
    page.className = 'magic-ui-page';
    setIdToEl()(page, 'page_1');
    const node = globalThis.document.createElement('div');
    setIdToEl()(node, 'scroll-node');
    node.style.cssText = 'position:absolute;width:10px;height:10px;';
    page.appendChild(node);

    const stage = new StageCore({
      renderType: RenderType.NATIVE,
      disabledRule: true,
      autoScrollIntoView: true,
      render: async () => page,
    });
    await stage.mount(host);
    mountRuntime(stage);
    const spy = vi.spyOn(stage.mask!, 'observerIntersection');
    await stage.select('scroll-node');
    expect(spy).toHaveBeenCalledWith(node);
    stage.destroy();
  });

  test('page-el-update 触发 mask.observe 与 runtime-ready 事件', async () => {
    const { host, stage } = createStage();
    const readyFn = vi.fn();
    const pageFn = vi.fn();
    stage.on('runtime-ready', readyFn);
    stage.on('page-el-update', pageFn);
    await stage.mount(host);
    mountRuntime(stage);
    const page = globalThis.document.createElement('div');
    stage.renderer!.getMagicApi().onPageElUpdate(page);
    expect(pageFn).toHaveBeenCalledWith(page);
    expect(stage.mask?.page).toBe(page);
    stage.destroy();
  });

  test('getElementImage / reloadIframe / getAddContainerHighlightClassNameTimeout 代理', async () => {
    const { host, page, stage } = createStage();
    await stage.mount(host);
    mountRuntime(stage);
    const node = globalThis.document.createElement('div');
    setIdToEl()(node, 'img-el');
    page.appendChild(node);
    stage.renderer!.getMagicApi().onRuntimeReady({} as any);
    const img = await stage.getElementImage('img-el', 'png');
    expect(img).toBeDefined();
    expect(stage.getAddContainerHighlightClassNameTimeout(mouseAtOrigin())).toBeUndefined();
    stage.reloadIframe('');
    stage.destroy();
  });

  test('update 选中元素变更后刷新 moveable', async () => {
    vi.useFakeTimers();
    const { host, page, stage } = createStage();
    await stage.mount(host);
    mountRuntime(stage);
    const node = globalThis.document.createElement('div');
    setIdToEl()(node, 'upd');
    node.style.cssText = 'position:absolute;width:10px;height:10px;';
    page.appendChild(node);
    await stage.select('upd');
    const spy = vi.spyOn(stage.actionManager!, 'updateMoveable');
    await stage.update({ config: { id: 'upd' } } as any);
    vi.runAllTimers();
    expect(spy).toHaveBeenCalled();
    vi.useRealTimers();
    stage.destroy();
  });
});
