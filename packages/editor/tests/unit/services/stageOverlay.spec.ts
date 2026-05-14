/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import stageOverlay from '@editor/services/stageOverlay';

const subStage = {
  destroy: vi.fn(),
  select: vi.fn(),
  multiSelect: vi.fn(),
  renderer: {
    getDocument: vi.fn(() => ({
      body: { children: [] },
      documentElement: document.createElement('html'),
      replaceChild: vi.fn(),
    })),
    contentWindow: {
      magic: { onPageElUpdate: vi.fn() },
    },
  },
};

vi.mock('@editor/hooks/use-stage', () => ({
  useStage: vi.fn(() => subStage),
}));

const editorEvents: Record<string, ((..._args: any[]) => any)[]> = {};
vi.mock('@editor/services/editor', () => ({
  default: {
    on: vi.fn((evt: string, fn: any) => {
      editorEvents[evt] ||= [];
      editorEvents[evt].push(fn);
    }),
    off: vi.fn(),
    get: vi.fn((k: string) => {
      if (k === 'nodes') return [{ id: 'n1' }];
      if (k === 'stage') {
        return {
          renderer: {
            getDocument: () => ({ documentElement: document.createElement('html') }),
          },
        };
      }
      return null;
    }),
  },
}));

vi.mock('@tmagic/utils', async () => {
  const actual = await vi.importActual<any>('@tmagic/utils');
  return { ...actual, getIdFromEl: () => () => 'el-id' };
});

beforeEach(() => {
  vi.clearAllMocks();
  Object.keys(editorEvents).forEach((k) => delete editorEvents[k]);
});

afterEach(() => {
  stageOverlay.set('sourceEl', null);
  stageOverlay.set('contentEl', null);
  stageOverlay.set('stage', null);
  stageOverlay.set('stageOverlayVisible', false);
  stageOverlay.set('stageOptions', null);
});

describe('stageOverlay', () => {
  test('get/set 状态', () => {
    stageOverlay.set('wrapWidth', 100);
    expect(stageOverlay.get('wrapWidth')).toBe(100);
  });

  test('wrapDiv 默认带类名', () => {
    expect(stageOverlay.get('wrapDiv').classList.contains('tmagic-editor-sub-stage-wrap')).toBe(true);
  });

  test('openOverlay 无 stageOptions 时无操作', () => {
    stageOverlay.set('stageOptions', null);
    const el = document.createElement('div');
    stageOverlay.openOverlay(el);
    expect(stageOverlay.get('stageOverlayVisible')).toBe(false);
  });

  test('openOverlay 有 stageOptions 时设置 visible=true 并注册事件', () => {
    stageOverlay.set('stageOptions', { runtimeUrl: 'a' } as any);
    const el = document.createElement('div');
    stageOverlay.openOverlay(el);
    expect(stageOverlay.get('stageOverlayVisible')).toBe(true);
    expect(stageOverlay.get('sourceEl')).toBe(el);
    expect(stageOverlay.get('contentEl')).toBeDefined();
    expect((stageOverlay.get('contentEl') as HTMLElement).style.position).toBe('static');
  });

  test('openOverlay null el 时无操作', () => {
    stageOverlay.set('stageOptions', { runtimeUrl: 'a' } as any);
    stageOverlay.set('stageOverlayVisible', false);
    stageOverlay.openOverlay(null);
    expect(stageOverlay.get('stageOverlayVisible')).toBe(false);
  });

  test('closeOverlay 销毁 stage 并清理 sourceEl', () => {
    stageOverlay.set('stageOptions', { runtimeUrl: 'a' } as any);
    const el = document.createElement('div');
    stageOverlay.openOverlay(el);
    stageOverlay.set('stage', subStage as any);
    stageOverlay.closeOverlay();
    expect(stageOverlay.get('stageOverlayVisible')).toBe(false);
    expect(stageOverlay.get('sourceEl')).toBeNull();
    expect(stageOverlay.get('contentEl')).toBeNull();
    expect(subStage.destroy).toHaveBeenCalled();
  });

  test('updateOverlay 更新 wrapWidth/wrapHeight', () => {
    const el = document.createElement('div');
    Object.defineProperty(el, 'scrollWidth', { value: 200, configurable: true });
    Object.defineProperty(el, 'scrollHeight', { value: 300, configurable: true });
    stageOverlay.set('sourceEl', el);
    stageOverlay.updateOverlay();
    expect(stageOverlay.get('wrapWidth')).toBe(200);
    expect(stageOverlay.get('wrapHeight')).toBe(300);
  });

  test('updateOverlay 无 sourceEl 时无操作', () => {
    stageOverlay.set('sourceEl', null);
    stageOverlay.set('wrapWidth', 0);
    stageOverlay.updateOverlay();
    expect(stageOverlay.get('wrapWidth')).toBe(0);
  });

  test('createStage 调用 useStage', async () => {
    const { useStage } = await import('@editor/hooks/use-stage');
    stageOverlay.createStage({ runtimeUrl: 'b', isContainer: () => true } as any);
    expect(useStage).toHaveBeenCalled();
  });

  test('createStage render 回调清理 body 子元素并执行', async () => {
    const { useStage } = (await import('@editor/hooks/use-stage')) as any;
    let renderFn: any;
    useStage.mockImplementationOnce((opts: any) => {
      renderFn = opts.render;
      return subStage;
    });
    stageOverlay.set('stageOptions', { runtimeUrl: 'b' } as any);
    const el = document.createElement('div');
    Object.defineProperty(el, 'scrollWidth', { value: 100, configurable: true });
    Object.defineProperty(el, 'scrollHeight', { value: 200, configurable: true });
    stageOverlay.openOverlay(el);
    stageOverlay.set('stage', subStage as any);
    stageOverlay.createStage({ runtimeUrl: 'b' } as any);
    const remove = vi.fn();
    const child1 = { tagName: 'DIV', remove };
    const child2 = { tagName: 'SCRIPT', remove };
    const stageRenderer = subStage.renderer.getDocument as any;
    stageRenderer.mockReturnValueOnce({
      body: { children: [child1, child2] },
      documentElement: document.createElement('html'),
      replaceChild: vi.fn(),
    });
    const result = await renderFn(subStage);
    expect(result).toBe(stageOverlay.get('wrapDiv'));
  });

  test('updateHandler 由 update 事件触发', async () => {
    stageOverlay.set('stageOptions', { runtimeUrl: 'a' } as any);
    const el = document.createElement('div');
    Object.defineProperty(el, 'scrollWidth', { value: 50, configurable: true });
    Object.defineProperty(el, 'scrollHeight', { value: 60, configurable: true });
    stageOverlay.openOverlay(el);
    stageOverlay.set('stage', subStage as any);
    expect(editorEvents.update?.length).toBeGreaterThan(0);
    const handler = editorEvents.update[0];
    handler();
    await new Promise((r) => setTimeout(r, 10));
    expect(stageOverlay.get('wrapWidth')).toBe(50);
  });

  test('addHandler/removeHandler 直接调用 render+updateOverlay', async () => {
    stageOverlay.set('stageOptions', { runtimeUrl: 'a' } as any);
    const el = document.createElement('div');
    Object.defineProperty(el, 'scrollWidth', { value: 80, configurable: true });
    Object.defineProperty(el, 'scrollHeight', { value: 90, configurable: true });
    stageOverlay.openOverlay(el);
    stageOverlay.set('stage', subStage as any);
    expect(editorEvents.add?.length).toBeGreaterThan(0);
    expect(editorEvents.remove?.length).toBeGreaterThan(0);
    editorEvents.add[0]();
    await new Promise((r) => setTimeout(r, 10));
    expect(stageOverlay.get('wrapWidth')).toBe(80);
  });

  test('updateSelectStatus 多节点调用 multiSelect', async () => {
    const editorMod = (await import('@editor/services/editor')) as any;
    editorMod.default.get.mockImplementation((k: string) => {
      if (k === 'nodes') return [{ id: 'n1' }, { id: 'n2' }];
      return null;
    });
    stageOverlay.set('stageOptions', { runtimeUrl: 'a' } as any);
    const el = document.createElement('div');
    Object.defineProperty(el, 'scrollWidth', { value: 1, configurable: true });
    Object.defineProperty(el, 'scrollHeight', { value: 1, configurable: true });
    stageOverlay.openOverlay(el);
    stageOverlay.set('stage', subStage as any);
    editorEvents.add[0]();
    await new Promise((r) => setTimeout(r, 10));
    expect(subStage.multiSelect).toHaveBeenCalledWith(['n1', 'n2']);
  });
});
