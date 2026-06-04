/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useStage } from '@editor/hooks/use-stage';
import editorService from '@editor/services/editor';
import uiService from '@editor/services/ui';

const { stageInstance, StageCoreCtor, getIdFromElFn } = vi.hoisted(() => {
  const handlers: Record<string, ((..._args: any[]) => any)[]> = {};
  const fakeStage = {
    mask: {
      setGuides: vi.fn(),
      horizontalGuidelines: [],
      verticalGuidelines: [],
    },
    on: vi.fn((evt: string, fn: any) => {
      handlers[evt] ||= [];
      handlers[evt].push(fn);
    }),
    select: vi.fn(),
    disableMultiSelect: vi.fn(),
    enableMultiSelect: vi.fn(),
    setAlwaysMultiSelect: vi.fn(),
    handlers,
  };
  const ctor: any = vi.fn(function (this: any, opts: any) {
    Object.assign(this, fakeStage, { opts });
    return this;
  });
  const getIdFn = vi.fn(() => (el: any) => el?.id || null);
  return { stageInstance: fakeStage, StageCoreCtor: ctor, getIdFromElFn: getIdFn };
});

vi.mock('@tmagic/stage', () => ({
  default: StageCoreCtor,
  GuidesType: { HORIZONTAL: 'h', VERTICAL: 'v' },
}));

vi.mock('@tmagic/utils', async () => {
  const actual = await vi.importActual<any>('@tmagic/utils');
  return { ...actual, getIdFromEl: getIdFromElFn };
});

const editorState: Record<string, any> = {
  root: { id: 'r1' },
  page: { id: 'p1' },
  node: { id: 'n1' },
  nodes: [{ id: 'n1' }],
  parent: { id: 'parent1' },
  stage: null,
  disabledMultiSelect: false,
  alwaysMultiSelect: false,
};

vi.mock('@editor/services/editor', () => ({
  default: {
    get: (k: string) => editorState[k],
    set: vi.fn((k: string, v: any) => {
      editorState[k] = v;
    }),
    select: vi.fn(),
    multiSelect: vi.fn(),
    highlight: vi.fn(),
    moveToContainer: vi.fn(),
    update: vi.fn(),
    sort: vi.fn(),
    remove: vi.fn(),
    getNodeById: vi.fn((id: string) => ({ id })),
  },
}));

const uiState: Record<string, any> = { zoom: 1, uiSelectMode: false };
vi.mock('@editor/services/ui', () => ({
  default: {
    get: (k: string) => uiState[k],
    set: vi.fn((k: string, v: any) => {
      uiState[k] = v;
    }),
  },
}));

vi.mock('@editor/utils/editor', () => ({
  buildChangeRecords: vi.fn((style: Record<string, any>, basePath: string) =>
    Object.entries(style ?? {}).map(([k, v]) => ({ propPath: `${basePath}.${k}`, value: v })),
  ),
  getGuideLineFromCache: vi.fn(() => []),
}));

const localStorageMock = {
  setItem: vi.fn(),
  removeItem: vi.fn(),
  getItem: vi.fn(),
};

beforeEach(() => {
  StageCoreCtor.mockClear();
  Object.keys(stageInstance.handlers).forEach((k) => delete stageInstance.handlers[k]);
  vi.clearAllMocks();
  globalThis.localStorage = localStorageMock as any;
});

afterEach(() => {
  delete (globalThis as any).localStorage;
});

describe('useStage', () => {
  test('返回 stage 实例并注册事件', () => {
    const stage = useStage({ runtimeUrl: 'r' } as any);
    expect(stage).toBeDefined();
    expect(StageCoreCtor).toHaveBeenCalledTimes(1);
    expect(stageInstance.on).toHaveBeenCalledWith('select', expect.any(Function));
    expect(stageInstance.mask.setGuides).toHaveBeenCalled();
  });

  test('disabledFlashTip 透传给 StageCore', () => {
    useStage({ disabledFlashTip: true } as any);
    const opts = StageCoreCtor.mock.calls[0][0];
    expect(opts.disabledFlashTip).toBe(true);
  });

  test('默认不开启 disabledFlashTip（透传 undefined）', () => {
    useStage({} as any);
    const opts = StageCoreCtor.mock.calls[0][0];
    expect(opts.disabledFlashTip).toBeUndefined();
  });

  test('canSelect: 无 stageOptions.canSelect 时返回 true', () => {
    useStage({} as any);
    const opts = StageCoreCtor.mock.calls[0][0];
    expect(opts.canSelect({}, { type: 'click' }, () => null)).toBe(true);
  });

  test('canSelect: uiSelectMode + mousedown + canSelect 触发自定义事件', () => {
    uiState.uiSelectMode = true;
    const dispatchSpy = vi.spyOn(document, 'dispatchEvent');
    const stop = vi.fn(() => 'stopped');
    useStage({ canSelect: () => true } as any);
    const opts = StageCoreCtor.mock.calls[0][0];
    const result = opts.canSelect({}, { type: 'mousedown' }, stop);
    expect(dispatchSpy).toHaveBeenCalled();
    expect(stop).toHaveBeenCalled();
    expect(result).toBe('stopped');
    uiState.uiSelectMode = false;
  });

  test('select 事件: 触发 editorService.select', () => {
    useStage({} as any);
    stageInstance.handlers.select[0]({ id: 'newNode' });
    expect(editorService.select).toHaveBeenCalledWith('newNode');
  });

  test('select 事件: 同 id 不再触发 select', () => {
    useStage({} as any);
    stageInstance.handlers.select[0]({ id: 'n1' });
    expect(editorService.select).not.toHaveBeenCalled();
  });

  test('highlight 事件触发', () => {
    useStage({} as any);
    stageInstance.handlers.highlight[0]({ id: 'h1' });
    expect(editorService.highlight).toHaveBeenCalledWith('h1');
  });

  test('multi-select 事件', () => {
    useStage({} as any);
    stageInstance.handlers['multi-select'][0]([{ id: 'a' }, { id: 'b' }, { id: null }]);
    expect(editorService.multiSelect).toHaveBeenCalledWith(['a', 'b']);
  });

  test('update 事件 (parentEl 存在 - moveToContainer)', () => {
    useStage({} as any);
    stageInstance.handlers.update[0]({
      parentEl: { id: 'p_x' },
      data: [{ el: { id: 'c1' }, style: { left: 1 } }],
    });
    // 单选时整批仍只调用一次 moveToContainer，传入数组形式的 configs
    expect(editorService.moveToContainer).toHaveBeenCalledWith([{ id: 'c1', style: { left: 1 } }], 'p_x');
  });

  test('update 事件 (parentEl 存在 - 多选 moveToContainer 合并为单次调用)', () => {
    useStage({} as any);
    stageInstance.handlers.update[0]({
      parentEl: { id: 'p_x' },
      data: [
        { el: { id: 'c1' }, style: { left: 1 } },
        { el: { id: 'c2' }, style: { left: 2 } },
      ],
    });
    // 多选拖入容器：整批合并为一次 moveToContainer 调用，避免历史栈被切成两条
    expect(editorService.moveToContainer).toHaveBeenCalledTimes(1);
    expect(editorService.moveToContainer).toHaveBeenCalledWith(
      [
        { id: 'c1', style: { left: 1 } },
        { id: 'c2', style: { left: 2 } },
      ],
      'p_x',
    );
  });

  test('update 事件 (无 parentEl - update)', () => {
    useStage({} as any);
    stageInstance.handlers.update[0]({
      data: [{ el: { id: 'c1' }, style: { width: 10 } }],
    });
    expect(editorService.update).toHaveBeenCalled();
  });

  test('update 事件 (无 parentEl - 多选拖动 / 缩放合并为单次 update)', () => {
    useStage({} as any);
    (editorService.update as any).mockClear();
    stageInstance.handlers.update[0]({
      data: [
        { el: { id: 'c1' }, style: { width: 10 } },
        { el: { id: 'c2' }, style: { width: 20 } },
      ],
    });
    // 多选场景整批走一次 editorService.update，避免历史栈被切成两条
    expect(editorService.update).toHaveBeenCalledTimes(1);
    const callArgs = (editorService.update as any).mock.calls[0];
    expect(callArgs[0]).toEqual([
      { id: 'c1', style: { width: 10 } },
      { id: 'c2', style: { width: 20 } },
    ]);
    // changeRecordList 与 configs 同序，每个节点独立保有自己的 records，不能合并为一个数组
    expect(callArgs[1].changeRecordList).toHaveLength(2);
    expect(callArgs[1].changeRecordList[0]).toEqual([{ propPath: 'style.width', value: 10 }]);
    expect(callArgs[1].changeRecordList[1]).toEqual([{ propPath: 'style.width', value: 20 }]);
    expect(callArgs[1].changeRecords).toBeUndefined();
  });

  test('sort 事件', () => {
    useStage({} as any);
    stageInstance.handlers.sort[0]({ src: 'a', dist: 'b' });
    expect(editorService.sort).toHaveBeenCalledWith('a', 'b');
  });

  test('remove 事件', () => {
    useStage({} as any);
    stageInstance.handlers.remove[0]({ data: [{ el: { id: 'a' } }, { el: { id: 'b' } }] });
    expect(editorService.remove).toHaveBeenCalled();
  });

  test('select-parent 事件成功', () => {
    editorState.stage = { select: vi.fn() };
    useStage({} as any);
    stageInstance.handlers['select-parent'][0]();
    expect(editorService.select).toHaveBeenCalledWith({ id: 'parent1' });
    editorState.stage = null;
  });

  test('select-parent 事件: parent 为空抛错', () => {
    editorState.parent = null;
    useStage({} as any);
    expect(() => stageInstance.handlers['select-parent'][0]()).toThrow('父节点为空');
    editorState.parent = { id: 'parent1' };
  });

  test('change-guides 事件: 写入 localStorage', () => {
    useStage({} as any);
    stageInstance.handlers['change-guides'][0]({ type: 'h', guides: [10, 20] });
    expect(localStorageMock.setItem).toHaveBeenCalled();
    expect(uiService.set).toHaveBeenCalledWith('showGuides', true);
  });

  test('change-guides 事件: 空 guides 删除 localStorage', () => {
    useStage({} as any);
    stageInstance.handlers['change-guides'][0]({ type: 'v', guides: [] });
    expect(localStorageMock.removeItem).toHaveBeenCalled();
  });

  test('page-el-update 事件 重置 stageLoading', () => {
    useStage({} as any);
    stageInstance.handlers['page-el-update'][0]();
    expect(editorService.set).toHaveBeenCalledWith('stageLoading', false);
  });
});
