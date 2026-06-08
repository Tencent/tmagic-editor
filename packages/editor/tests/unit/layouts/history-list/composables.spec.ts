/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { afterEach, describe, expect, test } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import {
  describeCodeBlockGroup,
  describeCodeBlockStep,
  describeDataSourceGroup,
  describeDataSourceStep,
  describePageGroup,
  describePageStep,
  formatHistoryFullTime,
  formatHistoryTime,
  groupTimestamp,
  isCodeBlockStepRevertable,
  isDataSourceStepRevertable,
  isPageStepRevertable,
  opLabel,
  useHistoryList,
} from '@editor/layouts/history-list/composables';
import historyService from '@editor/services/history';
import type {
  CodeBlockHistoryGroup,
  CodeBlockStepValue,
  DataSourceHistoryGroup,
  DataSourceStepValue,
  PageHistoryGroup,
  PageHistoryStepEntry,
  StepValue,
} from '@editor/type';

afterEach(() => {
  historyService.reset();
});

const buildPageEntry = (step: StepValue, index = 0, applied = true): PageHistoryStepEntry => ({
  step,
  index,
  applied,
});

describe('opLabel', () => {
  test('add / remove / update 分别返回中文标签', () => {
    expect(opLabel('add')).toBe('新增');
    expect(opLabel('remove')).toBe('删除');
    expect(opLabel('update')).toBe('修改');
  });

  test('未知操作类型回退到「修改」', () => {
    expect(opLabel('unknown' as any)).toBe('修改');
  });
});

describe('formatHistoryFullTime', () => {
  test('无时间戳返回空串', () => {
    expect(formatHistoryFullTime()).toBe('');
    expect(formatHistoryFullTime(0)).toBe('');
  });

  test('格式化为北京时间的完整 YYYY-MM-DD HH:mm:ss（不随本地时区漂移）', () => {
    // 2026-01-02 03:04:05 UTC → 北京时间 (UTC+8) 2026-01-02 11:04:05
    const ts = Date.UTC(2026, 0, 2, 3, 4, 5);
    expect(formatHistoryFullTime(ts)).toBe('2026-01-02 11:04:05');
  });
});

describe('formatHistoryTime', () => {
  test('无时间戳返回空串', () => {
    expect(formatHistoryTime()).toBe('');
    expect(formatHistoryTime(0)).toBe('');
  });

  test('当天记录只显示 HH:mm:ss', () => {
    expect(formatHistoryTime(Date.now())).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  test('跨天记录显示 MM-DD HH:mm:ss', () => {
    // 取一个明显不是今天的旧时间戳
    const ts = Date.UTC(2020, 5, 15, 1, 2, 3);
    expect(formatHistoryTime(ts)).toMatch(/^\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });
});

describe('groupTimestamp', () => {
  test('取组内最后一步的时间戳', () => {
    const group = {
      steps: [{ step: { timestamp: 100 } }, { step: { timestamp: 200 } }, { step: { timestamp: 300 } }],
    };
    expect(groupTimestamp(group)).toBe(300);
  });

  test('末步无时间戳时返回 undefined', () => {
    expect(groupTimestamp({ steps: [{ step: {} }] })).toBeUndefined();
    expect(groupTimestamp({ steps: [] })).toBeUndefined();
  });
});

describe('describePageStep', () => {
  test('显式 historyDescription 优先于自动生成', () => {
    const step = { opType: 'update', historyDescription: '调整按钮颜色' } as unknown as StepValue;
    expect(describePageStep(step)).toBe('调整按钮颜色');
  });

  test('add 单个节点：含名称与 id', () => {
    const step = {
      opType: 'add',
      diff: [{ newSchema: { id: 'btn_1', type: 'button', name: '主按钮' } }],
    } as unknown as StepValue;
    expect(describePageStep(step)).toBe('新增 1 个节点（主按钮 (id: btn_1)）');
  });

  test('add 节点无 name 但有 type：使用 type 作为名称', () => {
    const step = {
      opType: 'add',
      diff: [{ newSchema: { id: 'n1', type: 'text' } }],
    } as unknown as StepValue;
    expect(describePageStep(step)).toBe('新增 1 个节点（text (id: n1)）');
  });

  test('add 节点 name 与 id 相同：仅显示 id', () => {
    const step = {
      opType: 'add',
      diff: [{ newSchema: { id: 'n1', name: 'n1' } }],
    } as unknown as StepValue;
    expect(describePageStep(step)).toBe('新增 1 个节点（n1）');
  });

  test('add 多个节点：仅给出数量', () => {
    const step = {
      opType: 'add',
      diff: [{ newSchema: { id: 'a' } }, { newSchema: { id: 'b' } }],
    } as unknown as StepValue;
    expect(describePageStep(step)).toBe('新增 2 个节点');
  });

  test('add 无 nodes：count 为 0 且不附名称', () => {
    const step = { opType: 'add' } as unknown as StepValue;
    expect(describePageStep(step)).toBe('新增 0 个节点');
  });

  test('remove 单个节点：含名称与 id', () => {
    const step = {
      opType: 'remove',
      diff: [{ oldSchema: { id: 'btn_1', name: '主按钮' } }],
    } as unknown as StepValue;
    expect(describePageStep(step)).toBe('删除 1 个节点（主按钮 (id: btn_1)）');
  });

  test('remove 多个节点', () => {
    const step = {
      opType: 'remove',
      diff: [{ oldSchema: { id: 'a' } }, { oldSchema: { id: 'b' } }],
    } as unknown as StepValue;
    expect(describePageStep(step)).toBe('删除 2 个节点');
  });

  test('update 单节点：附 propPath 与 id', () => {
    const step = {
      opType: 'update',
      diff: [
        {
          newSchema: { id: 'btn_1', name: '按钮' },
          oldSchema: { id: 'btn_1', name: '按钮' },
          changeRecords: [{ propPath: 'style.color' }],
        },
      ],
    } as unknown as StepValue;
    expect(describePageStep(step)).toBe('修改 按钮 (id: btn_1) · style.color');
  });

  test('update 单节点无 propPath：仅展示节点', () => {
    const step = {
      opType: 'update',
      diff: [{ newSchema: { id: 'btn_1', name: '按钮' }, oldSchema: { id: 'btn_1' } }],
    } as unknown as StepValue;
    expect(describePageStep(step)).toBe('修改 按钮 (id: btn_1)');
  });

  test('update 多节点：返回数量', () => {
    const step = {
      opType: 'update',
      diff: [
        { newSchema: { id: 'a' }, oldSchema: { id: 'a' } },
        { newSchema: { id: 'b' }, oldSchema: { id: 'b' } },
      ],
    } as unknown as StepValue;
    expect(describePageStep(step)).toBe('修改 2 个节点');
  });

  test('update diff 缺省：兜底为「修改节点」', () => {
    const step = { opType: 'update' } as unknown as StepValue;
    expect(describePageStep(step)).toBe('修改节点');
  });
});

describe('describePageGroup', () => {
  test('historyDescription 取最后一条非空的描述', () => {
    const group: PageHistoryGroup = {
      kind: 'page',
      pageId: 'p1',
      opType: 'update',
      targetId: 'btn_1',
      targetName: '按钮',
      applied: true,
      steps: [
        buildPageEntry({ opType: 'update', historyDescription: '旧描述' } as any),
        buildPageEntry({ opType: 'update', historyDescription: undefined } as any, 1),
        buildPageEntry({ opType: 'update', historyDescription: '新描述' } as any, 2),
      ],
    };
    expect(describePageGroup(group)).toBe('新描述');
  });

  test('单步 group 复用 describePageStep', () => {
    const step = {
      opType: 'update',
      diff: [{ newSchema: { id: 'a', name: 'A' }, oldSchema: { id: 'a' } }],
    } as unknown as StepValue;
    const group: PageHistoryGroup = {
      kind: 'page',
      pageId: 'p1',
      opType: 'update',
      targetId: 'a',
      targetName: 'A',
      applied: true,
      steps: [buildPageEntry(step)],
    };
    expect(describePageGroup(group)).toBe('修改 A (id: a)');
  });

  test('多步合并组：聚合 propPath 列表', () => {
    const mkStep = (path: string) =>
      ({
        opType: 'update',
        diff: [
          {
            newSchema: { id: 'btn_1', name: '按钮' },
            oldSchema: { id: 'btn_1', name: '按钮' },
            changeRecords: [{ propPath: path }],
          },
        ],
      }) as unknown as StepValue;

    const group: PageHistoryGroup = {
      kind: 'page',
      pageId: 'p1',
      opType: 'update',
      targetId: 'btn_1',
      targetName: '按钮',
      applied: true,
      steps: [buildPageEntry(mkStep('style.color'), 0), buildPageEntry(mkStep('style.fontSize'), 1)],
    };
    expect(describePageGroup(group)).toBe('修改 按钮 (id: btn_1) · style.color, style.fontSize');
  });

  test('多步合并组：超过 3 个 propPath 时截断并加省略号', () => {
    const mkStep = (path: string) =>
      ({
        opType: 'update',
        diff: [
          {
            newSchema: { id: 'btn_1', name: '按钮' },
            oldSchema: { id: 'btn_1' },
            changeRecords: [{ propPath: path }],
          },
        ],
      }) as unknown as StepValue;

    const group: PageHistoryGroup = {
      kind: 'page',
      pageId: 'p1',
      opType: 'update',
      targetId: 'btn_1',
      targetName: '按钮',
      applied: true,
      steps: [
        buildPageEntry(mkStep('a'), 0),
        buildPageEntry(mkStep('b'), 1),
        buildPageEntry(mkStep('c'), 2),
        buildPageEntry(mkStep('d'), 3),
      ],
    };
    const desc = describePageGroup(group);
    expect(desc).toContain('修改 按钮 (id: btn_1) · a, b, c');
    expect(desc.endsWith('…')).toBe(true);
  });

  test('多步合并组无 propPath 时仅展示目标', () => {
    const mkStep = () =>
      ({
        opType: 'update',
        diff: [{ newSchema: { id: 'btn_1', name: '按钮' }, oldSchema: { id: 'btn_1' } }],
      }) as unknown as StepValue;

    const group: PageHistoryGroup = {
      kind: 'page',
      pageId: 'p1',
      opType: 'update',
      targetId: 'btn_1',
      targetName: '按钮',
      applied: true,
      steps: [buildPageEntry(mkStep(), 0), buildPageEntry(mkStep(), 1)],
    };
    expect(describePageGroup(group)).toBe('修改 按钮 (id: btn_1)');
  });

  test('多步组 targetName 缺省时使用 targetId 兜底', () => {
    const group: PageHistoryGroup = {
      kind: 'page',
      pageId: 'p1',
      opType: 'update',
      targetId: 'btn_1',
      applied: true,
      steps: [
        buildPageEntry({ opType: 'update', diff: [] } as any, 0),
        buildPageEntry({ opType: 'update', diff: [] } as any, 1),
      ],
    };
    // targetName 为 undefined，labelWithId 看 label === id 时只展示 id
    expect(describePageGroup(group)).toBe('修改 btn_1');
  });
});

describe('describeDataSourceStep', () => {
  test('historyDescription 优先', () => {
    const step = {
      id: 'ds_1',
      opType: 'update',
      diff: [{}],
      historyDescription: '自定义',
    } as unknown as DataSourceStepValue;
    expect(describeDataSourceStep(step)).toBe('自定义');
  });

  test('新增（oldSchema=null）：展示 title 与 id', () => {
    const step = {
      id: 'ds_1',
      opType: 'add',
      diff: [{ newSchema: { id: 'ds_1', title: '用户列表' } }],
    } as unknown as DataSourceStepValue;
    expect(describeDataSourceStep(step)).toBe('创建 用户列表 (id: ds_1)');
  });

  test('删除（newSchema=null）：展示 title 与 id', () => {
    const step = {
      id: 'ds_1',
      opType: 'remove',
      diff: [{ oldSchema: { id: 'ds_1', title: '用户列表' } }],
    } as unknown as DataSourceStepValue;
    expect(describeDataSourceStep(step)).toBe('删除 用户列表 (id: ds_1)');
  });

  test('修改：展示 propPath', () => {
    const step = {
      id: 'ds_1',
      opType: 'update',
      diff: [
        {
          oldSchema: { id: 'ds_1', title: '用户列表' },
          newSchema: { id: 'ds_1', title: '用户列表' },
          changeRecords: [{ propPath: 'fields.0.name' }],
        },
      ],
    } as unknown as DataSourceStepValue;
    expect(describeDataSourceStep(step)).toBe('修改 用户列表 (id: ds_1) · fields.0.name');
  });

  test('修改无 title 时仅展示 id', () => {
    const step = {
      id: 'ds_1',
      opType: 'update',
      diff: [{ oldSchema: { id: 'ds_1' }, newSchema: { id: 'ds_1' } }],
    } as unknown as DataSourceStepValue;
    expect(describeDataSourceStep(step)).toBe('修改 ds_1');
  });
});

describe('describeDataSourceGroup', () => {
  test('多步组：聚合 propPath 与目标 id', () => {
    const mkStep = (path: string) =>
      ({
        id: 'ds_1',
        opType: 'update',
        diff: [
          {
            oldSchema: { id: 'ds_1', title: 'T' },
            newSchema: { id: 'ds_1', title: 'T' },
            changeRecords: [{ propPath: path }],
          },
        ],
      }) as unknown as DataSourceStepValue;
    const group: DataSourceHistoryGroup = {
      kind: 'data-source',
      id: 'ds_1',
      opType: 'update',
      applied: true,
      steps: [
        { step: mkStep('a'), index: 0, applied: true },
        { step: mkStep('b'), index: 1, applied: true },
      ],
    };
    expect(describeDataSourceGroup(group)).toBe('修改 T (id: ds_1) · a, b');
  });

  test('单步组：复用 describeDataSourceStep', () => {
    const group: DataSourceHistoryGroup = {
      kind: 'data-source',
      id: 'ds_1',
      opType: 'add',
      applied: true,
      steps: [
        {
          step: {
            id: 'ds_1',
            opType: 'add',
            diff: [{ newSchema: { id: 'ds_1', title: 'T' } }],
          } as unknown as DataSourceStepValue,
          index: 0,
          applied: true,
        },
      ],
    };
    expect(describeDataSourceGroup(group)).toBe('创建 T (id: ds_1)');
  });

  test('historyDescription 优先', () => {
    const group: DataSourceHistoryGroup = {
      kind: 'data-source',
      id: 'ds_1',
      opType: 'update',
      applied: true,
      steps: [
        {
          step: {
            id: 'ds_1',
            opType: 'update',
            diff: [{}],
            historyDescription: '我的描述',
          } as unknown as DataSourceStepValue,
          index: 0,
          applied: true,
        },
      ],
    };
    expect(describeDataSourceGroup(group)).toBe('我的描述');
  });
});

describe('describeCodeBlockStep', () => {
  test('新增', () => {
    const step = {
      id: 'code_1',
      opType: 'add',
      diff: [{ newSchema: { id: 'code_1', name: 'onClick' } }],
    } as unknown as CodeBlockStepValue;
    expect(describeCodeBlockStep(step)).toBe('创建 onClick (id: code_1)');
  });

  test('删除', () => {
    const step = {
      id: 'code_1',
      opType: 'remove',
      diff: [{ oldSchema: { id: 'code_1', name: 'onClick' } }],
    } as unknown as CodeBlockStepValue;
    expect(describeCodeBlockStep(step)).toBe('删除 onClick (id: code_1)');
  });

  test('修改 + propPath', () => {
    const step = {
      id: 'code_1',
      opType: 'update',
      diff: [
        {
          oldSchema: { id: 'code_1', name: 'onClick' },
          newSchema: { id: 'code_1', name: 'onClick' },
          changeRecords: [{ propPath: 'content' }],
        },
      ],
    } as unknown as CodeBlockStepValue;
    expect(describeCodeBlockStep(step)).toBe('修改 onClick (id: code_1) · content');
  });

  test('historyDescription 优先', () => {
    const step = {
      id: 'code_1',
      opType: 'update',
      diff: [{}],
      historyDescription: '自定义说明',
    } as unknown as CodeBlockStepValue;
    expect(describeCodeBlockStep(step)).toBe('自定义说明');
  });
});

describe('describeCodeBlockGroup', () => {
  test('多步组：聚合 propPath', () => {
    const mkStep = (path: string) =>
      ({
        id: 'code_1',
        opType: 'update',
        diff: [
          {
            oldSchema: { id: 'code_1', name: 'fn' },
            newSchema: { id: 'code_1', name: 'fn' },
            changeRecords: [{ propPath: path }],
          },
        ],
      }) as unknown as CodeBlockStepValue;
    const group: CodeBlockHistoryGroup = {
      kind: 'code-block',
      id: 'code_1',
      opType: 'update',
      applied: true,
      steps: [
        { step: mkStep('content'), index: 0, applied: true },
        { step: mkStep('params'), index: 1, applied: true },
      ],
    };
    expect(describeCodeBlockGroup(group)).toBe('修改 fn (id: code_1) · content, params');
  });

  test('单步组：复用 step 描述', () => {
    const group: CodeBlockHistoryGroup = {
      kind: 'code-block',
      id: 'code_1',
      opType: 'remove',
      applied: false,
      steps: [
        {
          step: {
            id: 'code_1',
            opType: 'remove',
            diff: [{ oldSchema: { id: 'code_1', name: 'fn' } }],
          } as unknown as CodeBlockStepValue,
          index: 0,
          applied: false,
        },
      ],
    };
    expect(describeCodeBlockGroup(group)).toBe('删除 fn (id: code_1)');
  });
});

describe('useHistoryList', () => {
  // useHistoryList 内部用了 useServices，需要 mount 在一个 host 组件里 provide services
  const mountWithHost = () => {
    let api!: ReturnType<typeof useHistoryList>;
    const host = defineComponent({
      setup() {
        api = useHistoryList();
        return () => h('div');
      },
    });
    const wrapper = mount(host, {
      global: {
        provide: {
          services: { historyService },
        },
      },
    });
    return { api, wrapper };
  };

  test('toggleGroup 切换 expanded[key]', () => {
    const { api } = mountWithHost();
    expect(api.expanded.foo).toBeFalsy();
    api.toggleGroup('foo');
    expect(api.expanded.foo).toBe(true);
    api.toggleGroup('foo');
    expect(api.expanded.foo).toBe(false);
  });

  test('pageGroupsDisplay：按时间倒序', () => {
    const { api } = mountWithHost();

    historyService.changePage({ id: 'p1' } as any);
    historyService.push({
      opType: 'add',
      diff: [{ newSchema: { id: 'n1', name: 'A' } }],
      modifiedNodeIds: new Map(),
    } as any);
    historyService.push({
      opType: 'remove',
      diff: [{ oldSchema: { id: 'n2', name: 'B' } }],
      modifiedNodeIds: new Map(),
    } as any);

    expect(api.pageGroups.value).toHaveLength(2);
    // 正序：最早的 add 在前；倒序展示：最新的 remove 在前
    expect(api.pageGroups.value[0].opType).toBe('add');
    expect(api.pageGroupsDisplay.value[0].opType).toBe('remove');
  });

  test('dataSourceGroupsByTarget：按 id 聚拢，每 bucket 内倒序', () => {
    const { api } = mountWithHost();

    historyService.pushDataSource('ds_1', {
      oldSchema: null,
      newSchema: { id: 'ds_1', title: 'A' } as any,
    });
    historyService.pushDataSource('ds_1', {
      oldSchema: { id: 'ds_1', title: 'A' } as any,
      newSchema: { id: 'ds_1', title: 'A2' } as any,
    });
    historyService.pushDataSource('ds_2', {
      oldSchema: null,
      newSchema: { id: 'ds_2', title: 'B' } as any,
    });

    const buckets = api.dataSourceGroupsByTarget.value;
    expect(buckets).toHaveLength(2);
    const bucket1 = buckets.find((b) => b.id === 'ds_1');
    const bucket2 = buckets.find((b) => b.id === 'ds_2');
    expect(bucket1?.groups).toHaveLength(2);
    expect(bucket2?.groups).toHaveLength(1);

    // bucket 内倒序：最近的 update 排第一
    expect(bucket1?.groups[0].opType).toBe('update');
    expect(bucket1?.groups[1].opType).toBe('add');
  });

  test('codeBlockGroupsByTarget：按 id 聚拢', () => {
    const { api } = mountWithHost();

    historyService.pushCodeBlock('code_1', {
      oldContent: null,
      newContent: { id: 'code_1', name: 'fn' } as any,
    });
    historyService.pushCodeBlock('code_2', {
      oldContent: null,
      newContent: { id: 'code_2', name: 'fn2' } as any,
    });

    const buckets = api.codeBlockGroupsByTarget.value;
    expect(buckets).toHaveLength(2);
    expect(buckets.map((b) => b.id).sort()).toEqual(['code_1', 'code_2']);
  });
});

describe('isPageStepRevertable', () => {
  test('add / remove 始终可回滚', () => {
    expect(isPageStepRevertable({ opType: 'add', diff: [{ newSchema: { id: 'n1' } }] } as any)).toBe(true);
    expect(isPageStepRevertable({ opType: 'remove', diff: [{ oldSchema: { id: 'n1' } }] } as any)).toBe(true);
  });

  test('update 每项都有 changeRecords 才可回滚', () => {
    expect(
      isPageStepRevertable({
        opType: 'update',
        diff: [{ oldSchema: { id: 'n1' }, newSchema: { id: 'n1' }, changeRecords: [{ propPath: 'style.color' }] }],
      } as any),
    ).toBe(true);
  });

  test('update 缺少 changeRecords 不可回滚', () => {
    expect(
      isPageStepRevertable({
        opType: 'update',
        diff: [{ oldSchema: { id: 'n1' }, newSchema: { id: 'n1' } }],
      } as any),
    ).toBe(false);
  });

  test('update 多项中任一缺少 changeRecords 不可回滚', () => {
    expect(
      isPageStepRevertable({
        opType: 'update',
        diff: [
          { oldSchema: { id: 'n1' }, newSchema: { id: 'n1' }, changeRecords: [{ propPath: 'a' }] },
          { oldSchema: { id: 'n2' }, newSchema: { id: 'n2' } },
        ],
      } as any),
    ).toBe(false);
  });

  test('update 无 diff 不可回滚', () => {
    expect(isPageStepRevertable({ opType: 'update' } as any)).toBe(false);
  });
});

describe('isDataSourceStepRevertable', () => {
  test('新增 / 删除 始终可回滚', () => {
    expect(isDataSourceStepRevertable({ diff: [{ newSchema: { id: 'ds_1' } }] } as any)).toBe(true);
    expect(isDataSourceStepRevertable({ diff: [{ oldSchema: { id: 'ds_1' } }] } as any)).toBe(true);
  });

  test('更新有 changeRecords 才可回滚', () => {
    expect(
      isDataSourceStepRevertable({
        diff: [{ oldSchema: { id: 'ds_1' }, newSchema: { id: 'ds_1' }, changeRecords: [{ propPath: 'title' }] }],
      } as any),
    ).toBe(true);
    expect(
      isDataSourceStepRevertable({ diff: [{ oldSchema: { id: 'ds_1' }, newSchema: { id: 'ds_1' } }] } as any),
    ).toBe(false);
  });
});

describe('isCodeBlockStepRevertable', () => {
  test('新增 / 删除 始终可回滚', () => {
    expect(isCodeBlockStepRevertable({ diff: [{ newSchema: { id: 'code_1' } }] } as any)).toBe(true);
    expect(isCodeBlockStepRevertable({ diff: [{ oldSchema: { id: 'code_1' } }] } as any)).toBe(true);
  });

  test('更新有 changeRecords 才可回滚', () => {
    expect(
      isCodeBlockStepRevertable({
        diff: [{ oldSchema: { id: 'code_1' }, newSchema: { id: 'code_1' }, changeRecords: [{ propPath: 'content' }] }],
      } as any),
    ).toBe(true);
    expect(
      isCodeBlockStepRevertable({ diff: [{ oldSchema: { id: 'code_1' }, newSchema: { id: 'code_1' } }] } as any),
    ).toBe(false);
  });
});
