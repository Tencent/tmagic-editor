// @vitest-environment node
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
import { describe, expect, test } from 'vitest';

import type { Id } from '@tmagic/core';

import type { LayerNodeStatus, TreeNodeData } from '@editor/type';
import { defaultIsExpandable, updateStatus } from '@editor/utils/tree';

const buildStatus = (overrides: Partial<LayerNodeStatus> = {}): LayerNodeStatus => ({
  visible: true,
  expand: false,
  selected: false,
  draggable: false,
  ...overrides,
});

const buildStatusMap = (entries: [Id, Partial<LayerNodeStatus>][]): Map<Id, LayerNodeStatus> => {
  const map = new Map<Id, LayerNodeStatus>();
  entries.forEach(([id, status]) => map.set(id, buildStatus(status)));
  return map;
};

describe('defaultIsExpandable', () => {
  test('节点没有 items 时返回 false', () => {
    const data: TreeNodeData = { id: 'node_1' };
    const statusMap = buildStatusMap([['node_1', { visible: true }]]);

    expect(defaultIsExpandable(data, statusMap)).toBe(false);
  });

  test('items 为空数组时返回 false', () => {
    const data: TreeNodeData = { id: 'node_1', items: [] };
    const statusMap = buildStatusMap([['node_1', { visible: true }]]);

    expect(defaultIsExpandable(data, statusMap)).toBe(false);
  });

  test('items 中存在至少一个可见子节点时返回 true', () => {
    const data: TreeNodeData = {
      id: 'parent_1',
      items: [{ id: 'child_1' }, { id: 'child_2' }],
    };
    const statusMap = buildStatusMap([
      ['parent_1', { visible: true }],
      ['child_1', { visible: false }],
      ['child_2', { visible: true }],
    ]);

    expect(defaultIsExpandable(data, statusMap)).toBe(true);
  });

  test('所有子节点都不可见时返回 false（被搜索过滤的场景）', () => {
    const data: TreeNodeData = {
      id: 'parent_1',
      items: [{ id: 'child_1' }, { id: 'child_2' }],
    };
    const statusMap = buildStatusMap([
      ['parent_1', { visible: true }],
      ['child_1', { visible: false }],
      ['child_2', { visible: false }],
    ]);

    expect(defaultIsExpandable(data, statusMap)).toBe(false);
  });

  test('子节点状态在 statusMap 中缺失时视为不可见', () => {
    const data: TreeNodeData = {
      id: 'parent_1',
      items: [{ id: 'child_1' }],
    };
    const statusMap = buildStatusMap([['parent_1', { visible: true }]]);

    expect(defaultIsExpandable(data, statusMap)).toBe(false);
  });

  test('items 不是数组时返回 false', () => {
    const data: TreeNodeData = { id: 'node_1', items: undefined };
    const statusMap = buildStatusMap([['node_1', { visible: true }]]);

    expect(defaultIsExpandable(data, statusMap)).toBe(false);
  });
});

describe('updateStatus', () => {
  test('更新已存在节点的部分状态字段', () => {
    const statusMap = buildStatusMap([['node_1', { visible: true, expand: false, selected: false, draggable: false }]]);

    updateStatus(statusMap, 'node_1', { expand: true, selected: true });

    expect(statusMap.get('node_1')).toEqual({
      visible: true,
      expand: true,
      selected: true,
      draggable: false,
    });
  });

  test('节点不存在时静默返回，不抛错', () => {
    const statusMap = buildStatusMap([]);

    expect(() => updateStatus(statusMap, 'node_missing', { expand: true })).not.toThrow();
    expect(statusMap.has('node_missing')).toBe(false);
  });

  test('忽略状态对象中值为 undefined 的字段', () => {
    const statusMap = buildStatusMap([['node_1', { visible: true, expand: true }]]);

    updateStatus(statusMap, 'node_1', { expand: undefined, selected: true });

    const status = statusMap.get('node_1')!;
    expect(status.expand).toBe(true);
    expect(status.selected).toBe(true);
  });

  test('将传入的非 boolean 值强制转换为 boolean', () => {
    const statusMap = buildStatusMap([['node_1', { visible: false }]]);

    updateStatus(statusMap, 'node_1', { visible: 1 as unknown as boolean });

    expect(statusMap.get('node_1')?.visible).toBe(true);
  });
});
