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

import type {
  BaseStepValue,
  HistoryOpSource,
  PageHistoryGroup,
  PageHistoryStepEntry,
  StackHistoryGroup,
  StepDiffItem,
  StepValue,
} from '@editor/type';

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
 * - 仅负责构造 step 并返回，入栈与事件 emit 由各公共方法（pushCodeBlock / pushDataSource）自行处理。
 * - 不直接驱动业务 service，调用方负责实际写回。
 */
export const createStackStep = <T, S extends BaseStepValue<T> & { id: Id }>(
  id: Id,
  payload: {
    oldValue: T | null;
    newValue: T | null;
    changeRecords?: ChangeRecord[];
    historyDescription?: string;
    source?: HistoryOpSource;
  },
): S | null => {
  if (!id) return null;

  const oldSchema = payload.oldValue ? cloneDeep(payload.oldValue) : null;
  const newSchema = payload.newValue ? cloneDeep(payload.newValue) : null;
  const changeRecords = payload.changeRecords?.length ? cloneDeep(payload.changeRecords) : undefined;
  const opType = detectStackOpType(payload.oldValue, payload.newValue);

  const step: BaseStepValue<T> & { id: Id } = {
    uuid: guid(),
    id,
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
    timestamp: Date.now(),
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
 * 把单个「按 id 分栈」的历史栈（代码块 / 数据源）拆成若干 group：
 * 每条操作记录独立成组，不做相邻 update 合并（与页面历史的合并策略不同）。
 *
 * 代码块与数据源除 `kind` 外结构完全一致，统一由本方法处理；`kind` 决定返回的具体分组类型。
 */
export const mergeStackSteps = <S extends BaseStepValue, K extends 'code-block' | 'data-source'>(
  kind: K,
  id: Id,
  list: S[],
  cursor: number,
): StackHistoryGroup<S, K>[] => {
  const currentIndex = cursor - 1;
  return list.map((step, index) => {
    const applied = index < cursor;
    const isCurrent = index === currentIndex;
    return {
      kind,
      id,
      opType: step.opType,
      steps: [{ step, index, applied, isCurrent }],
      applied,
      isCurrent,
    };
  });
};

/**
 * 把页面栈拆成若干 group：
 * - 单节点的 'update' 按 targetId 与相邻同 targetId 的 update 合并到一个 group；
 * - 'add' / 'remove' 始终独立成组（语义上是结构变更，不应被收纳进单节点修改组）；
 * - 多节点 'update'（如批量改属性）也独立成组（无明确单一目标，避免误合并）。
 */
export const mergePageSteps = (pageId: Id, list: StepValue[], cursor: number): PageHistoryGroup[] => {
  const groups: PageHistoryGroup[] = [];
  let current: PageHistoryGroup | null = null;
  const currentIndex = cursor - 1;
  list.forEach((step, index) => {
    const applied = index < cursor;
    const isCurrent = index === currentIndex;
    const targetId = detectPageTargetId(step);
    const targetName = detectPageTargetName(step);
    const entry: PageHistoryStepEntry = { step, index, applied, isCurrent };

    // 仅"单节点 update"参与合并；其它情形（add/remove/多节点 update）始终独立成组。
    const mergeable = step.opType === 'update' && targetId !== undefined;
    if (mergeable && current?.opType === 'update' && current.targetId === targetId) {
      current.steps.push(entry);
      current.applied = applied;
      if (isCurrent) current.isCurrent = true;
      // 保持目标名为最近一次的（节点重命名时也能反映）
      if (targetName) current.targetName = targetName;
    } else {
      current = {
        kind: 'page',
        pageId,
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
 * 解析 StepValue 中的"目标节点 id"用于合并：
 * - 单节点 update：取唯一一项 updatedItems 的节点 id；
 * - 其它情形（多节点 update / add / remove）：返回 undefined，表示不参与合并。
 */
export const detectPageTargetId = (step: StepValue): Id | undefined => {
  if (step.opType !== 'update') return undefined;
  const items = step.diff;
  if (items?.length !== 1) return undefined;
  return items[0].newSchema?.id ?? items[0].oldSchema?.id;
};

/** 解析 StepValue 中的目标节点可读名（用于 UI 展示）。 */
export const detectPageTargetName = (step: StepValue): string | undefined => {
  const items = step.diff;
  if (step.opType === 'update') {
    if (items?.length === 1) {
      const node = items[0].newSchema || items[0].oldSchema;
      return (node?.name as string) || (node?.type as string) || (node?.id !== undefined ? `${node.id}` : undefined);
    }
    return items?.length ? `${items.length} 个节点` : undefined;
  }
  if (step.opType === 'add') {
    if (items?.length === 1) {
      const n = items[0].newSchema;
      return (n?.name as string) || (n?.type as string) || `${n?.id}`;
    }
    return items?.length ? `${items.length} 个节点` : undefined;
  }
  if (step.opType === 'remove') {
    if (items?.length === 1) {
      const n = items[0].oldSchema;
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
 * 撤销下限：当页面栈 index 0 是 `opType: 'initial'` 的基线 step 时为 1（基线不可被撤销），否则为 0。
 * 用于把 cursor 钉在基线之上，保证 undo / canUndo / goto 都不会越过初始基线。
 */
export const undoFloor = (undoRedo: UndoRedo<StepValue>): number => {
  return undoRedo.getElementList()[0]?.opType === 'initial' ? 1 : 0;
};

/** 将单次 push 产生的 history uuid（或 null）转为 *AndGetHistoryId 返回用的 uuid 列表。 */
export const getLastPushedHistoryIds = (historyId: string | null): string[] => (historyId ? [historyId] : []);
