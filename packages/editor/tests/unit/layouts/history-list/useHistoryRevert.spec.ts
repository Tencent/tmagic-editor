/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';

import { tMagicMessage } from '@tmagic/design';

import { confirmHistoryAction } from '@editor/layouts/history-list/composables';
import { useHistoryRevert } from '@editor/layouts/history-list/useHistoryRevert';

vi.mock('@tmagic/design', () => ({
  tMagicMessage: {
    error: vi.fn(),
  },
}));

vi.mock('@editor/layouts/history-list/composables', async () => {
  const actual = await vi.importActual<object>('@editor/layouts/history-list/composables');
  return {
    ...actual,
    confirmHistoryAction: vi.fn(async () => true),
  };
});

// 捕获动态挂载 HistoryDiffDialog 时传入 createApp 的 props（用于断言 width 透传），
// 并桩掉弹窗实例的 open / confirm，避免真正渲染组件。
const dialogInstance = {
  open: vi.fn(),
  confirm: vi.fn(async () => true),
};
const appMock = {
  _context: {},
  mount: vi.fn(() => dialogInstance),
  unmount: vi.fn(),
};
const createAppMock = vi.fn((..._args: any[]) => appMock);

vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue');
  return {
    ...actual,
    createApp: (...args: any[]) => createAppMock(...args),
    // setup 之外调用，强制返回 null，避免依赖宿主组件上下文
    getCurrentInstance: () => null,
  };
});

vi.mock('@editor/layouts/history-list/HistoryDiffDialog.vue', () => ({
  default: { name: 'MEditorHistoryDiffDialog' },
}));

/** 读取最近一次挂载弹窗时传入的 props（createApp 第二个参数）。 */
const lastDialogProps = () => createAppMock.mock.calls.at(-1)?.[1] as unknown as Record<string, any>;

const createServices = () =>
  ({
    editorService: {
      get: vi.fn(() => ({ id: 'p1' })),
      getNodeById: vi.fn(),
      revertPageStep: vi.fn(async () => null),
    },
    dataSourceService: {
      getDataSourceById: vi.fn(),
      revert: vi.fn(async () => null),
    },
    codeBlockService: {
      getCodeContentById: vi.fn(),
      revert: vi.fn(async () => null),
    },
    historyService: {
      getStepList: vi.fn(() => []),
      getHistoryGroups: vi.fn(() => []),
    },
  }) as any;

/** 构造一个可差异对比（单实体 update，前后值都在）的历史分组，用于触发差异弹窗。 */
const diffableGroups = (id: string | number = 'p1') => [
  {
    id,
    steps: [
      {
        index: 0,
        step: { diff: [{ oldSchema: { id: 'n1', name: 'A' }, newSchema: { id: 'n1', name: 'B' } }] },
      },
    ],
  },
];

afterEach(() => {
  vi.clearAllMocks();
});

describe('useHistoryRevert', () => {
  test('页面 update 记录的目标节点已删除时，提示错误且不执行回滚', async () => {
    const services = createServices();
    services.historyService.getStepList.mockReturnValue([
      {
        step: {
          opType: 'update',
          diff: [{ newSchema: { id: 'gone' }, oldSchema: { id: 'gone' } }],
        },
      },
    ]);
    services.editorService.getNodeById.mockReturnValue(null);

    const { onPageRevert } = useHistoryRevert({}, services);
    await onPageRevert(0);

    expect(tMagicMessage.error).toHaveBeenCalledWith('回滚失败：该记录对应的数据已被删除');
    expect(services.editorService.revertPageStep).not.toHaveBeenCalled();
  });

  test('页面 add 记录回滚时走普通二次确认，并执行 revertPageStep', async () => {
    const services = createServices();
    services.historyService.getStepList.mockReturnValue([
      {
        step: {
          opType: 'add',
          diff: [{ newSchema: { id: 'n1', name: 'A' } }],
        },
      },
    ]);

    const { onPageRevert } = useHistoryRevert({}, services);
    await onPageRevert(0);

    expect(confirmHistoryAction).toHaveBeenCalled();
    expect(services.editorService.revertPageStep).toHaveBeenCalledWith(0);
  });

  test('数据源 update 记录对应目标已删除时，提示错误且不执行回滚', async () => {
    const services = createServices();
    services.historyService.getStepList.mockReturnValue([
      {
        step: {
          opType: 'update',
          diff: [{ newSchema: { id: 'ds_1' }, oldSchema: { id: 'ds_1' } }],
        },
      },
    ]);
    services.dataSourceService.getDataSourceById.mockReturnValue(null);

    const { onDataSourceRevert } = useHistoryRevert({}, services);
    await onDataSourceRevert('ds_1', 0);

    expect(tMagicMessage.error).toHaveBeenCalledWith('回滚失败：该记录对应的数据已被删除');
    expect(services.dataSourceService.revert).not.toHaveBeenCalled();
  });

  describe('弹窗宽度透传', () => {
    test('onPageDiff 使用 options.dialogWidth 作为弹窗宽度并打开弹窗', async () => {
      const services = createServices();
      services.historyService.getHistoryGroups.mockReturnValue(diffableGroups());

      const { onPageDiff } = useHistoryRevert({ dialogWidth: '1200px' }, services);
      await onPageDiff(0);

      expect(createAppMock).toHaveBeenCalledTimes(1);
      expect(lastDialogProps().width).toBe('1200px');
      expect(lastDialogProps().isConfirm).toBe(false);
      expect(dialogInstance.open).toHaveBeenCalled();
    });

    test('未配置 dialogWidth 时不强制 width（由弹窗内置默认值兜底）', async () => {
      const services = createServices();
      services.historyService.getHistoryGroups.mockReturnValue(diffableGroups());

      const { onPageDiff } = useHistoryRevert({}, services);
      await onPageDiff(0);

      expect(createAppMock).toHaveBeenCalledTimes(1);
      expect(lastDialogProps().width).toBeUndefined();
    });

    test('onPageRevert 在可差异步骤上走差异确认弹窗并透传 dialogWidth', async () => {
      const services = createServices();
      services.historyService.getStepList.mockReturnValue([
        { step: { opType: 'update', diff: [{ newSchema: { id: 'n1' }, oldSchema: { id: 'n1' } }] } },
      ]);
      services.editorService.getNodeById.mockReturnValue({ id: 'n1' });
      services.historyService.getHistoryGroups.mockReturnValue(diffableGroups());

      const { onPageRevert } = useHistoryRevert({ dialogWidth: '80%' }, services);
      await onPageRevert(0);

      expect(lastDialogProps().width).toBe('80%');
      expect(lastDialogProps().isConfirm).toBe(true);
      expect(dialogInstance.confirm).toHaveBeenCalled();
      expect(services.editorService.revertPageStep).toHaveBeenCalledWith(0);
    });

    test('viewDiff 的逐次 width 入参可覆盖 dialogWidth 默认值', async () => {
      const services = createServices();
      const { viewDiff } = useHistoryRevert({ dialogWidth: '1000px' }, services);

      await viewDiff({ category: 'module', lastValue: { a: 1 }, value: { a: 2 } } as any, { width: '600px' });

      expect(lastDialogProps().width).toBe('600px');
    });

    test('viewDiff 未传 width 时回退到 dialogWidth 默认值', async () => {
      const services = createServices();
      const { viewDiff } = useHistoryRevert({ dialogWidth: '1000px' }, services);

      await viewDiff({ category: 'module', lastValue: { a: 1 }, value: { a: 2 } } as any);

      expect(lastDialogProps().width).toBe('1000px');
    });

    test('confirmAndRevert 透传 width 至确认弹窗并在确认后执行 revert', async () => {
      const services = createServices();
      const revert = vi.fn(async () => 'done');
      const { confirmAndRevert } = useHistoryRevert({ dialogWidth: '1000px' }, services);

      const result = await confirmAndRevert({
        diffPayload: { category: 'module', lastValue: { a: 1 }, value: { a: 2 } } as any,
        width: '720px',
        revert,
      });

      expect(lastDialogProps().width).toBe('720px');
      expect(lastDialogProps().isConfirm).toBe(true);
      expect(revert).toHaveBeenCalled();
      expect(result).toBe('done');
    });
  });
});
