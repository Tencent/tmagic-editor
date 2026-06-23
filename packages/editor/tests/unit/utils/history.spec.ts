/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { describe, expect, test } from 'vitest';

import type { CodeBlockStepValue, StepValue } from '@editor/type';
import {
  createStackStep,
  describeRevertStep,
  deserializeStacks,
  detectStackOpType,
  detectTargetId,
  detectTargetName,
  getOrCreateStack,
  markStackSaved,
  mergeSteps,
  serializeStacks,
  undoFloor,
} from '@editor/utils/history';
import { UndoRedo } from '@editor/utils/undo-redo';

describe('detectStackOpType', () => {
  test('old=null new=有值 → add', () => {
    expect(detectStackOpType(null, {})).toBe('add');
  });

  test('old=有值 new=null → remove', () => {
    expect(detectStackOpType({}, null)).toBe('remove');
  });

  test('old/new 都有值 → update', () => {
    expect(detectStackOpType({}, {})).toBe('update');
  });
});

describe('createStackStep', () => {
  test('空 id 返回 null', () => {
    expect(createStackStep('', { oldValue: null, newValue: { name: 'A' } as any })).toBeNull();
  });

  test('新增：oldValue=null，推断 opType=add', () => {
    const step = createStackStep('code_1', {
      oldValue: null,
      newValue: { name: 'A', content: 'x' } as any,
    });
    expect(step?.opType).toBe('add');
    expect(step?.diff?.[0]?.newSchema).toEqual({ name: 'A', content: 'x' });
    expect(step?.diff?.[0]?.oldSchema).toBeUndefined();
  });

  test('内容 cloneDeep，外部修改不影响 step', () => {
    const content = { name: 'A' };
    const step = createStackStep('code_1', { oldValue: null, newValue: content as any });
    content.name = 'B';
    expect(step?.diff?.[0]?.newSchema).toEqual({ name: 'A' });
  });

  test('update 可携带 changeRecords', () => {
    const step = createStackStep('code_1', {
      oldValue: { name: 'A' } as any,
      newValue: { name: 'B' } as any,
      changeRecords: [{ propPath: 'name' }],
    });
    expect(step?.opType).toBe('update');
    expect(step?.diff?.[0]?.changeRecords).toEqual([{ propPath: 'name' }]);
  });
});

describe('describeRevertStep', () => {
  test('撤回新增', () => {
    expect(describeRevertStep('code_1', { newSchema: { name: 'fn' } as any }, (s) => s.name)).toBe('撤回新增 fn');
  });

  test('还原已删除', () => {
    expect(describeRevertStep('code_1', { oldSchema: { name: 'fn' } as any }, (s) => s.name)).toBe('还原已删除的 fn');
  });

  test('还原修改 + propPath', () => {
    expect(
      describeRevertStep(
        'code_1',
        {
          oldSchema: { name: 'fn' } as any,
          newSchema: { name: 'fn' } as any,
          changeRecords: [{ propPath: 'content' }],
        },
        (s) => s.name,
      ),
    ).toBe('还原 fn · content');
  });

  test('还原修改无 propPath', () => {
    expect(
      describeRevertStep(
        'code_1',
        { oldSchema: { name: 'fn' } as any, newSchema: { name: 'fn' } as any },
        (s) => s.name,
      ),
    ).toBe('还原 fn');
  });
});

describe('markStackSaved', () => {
  test('undoRedo 为空时不抛错', () => {
    expect(() => markStackSaved(undefined)).not.toThrow();
  });

  test('标记当前记录为 saved，并清除其它记录的 saved', () => {
    const undoRedo = new UndoRedo<{ saved?: boolean }>();
    undoRedo.pushElement({ saved: false });
    undoRedo.pushElement({ saved: false });
    markStackSaved(undoRedo);

    const list = undoRedo.getElementList();
    expect(list.filter((s) => s.saved)).toHaveLength(1);
    expect(list[list.length - 1].saved).toBe(true);
    expect(list[0].saved).toBeFalsy();
  });
});

describe('mergeSteps（代码块 / 数据源等按 id 分栈类型）', () => {
  test('无 diff 的连续 update 不合并（无明确目标）', () => {
    const list = [
      { opType: 'update', uuid: '1' },
      { opType: 'update', uuid: '2' },
    ] as CodeBlockStepValue[];
    const groups = mergeSteps('code-block', 'code_1', list, 2);
    expect(groups).toHaveLength(2);
    expect(groups[0].steps).toHaveLength(1);
    expect(groups[1].steps).toHaveLength(1);
    expect(groups[0].opType).toBe('update');
    expect(groups[1].opType).toBe('update');
  });

  test('同目标连续 update 合并成一组（CodeBlockContent 无 id，回退 step.data.id）', () => {
    const mkUpdate = (path: string) =>
      ({
        opType: 'update',
        data: { name: 'A', id: 'code_1' },
        diff: [
          {
            newSchema: { name: 'A', content: 'x' },
            oldSchema: { name: 'A', content: 'x' },
            changeRecords: [{ propPath: path }],
          },
        ],
      }) as unknown as CodeBlockStepValue;
    const groups = mergeSteps('code-block', 'code_1', [mkUpdate('content'), mkUpdate('params')], 2);
    expect(groups).toHaveLength(1);
    expect(groups[0].steps).toHaveLength(2);
    expect(groups[0].id).toBe('code_1');
    expect(groups[0].kind).toBe('code-block');
  });

  test('add / update 各自独立成组', () => {
    const list = [
      { opType: 'add', uuid: '1' },
      { opType: 'update', uuid: '2' },
    ] as CodeBlockStepValue[];
    const groups = mergeSteps('code-block', 'code_1', list, 2);
    expect(groups).toHaveLength(2);
  });

  test('正确标记 applied / isCurrent', () => {
    const list = [
      { opType: 'update', uuid: '1' },
      { opType: 'update', uuid: '2' },
    ] as CodeBlockStepValue[];
    const groups = mergeSteps('code-block', 'code_1', list, 1);
    expect(groups[0].applied).toBe(true);
    expect(groups[0].steps[0].applied).toBe(true);
    expect(groups[0].steps[0].isCurrent).toBe(true);
    expect(groups[0].isCurrent).toBe(true);
    expect(groups[1].applied).toBe(false);
    expect(groups[1].steps[0].applied).toBe(false);
  });
});

describe('detectTargetId / detectTargetName', () => {
  test('单节点 update 返回 targetId 与名称', () => {
    const step = {
      opType: 'update',
      diff: [{ newSchema: { id: 'btn_1', name: '按钮' }, oldSchema: { id: 'btn_1' } }],
    } as unknown as StepValue;
    expect(detectTargetId(step)).toBe('btn_1');
    expect(detectTargetName(step)).toBe('按钮');
  });

  test('多节点 update 不参与合并', () => {
    const step = {
      opType: 'update',
      diff: [
        { newSchema: { id: 'a' }, oldSchema: { id: 'a' } },
        { newSchema: { id: 'b' }, oldSchema: { id: 'b' } },
      ],
    } as unknown as StepValue;
    expect(detectTargetId(step)).toBeUndefined();
    expect(detectTargetName(step)).toBe('2 个节点');
  });

  test('add 单节点返回名称', () => {
    const step = {
      opType: 'add',
      diff: [{ newSchema: { id: 'n1', type: 'text' } }],
    } as unknown as StepValue;
    expect(detectTargetId(step)).toBeUndefined();
    expect(detectTargetName(step)).toBe('text');
  });
});

describe('mergeSteps（页面）', () => {
  test('相邻同 targetId 的 update 合并', () => {
    const mkUpdate = (path: string) =>
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

    const list = [mkUpdate('style.color'), mkUpdate('style.fontSize')];
    const groups = mergeSteps('page', 'p1', list, 2);
    expect(groups).toHaveLength(1);
    expect(groups[0].targetId).toBe('btn_1');
    expect(groups[0].steps).toHaveLength(2);
  });

  test('add 始终独立成组', () => {
    const list = [
      {
        opType: 'add',
        diff: [{ newSchema: { id: 'n1', name: 'A' } }],
      },
      {
        opType: 'update',
        diff: [{ newSchema: { id: 'n1', name: 'A' }, oldSchema: { id: 'n1', name: 'A' } }],
      },
    ] as unknown as StepValue[];
    const groups = mergeSteps('page', 'p1', list, 2);
    expect(groups).toHaveLength(2);
    expect(groups[0].opType).toBe('add');
    expect(groups[1].opType).toBe('update');
  });

  test('重命名时 targetName 取最近一次', () => {
    const list = [
      {
        opType: 'update',
        diff: [{ newSchema: { id: 'n1', name: '旧名' }, oldSchema: { id: 'n1', name: '旧名' } }],
      },
      {
        opType: 'update',
        diff: [{ newSchema: { id: 'n1', name: '新名' }, oldSchema: { id: 'n1', name: '旧名' } }],
      },
    ] as unknown as StepValue[];
    const groups = mergeSteps('page', 'p1', list, 2);
    expect(groups[0].targetName).toBe('新名');
  });
});

describe('serializeStacks / deserializeStacks', () => {
  test('序列化后还原栈内容与游标', () => {
    const stacks = {
      p1: new UndoRedo<{ v: number }>(),
    };
    stacks.p1.pushElement({ v: 1 });
    stacks.p1.pushElement({ v: 2 });

    const serialized = serializeStacks(stacks);
    const restored = deserializeStacks(serialized);

    expect(restored.p1.getLength()).toBe(2);
    expect(restored.p1.getCursor()).toBe(2);
    expect(restored.p1.getCurrentElement()).toEqual({ v: 2 });
  });

  test('还原时游标定位到最近一条 saved 记录之后', () => {
    const stacks = {
      p1: new UndoRedo<{ saved?: boolean; v: number }>(),
    };
    stacks.p1.pushElement({ v: 1 });
    stacks.p1.pushElement({ v: 2, saved: true });
    stacks.p1.pushElement({ v: 3 });

    const restored = deserializeStacks(serializeStacks(stacks));
    expect(restored.p1.getCursor()).toBe(2);
    expect(restored.p1.getCurrentElement()).toEqual({ v: 2, saved: true });
  });

  test('空表与缺省参数', () => {
    expect(serializeStacks({})).toEqual({});
    expect(deserializeStacks()).toEqual({});
  });
});

describe('getOrCreateStack', () => {
  test('不存在时创建新栈', () => {
    const stacks: Record<string, UndoRedo<number>> = {};
    const stack = getOrCreateStack(stacks, 'a');
    expect(stack).toBeInstanceOf(UndoRedo);
    expect(stacks.a).toBe(stack);
  });

  test('已存在时返回原栈', () => {
    const existing = new UndoRedo<number>();
    existing.pushElement(1);
    const stacks = { a: existing };
    expect(getOrCreateStack(stacks, 'a')).toBe(existing);
    expect(getOrCreateStack(stacks, 'a').getLength()).toBe(1);
  });
});

describe('undoFloor', () => {
  test('空栈返回 0', () => {
    expect(undoFloor(new UndoRedo<StepValue>())).toBe(0);
  });

  test('无 initial 基线返回 0', () => {
    const undoRedo = new UndoRedo<StepValue>();
    undoRedo.pushElement({ opType: 'add', diff: [] } as unknown as StepValue);
    expect(undoFloor(undoRedo)).toBe(0);
  });

  test('index 0 为 initial 时返回 1', () => {
    const undoRedo = new UndoRedo<StepValue>();
    undoRedo.pushElement({ opType: 'initial', diff: [] } as unknown as StepValue);
    undoRedo.pushElement({ opType: 'update', diff: [] } as unknown as StepValue);
    expect(undoFloor(undoRedo)).toBe(1);
  });
});
