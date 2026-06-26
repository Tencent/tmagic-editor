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
});
