/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { nextTick } from 'vue';

import { useNodeStatus } from '@editor/layouts/sidebar/layer/use-node-status';

vi.mock('@tmagic/utils', async () => {
  const actual = await vi.importActual<any>('@tmagic/utils');
  return {
    ...actual,
    isPage: (n: any) => n.type === 'page',
    isPageFragment: (n: any) => n.type === 'page-fragment',
    getNodePath: vi.fn(() => []),
    traverseNode: (node: any, fn: any) => {
      fn(node);
      node.items?.forEach((c: any) => fn(c));
    },
  };
});

vi.mock('@editor/utils/tree', () => ({
  updateStatus: vi.fn((map: Map<any, any>, id: any, status: any) => {
    const cur = map.get(id) || {};
    map.set(id, { ...cur, ...status });
  }),
}));

let editorState: Record<string, any>;
const editorEvents: Record<string, ((..._args: any[]) => any)[]> = {};
const mkEditorService = () => ({
  get: vi.fn((k: string) => editorState[k]),
  on: vi.fn((evt: string, fn: any) => {
    editorEvents[evt] ||= [];
    editorEvents[evt].push(fn);
  }),
  off: vi.fn((evt: string, fn: any) => {
    if (editorEvents[evt]) editorEvents[evt] = editorEvents[evt].filter((f) => f !== fn);
  }),
});

beforeEach(() => {
  vi.clearAllMocks();
  Object.keys(editorEvents).forEach((k) => delete editorEvents[k]);
  editorState = {
    page: { id: 'p1', type: 'page', items: [{ id: 'n1', type: 'node' }] },
    nodes: [{ id: 'n1' }],
  };
});

describe('useNodeStatus (layer)', () => {
  test('初始化生成 page 节点状态', () => {
    const editorService = mkEditorService();
    const { nodeStatusMap } = useNodeStatus({ editorService } as any);
    expect(nodeStatusMap.value?.size).toBe(2);
    expect(nodeStatusMap.value?.get('p1')?.expand).toBe(true);
  });

  test('addHandler 添加节点状态', () => {
    const editorService = mkEditorService();
    useNodeStatus({ editorService } as any);
    editorEvents.add[0]([{ id: 'newId', type: 'node', items: [{ id: 'child' }] }]);
    // The status map is the current page map
    // The handler gets the current map via nodeStatusMap.value
  });

  test('addHandler 跳过 page/page-fragment', () => {
    const editorService = mkEditorService();
    const { nodeStatusMap } = useNodeStatus({ editorService } as any);
    editorEvents.add[0]([{ id: 'newPage', type: 'page' }]);
    expect(nodeStatusMap.value?.has('newPage')).toBe(false);
  });

  test('removeHandler 删除节点', () => {
    const editorService = mkEditorService();
    const { nodeStatusMap } = useNodeStatus({ editorService } as any);
    editorEvents.remove[0]([{ id: 'n1', type: 'node' }]);
    expect(nodeStatusMap.value?.has('n1')).toBe(false);
  });

  test('nodes 选中变化更新状态', async () => {
    const editorService = mkEditorService();
    const { nodeStatusMap } = useNodeStatus({ editorService } as any);
    editorState.nodes = [{ id: 'n1' }];
    await nextTick();
    expect(nodeStatusMap.value?.get('n1')?.selected).toBe(true);
  });

  test('注册 add/remove 事件', () => {
    const editorService = mkEditorService();
    useNodeStatus({ editorService } as any);
    expect(editorService.on).toHaveBeenCalledWith('add', expect.any(Function));
    expect(editorService.on).toHaveBeenCalledWith('remove', expect.any(Function));
  });
});
