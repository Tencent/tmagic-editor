/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { cloneDeep } from 'lodash-es';
import serialize from 'serialize-javascript';

import type { Id } from '@tmagic/core';
import type { ChangeRecord } from '@tmagic/form';
import { guid } from '@tmagic/utils';

import type { BaseStepValue, HistoryGroup, StepDiffItem } from '@editor/type';

import { UndoRedo } from './undo-redo';

/**
 * 「回滚」生成的新 step 简短描述。代码块 / 数据源共用。
 * 二者逻辑一致，仅展示名取值字段不同（代码块取 `name`，数据源取 `title`），
 * 因此通过 `getLabel` 注入取值方式。
 *
 * @param id 关联的代码块 / 数据源 id
 * @param diff 单条变更 diff（缺省视为空）
 * @param getLabel 从快照取展示名
 */
export const describeRevertStep = <T extends object>(
  id: Id,
  { oldSchema, newSchema, changeRecords }: StepDiffItem<T> = {},
  getLabel: (schema: T) => string | undefined,
): string => {
  const labelOf = (schema: T) => getLabel(schema) || (schema as { id?: Id }).id;
  if (!oldSchema && newSchema) return `撤回新增 ${labelOf(newSchema) || id}`;
  if (oldSchema && !newSchema) return `还原已删除的 ${labelOf(oldSchema) || id}`;
  const label = (newSchema && getLabel(newSchema)) || (oldSchema && getLabel(oldSchema)) || `${id}`;
  const propPath = changeRecords?.[0]?.propPath;
  return propPath ? `还原 ${label} · ${propPath}` : `还原 ${label}`;
};

/**
 * 根据 old/new 是否为 null 推断 opType（与 push 时的约定一致）。
 */
export const detectStackOpType = (oldVal: unknown, newVal: unknown): 'add' | 'remove' | 'update' => {
  if (oldVal === null && newVal !== null) return 'add';
  if (oldVal !== null && newVal === null) return 'remove';
  return 'update';
};

/**
 * 构造一条代码块 / 数据源「按 id 分栈」的历史记录：两者除 payload 字段命名外完全一致。
 *
 * - `add`：oldValue = null；`remove`：newValue = null；`update`：两者都有，可带 changeRecords 做局部更新。
 * - 内容会做 cloneDeep 防止后续被外部引用篡改；opType 依据 old/new 是否为 null 推断。
 * - 仅负责构造 step 并返回，入栈与事件 emit 由统一的 history.push(stepType, step, id) 处理。
 * - 不直接驱动业务 service，调用方负责实际写回。
 */
export const createStackStep = <T, S extends BaseStepValue<T>>(
  id: Id,
  // payload 以 {@link BaseStepValue} 为基础：透传字段（historyDescription / source / operator / rootStep / extra）
  // 随 BaseStepValue 演进自动同步，原样写入 step；自动生成字段（uuid / data / opType / diff / timestamp / saved）
  // 从 payload 中排除，由本方法内部构造。oldValue / newValue / changeRecords / name 为构造 diff 与 data 用的输入。
  payload: Omit<BaseStepValue<T>, 'uuid' | 'data' | 'opType' | 'diff' | 'timestamp' | 'saved'> & {
    oldValue: T | null;
    newValue: T | null;
    changeRecords?: ChangeRecord[];
    /** 展示名（缺省时从快照 name / title 推断）。 */
    name?: string;
  },
): S | null => {
  if (!id) return null;

  const oldSchema = payload.oldValue ? cloneDeep(payload.oldValue) : null;
  const newSchema = payload.newValue ? cloneDeep(payload.newValue) : null;
  const changeRecords = payload.changeRecords?.length ? cloneDeep(payload.changeRecords) : undefined;
  const opType = detectStackOpType(payload.oldValue, payload.newValue);
  // 展示名：代码块取 name，数据源取 title，取不到则留空（不影响 undo/redo，仅用于展示）。
  const schema = (payload.newValue ?? payload.oldValue) as { name?: string; title?: string } | null;
  const name = payload.name ?? schema?.name ?? schema?.title ?? '';

  const step: BaseStepValue<T> = {
    uuid: guid(),
    data: { name, id },
    opType,
    diff: [
      {
        ...(newSchema !== null ? { newSchema } : {}),
        ...(oldSchema !== null ? { oldSchema } : {}),
        ...(opType === 'update' && changeRecords ? { changeRecords } : {}),
      },
    ],
    historyDescription: payload.historyDescription,
    source: payload.source,
    operator: payload.operator,
    rootStep: payload.rootStep,
    timestamp: Date.now(),
    extra: payload.extra,
  };

  return step as S;
};

export const markStackSaved = <S extends { saved?: boolean }>(undoRedo?: UndoRedo<S>): void => {
  if (!undoRedo) return;
  undoRedo.updateElements((element) => {
    element.saved = false;
  });
  undoRedo.updateCurrentElement((element) => {
    element.saved = true;
  });
};

/**
 * 把单个历史栈（页面 / 代码块 / 数据源 / 扩展类型）的步骤列表按"目标"做相邻合并：
 * - 单实体的 'update' 按 targetId 与相邻同 targetId 的 update 合并到一个 group，组内可展开查看每步；
 * - 'add' / 'remove' 始终独立成组（语义上是结构变更，不应被收纳进单实体修改组）；
 * - 多实体 'update'（如页面批量改属性）也独立成组（无明确单一目标，避免误合并）。
 *
 * 各类型行为完全一致，仅 `kind` 与 step 快照类型不同，统一由本方法处理。
 */
export const mergeSteps = <T extends BaseStepValue>(
  kind: string,
  id: Id,
  list: T[],
  cursor: number,
): HistoryGroup<T>[] => {
  const groups: HistoryGroup<T>[] = [];
  let current: HistoryGroup<T> | null = null;
  const currentIndex = cursor - 1;
  list.forEach((step, index) => {
    const applied = index < cursor;
    const isCurrent = index === currentIndex;
    const targetId = detectTargetId(step);
    const targetName = detectTargetName(step);
    const entry = { step, index, applied, isCurrent };

    // 仅"单实体 update"参与合并；其它情形（add/remove/多实体 update）始终独立成组。
    const mergeable = step.opType === 'update' && targetId !== undefined;
    if (mergeable && current?.opType === 'update' && current.targetId === targetId) {
      current.steps.push(entry);
      current.applied = applied;
      if (isCurrent) current.isCurrent = true;
      // 保持目标名为最近一次的（重命名时也能反映）
      if (targetName) current.targetName = targetName;
    } else {
      current = {
        kind,
        id,
        opType: step.opType,
        targetId: mergeable ? targetId : undefined,
        targetName,
        steps: [entry],
        applied,
        isCurrent,
      };
      groups.push(current);
    }
  });
  return groups;
};

/**
 * 解析 step 中的"目标 id"用于合并：
 * - 单实体 update：取唯一一项 diff 的快照 id；快照无 id 时（如 CodeBlockContent）回退到 `step.data.id`
 *   （即资源 id），使代码块 / 数据源同样能按资源合并相邻 update；
 * - 其它情形（多实体 update / add / remove）：返回 undefined，表示不参与合并。
 */
export const detectTargetId = (step: BaseStepValue): Id | undefined => {
  if (step.opType !== 'update') return undefined;
  const items = step.diff;
  if (items?.length !== 1) return undefined;
  const newSchema = items[0].newSchema as { id?: Id } | undefined;
  const oldSchema = items[0].oldSchema as { id?: Id } | undefined;
  return newSchema?.id ?? oldSchema?.id ?? step.data?.id;
};

/** 解析 step 中的目标可读名（用于 UI 展示）。 */
export const detectTargetName = (step: BaseStepValue): string | undefined => {
  const items = step.diff;
  if (step.opType === 'update') {
    if (items?.length === 1) {
      const node = (items[0].newSchema || items[0].oldSchema) as { name?: string; type?: string; id?: Id } | undefined;
      return (node?.name as string) || (node?.type as string) || (node?.id !== undefined ? `${node.id}` : undefined);
    }
    return items?.length ? `${items.length} 个节点` : undefined;
  }
  if (step.opType === 'add') {
    if (items?.length === 1) {
      const n = items[0].newSchema as { name?: string; type?: string; id?: Id } | undefined;
      return (n?.name as string) || (n?.type as string) || `${n?.id}`;
    }
    return items?.length ? `${items.length} 个节点` : undefined;
  }
  if (step.opType === 'remove') {
    if (items?.length === 1) {
      const n = items[0].oldSchema as { name?: string; type?: string; id?: Id } | undefined;
      return (n?.name as string) || (n?.type as string) || `${n?.id}`;
    }
    return items?.length ? `${items.length} 个节点` : undefined;
  }
  return undefined;
};

/**
 * 把 `Record<Id, UndoRedo>` 整体序列化为 `Record<Id, SerializedUndoRedo>`。
 *
 * 序列化（深克隆）的同一趟里，只把每条 step 中可能含函数的 `diff` 用 serialize-javascript 序列化成字符串，
 * 其余字段（uuid / opType / timestamp / `modifiedNodeIds` Map 等）原样保留，交给 IndexedDB 结构化克隆。
 * 这样既能写入函数，又避免序列化整份快照的开销；读取时再由 {@link parseStacksStepDiff} 还原 diff。
 * 不含 `diff` 的元素（如通用栈）原样透传。
 */
export const serializeStacks = <T extends { diff?: unknown }>(stacks: Record<Id, UndoRedo<T>>) => {
  const result: Record<Id, ReturnType<UndoRedo<T>['serialize']>> = {};
  Object.entries(stacks).forEach(([id, undoRedo]) => {
    if (!undoRedo) return;
    const serialized = undoRedo.serialize();
    result[id] = {
      ...serialized,
      elementList: serialized.elementList.map((step) =>
        step.diff === undefined ? step : Object.assign({}, step, { diff: serialize(step.diff) }),
      ),
    };
  });
  return result;
};

/**
 * 把 `Record<Id, SerializedUndoRedo>` 整体还原为 `Record<Id, UndoRedo>`。
 * 还原时把每个栈的游标定位到最近一条已保存（`saved === true`）记录之后。
 *
 * 与 {@link serializeStacks} 相反：当传入 `parse`（parseDSL）时，把每条 step 中以字符串形式存储的 `diff`
 * 解析回真实对象（含函数）；不含 `diff` 的元素（如通用栈）原样透传。
 */
export const deserializeStacks = <T extends { saved?: boolean }>(
  stacks: Record<Id, ReturnType<UndoRedo<T>['serialize']>> = {},
  parse?: (serialized: string) => unknown,
): Record<Id, UndoRedo<T>> => {
  const result: Record<Id, UndoRedo<T>> = {};
  Object.entries(stacks).forEach(([id, serialized]) => {
    if (!serialized) return;
    const elementList = parse
      ? serialized.elementList.map((step) => {
          const { diff } = step as { diff?: unknown };
          return typeof diff === 'string' ? Object.assign({}, step, { diff: parse(`(${diff})`) }) : step;
        })
      : serialized.elementList;
    result[id] = UndoRedo.fromSerialized<T>(
      { ...serialized, elementList },
      { isSavedStep: (element) => element.saved === true },
    );
  });
  return result;
};

/**
 * 按 id 从「按 id 分栈」的记录表（代码块 / 数据源）中获取（或创建）对应的 UndoRedo 栈。
 */
export const getOrCreateStack = <T>(stacks: Record<Id, UndoRedo<T>>, id: Id): UndoRedo<T> => {
  if (!stacks[id]) {
    stacks[id] = new UndoRedo<T>();
  }
  return stacks[id];
};

/**
 * 撤销下限：当栈 index 0 是 `opType: 'initial'` 的基线 step 时为 1（基线不可被撤销），否则为 0。
 * 适用于所有历史类型（page / codeBlock / dataSource / 扩展），把 cursor 钉在基线之上，
 * 保证 undo / canUndo / goto 都不会越过初始基线。
 */
export const undoFloor = (undoRedo: UndoRedo<any>): number => {
  return undoRedo.getElementList()[0]?.opType === 'initial' ? 1 : 0;
};

/** 将单次 push 产生的 history uuid（或 null）转为 *AndGetHistoryId 返回用的 uuid 列表。 */
export const getLastPushedHistoryIds = (historyId: string | null): string[] => (historyId ? [historyId] : []);
