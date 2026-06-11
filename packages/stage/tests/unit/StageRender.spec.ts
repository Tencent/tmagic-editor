/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';

import { setIdToEl } from '@tmagic/core';

import { RenderType } from '../../src/const';
import StageRender from '../../src/StageRender';

vi.mock('@zumer/snapdom', () => ({
  snapdom: vi.fn(async () => ({
    toPng: vi.fn(async () => 'png-data'),
    toRaw: vi.fn(async () => 'raw-data'),
  })),
}));

afterEach(() => {
  globalThis.document.body.innerHTML = '';
  // @ts-ignore
  globalThis.runtime = undefined;
  vi.clearAllMocks();
});

describe('StageRender - NATIVE', () => {
  test('NATIVE 模式 mount 后暴露 magic API', async () => {
    const host = globalThis.document.createElement('div');
    globalThis.document.body.appendChild(host);
    const page = globalThis.document.createElement('div');
    setIdToEl()(page, 'page_1');

    const renderer = new StageRender({
      renderType: RenderType.NATIVE,
      customizedRender: async () => page,
    });

    await renderer.mount(host);
    expect(host.contains(renderer.nativeContainer!)).toBe(true);
    expect(renderer.contentWindow?.magic).toBeDefined();

    const runtimeReady = vi.fn();
    renderer.on('runtime-ready', runtimeReady);
    renderer.getMagicApi().onRuntimeReady({ add: vi.fn(), update: vi.fn(), remove: vi.fn(), select: vi.fn() });
    expect(runtimeReady).toHaveBeenCalled();
    renderer.destroy();
  });

  test('getTargetElement / getElementsFromPoint', async () => {
    const host = globalThis.document.createElement('div');
    globalThis.document.body.appendChild(host);
    const page = globalThis.document.createElement('div');
    setIdToEl()(page, 'node_1');
    page.style.cssText = 'position:absolute;left:0;top:0;width:100px;height:100px;';
    globalThis.document.body.appendChild(page);
    globalThis.document.elementsFromPoint = vi.fn(() => [page]) as any;

    const renderer = new StageRender({
      renderType: RenderType.NATIVE,
      customizedRender: async () => page,
    });
    await renderer.mount(host);

    expect(renderer.getTargetElement('node_1')).toBe(page);
    const els = renderer.getElementsFromPoint({ clientX: 10, clientY: 10 });
    expect(els).toContain(page);
    renderer.destroy();
  });

  test('runtime 就绪后 add/remove/update/select 透传', async () => {
    const renderer = new StageRender({ renderType: RenderType.NATIVE });
    const runtime = {
      add: vi.fn(),
      remove: vi.fn(),
      update: vi.fn(),
      select: vi.fn(),
    };
    renderer.getMagicApi().onRuntimeReady(runtime as any);

    await renderer.add({ config: { id: 'a' } } as any);
    await renderer.remove({ id: 'a' } as any);
    await renderer.update({ config: { id: 'a' } } as any);
    await renderer.select(['a']);

    expect(runtime.add).toHaveBeenCalled();
    expect(runtime.remove).toHaveBeenCalled();
    expect(runtime.update).toHaveBeenCalled();
    expect(runtime.select).toHaveBeenCalledWith('a');
    renderer.destroy();
  });

  test('getElementImage 找不到元素时抛错', async () => {
    const renderer = new StageRender({ renderType: RenderType.NATIVE });
    await expect(renderer.getElementImage('missing')).rejects.toThrow('Element with id');
    renderer.destroy();
  });

  test('setZoom 与 getRuntime promise', async () => {
    const renderer = new StageRender({ renderType: RenderType.NATIVE, zoom: 2 });
    renderer.setZoom(1.5);
    const p = renderer.getRuntime();
    renderer.getMagicApi().onRuntimeReady({} as any);
    await expect(p).resolves.toBeDefined();
    renderer.destroy();
  });

  test('onPageElUpdate 通过 magic API 派发 page-el-update', () => {
    const renderer = new StageRender({ renderType: RenderType.NATIVE });
    const fn = vi.fn();
    renderer.on('page-el-update', fn);
    const page = globalThis.document.createElement('div');
    renderer.getMagicApi().onPageElUpdate(page);
    expect(fn).toHaveBeenCalledWith(page);
    renderer.destroy();
  });

  test('IFRAME 模式创建 iframe 并在 mount 后 postMessage', async () => {
    const host = globalThis.document.createElement('div');
    globalThis.document.body.appendChild(host);
    const renderer = new StageRender({ renderType: RenderType.IFRAME, runtimeUrl: '' });
    const postMessage = vi.fn();
    Object.defineProperty(renderer, 'postTmagicRuntimeReady', {
      value: vi.fn(function (this: StageRender) {
        this.contentWindow = { postMessage, magic: this.getMagicApi() } as any;
        postMessage();
      }),
    });

    await renderer.mount(host);
    expect(host.querySelector('iframe')).toBeTruthy();
    expect(postMessage).toHaveBeenCalled();
    renderer.destroy();
  });

  test('getElementImage 找到元素时调用 snapdom', async () => {
    const page = globalThis.document.createElement('div');
    setIdToEl()(page, 'img-node');
    globalThis.document.body.appendChild(page);
    const renderer = new StageRender({ renderType: RenderType.NATIVE });
    renderer.getMagicApi().onRuntimeReady({} as any);
    const result = await renderer.getElementImage('img-node', 'png');
    expect(result).toBe('png-data');
    renderer.destroy();
  });

  test('getElementImage 无效 type 抛错', async () => {
    const page = globalThis.document.createElement('div');
    setIdToEl()(page, 'bad-type');
    globalThis.document.body.appendChild(page);
    const renderer = new StageRender({ renderType: RenderType.NATIVE });
    renderer.getMagicApi().onRuntimeReady({} as any);
    await expect(renderer.getElementImage('bad-type', 'invalid' as any)).rejects.toThrow('Invalid type');
    renderer.destroy();
  });

  test('IFRAME getElementsFromPoint 考虑 iframe 偏移', async () => {
    const host = globalThis.document.createElement('div');
    globalThis.document.body.appendChild(host);
    const renderer = new StageRender({ renderType: RenderType.IFRAME, runtimeUrl: '' });
    await renderer.mount(host);
    const iframe = host.querySelector('iframe')!;
    const clientRect: DOMRect = {
      left: 50,
      top: 30,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      x: 50,
      y: 30,
      toJSON: () => ({}),
    };
    iframe.getClientRects = () => [clientRect];
    renderer.contentWindow = {
      document: globalThis.document,
      magic: renderer.getMagicApi(),
    } as any;
    globalThis.document.elementsFromPoint = vi.fn(() => []) as any;
    renderer.getElementsFromPoint({ clientX: 100, clientY: 80 });
    expect(globalThis.document.elementsFromPoint).toHaveBeenCalled();
    renderer.destroy();
  });

  test('reloadIframe 重新挂载 iframe', async () => {
    const host = globalThis.document.createElement('div');
    globalThis.document.body.appendChild(host);
    const renderer = new StageRender({ renderType: RenderType.IFRAME, runtimeUrl: '' });
    await renderer.mount(host);
    renderer.reloadIframe('/new-runtime');
    expect(host.querySelector('iframe')).toBeTruthy();
    renderer.destroy();
  });
});
