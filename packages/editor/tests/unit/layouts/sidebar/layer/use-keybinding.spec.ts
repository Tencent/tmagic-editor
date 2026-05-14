/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { effectScope, nextTick, shallowRef } from 'vue';

import { useKeybinding } from '@editor/layouts/sidebar/layer/use-keybinding';

const mkServices = () => {
  const handlers: Record<string, () => void> = {};
  const keybindingService = {
    registerCommand: vi.fn((name: string, fn: () => void) => {
      handlers[name] = fn;
    }),
    register: vi.fn(),
    registerEl: vi.fn(),
    unregisterEl: vi.fn(),
    handlers,
  };
  return { keybindingService };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useKeybinding (layer)', () => {
  test('注册 keyup/keydown 命令并切换 isCtrlKeyDown', () => {
    const services = mkServices();
    const container = shallowRef(null);
    const { isCtrlKeyDown } = useKeybinding(services as any, container as any);
    expect(services.keybindingService.registerCommand).toHaveBeenCalledTimes(2);
    expect(services.keybindingService.register).toHaveBeenCalled();
    services.keybindingService.handlers['layer-panel-global-keydown']();
    expect(isCtrlKeyDown.value).toBe(true);
    services.keybindingService.handlers['layer-panel-global-keyup']();
    expect(isCtrlKeyDown.value).toBe(false);
  });

  test('container 存在时注册 blur 事件并 registerEl', async () => {
    const services = mkServices();
    const $el = document.createElement('div');
    const container = shallowRef({ $el });
    const addSpy = vi.spyOn(globalThis, 'addEventListener');
    const scope = effectScope();
    scope.run(() => useKeybinding(services as any, container as any));
    await nextTick();
    expect(services.keybindingService.registerEl).toHaveBeenCalledWith('layer-panel', $el);
    expect(addSpy).toHaveBeenCalledWith('blur', expect.any(Function));
    addSpy.mockRestore();
    scope.stop();
  });

  test('container 设为 null 时 unregisterEl 并移除 blur', async () => {
    const services = mkServices();
    const $el = document.createElement('div');
    const container = shallowRef({ $el } as any);
    const removeSpy = vi.spyOn(globalThis, 'removeEventListener');
    const scope = effectScope();
    scope.run(() => useKeybinding(services as any, container as any));
    await nextTick();
    container.value = null;
    await nextTick();
    expect(services.keybindingService.unregisterEl).toHaveBeenCalledWith('layer-panel');
    expect(removeSpy).toHaveBeenCalledWith('blur', expect.any(Function));
    removeSpy.mockRestore();
    scope.stop();
  });
});
