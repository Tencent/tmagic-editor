/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { nextTick, reactive, ref } from 'vue';

import { useStylePanel } from '@editor/layouts/props-panel/use-style-panel';

const mkServices = (storageInit?: any) => {
  const uiState: Record<string, any> = reactive({
    frameworkRect: { width: 1280 },
    showStylePanel: true,
    columnWidth: { right: 400, center: 800, left: 200 },
  });
  const uiService = {
    get: vi.fn((k: string) => uiState[k]),
    set: vi.fn((k: string, v: any) => {
      uiState[k] = v;
    }),
  };
  const storageService = {
    getItem: vi.fn(() => storageInit),
    setItem: vi.fn(),
  };
  return { uiService, storageService, uiState };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useStylePanel', () => {
  test('storage 中 showStylePanel 为 boolean 时同步 ui', () => {
    const { uiService, storageService } = mkServices(false);
    useStylePanel({ uiService, storageService } as any, ref(300));
    expect(uiService.set).toHaveBeenCalledWith('showStylePanel', false);
  });

  test('frameworkRect.width >= 1280 时 toggleButton=true', () => {
    const { uiService, storageService } = mkServices();
    const { showStylePanelToggleButton, showStylePanel } = useStylePanel(
      { uiService, storageService } as any,
      ref(300),
    );
    expect(showStylePanelToggleButton.value).toBe(true);
    expect(showStylePanel.value).toBe(true);
  });

  test('frameworkRect.width < 1280 时 toggleButton=false 并 showStylePanel=false', () => {
    const { uiService, storageService, uiState } = mkServices();
    uiState.frameworkRect = { width: 800 };
    const { showStylePanelToggleButton, showStylePanel } = useStylePanel(
      { uiService, storageService } as any,
      ref(300),
    );
    expect(showStylePanelToggleButton.value).toBe(false);
    expect(showStylePanel.value).toBe(false);
  });

  test('toggleStylePanel(true) 增加 right/减少 center', () => {
    const { uiService, storageService, uiState } = mkServices();
    const { toggleStylePanel } = useStylePanel({ uiService, storageService } as any, ref(100));
    toggleStylePanel(true);
    expect(uiService.set).toHaveBeenCalledWith('showStylePanel', true);
    expect(uiState.columnWidth.right).toBe(500);
    expect(uiState.columnWidth.center).toBe(700);
    expect(storageService.setItem).toHaveBeenCalled();
  });

  test('toggleStylePanel(false) 减少 right/增加 center', () => {
    const { uiService, storageService, uiState } = mkServices();
    const { toggleStylePanel } = useStylePanel({ uiService, storageService } as any, ref(100));
    toggleStylePanel(false);
    expect(uiState.columnWidth.right).toBe(300);
    expect(uiState.columnWidth.center).toBe(900);
  });

  test('toggleStylePanel(true) 中心列不足时收缩 right 并更新 panel 宽度', () => {
    const { uiService, storageService, uiState } = mkServices();
    uiState.columnWidth = { right: 400, center: 50, left: 200 };
    const w = ref(100);
    const { toggleStylePanel } = useStylePanel({ uiService, storageService } as any, w);
    toggleStylePanel(true);
    expect(uiState.columnWidth.center).toBe(400);
    expect(w.value).toBeGreaterThan(0);
  });

  test('frameworkRect 变化时若 right 不足则收起 stylePanel', async () => {
    const { uiService, storageService, uiState } = mkServices();
    uiState.columnWidth = { right: 50, center: 1000, left: 200 };
    const w = ref(100);
    useStylePanel({ uiService, storageService } as any, w);
    uiService.set.mockClear();
    storageService.setItem.mockClear();
    uiState.frameworkRect = { width: 1500 };
    await nextTick();
    expect(uiService.set).toHaveBeenCalledWith('showStylePanel', false);
  });
});
