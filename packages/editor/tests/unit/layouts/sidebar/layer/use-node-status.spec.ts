/*
 * Tencent is pleased to support the open source community by making TMagicEditor available.
 *
 * Copyright (C) 2025 Tencent.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { nextTick, reactive } from 'vue';

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

// editorState 用 reactive 让 useNodeStatus 内 `computed(() => editorService.get('page'))`
// 等读取能建立响应式依赖；测试用例对 editorState.page / nodes 重新赋值时，
// 相关 watch 才会按预期触发，避免测试通过仅靠 immediate 副作用而失去回归价值。
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
  editorState = reactive({
    page: { id: 'p1', type: 'page', items: [{ id: 'n1', type: 'node' }] },
    nodes: [{ id: 'n1' }],
  });
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

  test('注册 root-change 事件', () => {
    const editorService = mkEditorService();
    useNodeStatus({ editorService } as any);
    expect(editorService.on).toHaveBeenCalledWith('root-change', expect.any(Function));
  });

  // 历史版本恢复 / 外部 modelValue 整体覆盖：page.id 不变但 page 引用与 items 全换。
  // 仅 watch page.id 时 nodeStatusMaps 不会重建并残留旧节点 id；
  // 现在 watch page 引用 + root-change 时清缓存，能让组件树跟随新 dsl 重建。
  test('root 整体替换（page.id 不变）后 nodeStatusMap 跟随新 dsl 重建', async () => {
    const editorService = mkEditorService();
    const { nodeStatusMap } = useNodeStatus({ editorService } as any);

    // 初始：旧 dsl 含 n1
    expect(nodeStatusMap.value?.has('n1')).toBe(true);
    expect(nodeStatusMap.value?.has('n2')).toBe(false);

    // 模拟 root 整体被替换：先派发 root-change，再把 page 切换到
    // 「同 id 但 items 全新」的对象（异步 select 后效果）。
    // 新 root 中 p1 仍然存在，root-change 不会清掉 p1 缓存；
    // 真正的重建由下面 page 引用变化触发的 watch(page) 完成。
    editorEvents['root-change'][0]({
      id: 'app',
      items: [{ id: 'p1', type: 'page', items: [{ id: 'n2', type: 'node' }] }],
    });
    editorState.page = { id: 'p1', type: 'page', items: [{ id: 'n2', type: 'node' }] };
    await nextTick();

    expect(nodeStatusMap.value?.has('n1')).toBe(false);
    expect(nodeStatusMap.value?.has('n2')).toBe(true);
    expect(nodeStatusMap.value?.get('p1')?.expand).toBe(true);
  });

  // 套件编辑模式进入/退出场景：set('root', ...) 同步触发 root-change，但 page
  // 引用要等 initService 的异步 IIFE 跑完 editorService.select(...) 才会换。
  // root-change 当下不能让 nodeStatusMap 变 undefined（否则 LayerPanel 的
  // `v-if="page && nodeStatusMap"` 会瞬间销毁组件树；若后续异步 select 因竞态
  // 没让 page 引用变化，watch(page) 不触发重建，组件树就再也回不来）。
  test('root-change 同步阶段（page 引用未变）nodeStatusMap 不应变 undefined', () => {
    const editorService = mkEditorService();
    const { nodeStatusMap } = useNodeStatus({ editorService } as any);

    expect(nodeStatusMap.value?.has('p1')).toBe(true);

    // 模拟 set('root', ...) 同步触发 root-change，但 page 引用还来不及切。
    // 新 root 中 p1 仍然存在，因此 p1 的 status 缓存必须被保留。
    editorEvents['root-change'][0]({
      id: 'app',
      items: [{ id: 'p1', type: 'page', items: [{ id: 'n1', type: 'node' }] }],
    });

    expect(nodeStatusMap.value).toBeDefined();
    expect(nodeStatusMap.value?.has('p1')).toBe(true);
  });

  // 新 root 中已不存在的 page id 缓存需要清理，避免脏数据长期残留。
  test('root-change 后清理新 root 中不存在的 page 缓存', () => {
    const editorService = mkEditorService();
    const { nodeStatusMaps } = useNodeStatus({ editorService } as any);

    // 手动塞一个无关 page 缓存，模拟历史上访问过的另一个 page
    nodeStatusMaps.value.set('p_old', new Map());
    expect(nodeStatusMaps.value.has('p_old')).toBe(true);

    editorEvents['root-change'][0]({
      id: 'app',
      items: [{ id: 'p1', type: 'page', items: [] }],
    });

    expect(nodeStatusMaps.value.has('p_old')).toBe(false);
    expect(nodeStatusMaps.value.has('p1')).toBe(true);
  });

  // root 被置空（卸载 / 退出编辑器）时整体清空。
  test('root-change 传入 null 时整体清空缓存', () => {
    const editorService = mkEditorService();
    const { nodeStatusMaps } = useNodeStatus({ editorService } as any);

    expect(nodeStatusMaps.value.size).toBeGreaterThan(0);
    editorEvents['root-change'][0](null);
    expect(nodeStatusMaps.value.size).toBe(0);
  });
});
