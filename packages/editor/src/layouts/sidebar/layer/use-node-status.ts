import { computed, onBeforeUnmount, ref, watch } from 'vue';

import type { Id, MApp, MNode, MPage, MPageFragment } from '@tmagic/core';
import { getNodePath, isPage, isPageFragment, traverseNode } from '@tmagic/utils';

import type { LayerNodeStatus, Services } from '@editor/type';
import { updateStatus } from '@editor/utils/tree';

const createPageNodeStatus = (page: MPage | MPageFragment, initialLayerNodeStatus?: Map<Id, LayerNodeStatus>) => {
  const map = new Map<Id, LayerNodeStatus>();

  map.set(
    page.id,
    initialLayerNodeStatus?.get(page.id) || {
      visible: true,
      expand: true,
      selected: true,
      draggable: false,
    },
  );

  page.items.forEach((node: MNode) =>
    traverseNode<MNode>(node, (node) => {
      map.set(
        node.id,
        initialLayerNodeStatus?.get(node.id) || {
          visible: true,
          expand: false,
          selected: false,
          draggable: true,
        },
      );
    }),
  );

  return map;
};

export const useNodeStatus = ({ editorService }: Services) => {
  const page = computed(() => editorService.get('page'));
  const nodes = computed(() => editorService.get('nodes'));

  /** 所有页面的节点状态 */
  const nodeStatusMaps = ref(new Map<Id, Map<Id, LayerNodeStatus>>());

  /** 当前页面的节点状态 */
  const nodeStatusMap = computed(() =>
    page.value ? nodeStatusMaps.value.get(page.value.id) : new Map<Id, LayerNodeStatus>(),
  );

  // 切换页面 / 新增页面 / 整体替换 dsl 后 page 引用变化时，重新生成节点状态。
  //
  // 注意这里 watch 的是 page 引用而不是 page.id：
  // 历史版本恢复 / 外部 modelValue 整体覆盖等场景，新旧 dsl 的 page.id 通常完全
  // 一致，但 page 对象引用是新的、items 也是新的。仅监听 id 会漏掉这类「同 id
  // 不同内容」的替换，导致 nodeStatusMaps 残留旧节点 status，组件树渲染滞留在
  // 旧版本。监听引用可以覆盖普通切页（不同 id）和整体替换（同 id 新引用）两种
  // 情况；同时配合下方 root-change 时清空缓存，避免拿到污染的 initial status。
  watch(
    page,
    (newPage) => {
      if (!newPage?.id) {
        return;
      }

      // 生成节点状态
      nodeStatusMaps.value.set(newPage.id, createPageNodeStatus(newPage, nodeStatusMaps.value.get(newPage.id)));
    },
    {
      immediate: true,
    },
  );

  /**
   * root 整体被替换时（外部 modelValue 变化、历史版本恢复、套件编辑模式进入/退出等）：
   * - 仅 watch page 引用还不够，因为 root-change 同步触发时 page 还是旧引用，
   *   等 initService 的异步 IIFE 跑完 editorService.select(...) 后 page 才会
   *   被替换为新 dsl 中的 page；此时上面的 page watch 才会触发重建。
   * - 但若直接同步清空 nodeStatusMaps，会让 nodeStatusMap (computed) 立刻变
   *   undefined。上层 LayerPanel 用 `v-if="page && nodeStatusMap"` 渲染组件树，
   *   会瞬间销毁整个面板；若紧接着的异步 select 链路（套件退出等场景）发生
   *   竞态、page 引用未变 / 解析失败，watch(page) 不触发重建，组件树就再也回
   *   不来。
   * - 此外「污染」问题本质来自 createPageNodeStatus 用旧 status 作为新节点
   *   initial 值：只要新 root 的 page 是新引用，watch(page) 会触发重建，重建
   *   时基于新 page.items 生成的 map 只会包含新节点 id；旧节点 id 即便残留在
   *   initialLayerNodeStatus 中也不会被写入新 map。真正的风险只有「同一 page
   *   id 下，新旧 dsl 都存在同一节点 id 但其实是不同节点」这种极端情况——这
   *   在常规业务中不会发生（id 是 uuid）。
   *
   * 综合：root-change 时仅清理「在新 root 中已不存在的 page id」对应缓存，
   * 保留仍然有效的 page status 不动；既避免 v-if 闪断，也不会保留无关 page 的
   * 死缓存。同 page id 的重建交给下方 watch(page) 触发。
   */
  const rootChangeHandler = (value: MApp | null) => {
    if (!value) {
      nodeStatusMaps.value = new Map();
      return;
    }

    const validPageIds = new Set<Id>();
    (value.items || []).forEach((p) => {
      if (p?.id !== undefined) validPageIds.add(p.id);
    });

    for (const cachedPageId of Array.from(nodeStatusMaps.value.keys())) {
      if (!validPageIds.has(cachedPageId)) {
        nodeStatusMaps.value.delete(cachedPageId);
      }
    }
  };

  editorService.on('root-change', rootChangeHandler);

  // 选中状态变化，更新节点状态
  watch(
    nodes,
    (nodes) => {
      if (!nodeStatusMap.value) return;

      for (const [id, status] of nodeStatusMap.value.entries()) {
        status.selected = nodes.some((node) => node.id === id);
        if (status.selected) {
          getNodePath(id, page.value?.items).forEach((node) => {
            updateStatus(nodeStatusMap.value!, node.id, {
              expand: true,
            });
          });
        }
      }
    },
    {
      immediate: true,
    },
  );

  const addHandler = (newNodes: MNode[]) => {
    newNodes.forEach((node) => {
      if (isPage(node) || isPageFragment(node)) return;

      traverseNode(node, (node: MNode) => {
        nodeStatusMap.value?.set(node.id, {
          visible: true,
          expand: Array.isArray(node.items),
          selected: true,
          draggable: true,
        });
      });
    });
  };

  editorService.on('add', addHandler);

  const removeHandler = (nodes: MNode[]) => {
    nodes.forEach((node) => {
      traverseNode(node, (node: MNode) => {
        nodeStatusMap.value?.delete(node.id);
      });
    });
  };

  editorService.on('remove', removeHandler);

  onBeforeUnmount(() => {
    editorService.off('root-change', rootChangeHandler);
    editorService.off('remove', removeHandler);
    editorService.off('add', addHandler);
  });

  return {
    nodeStatusMaps,
    nodeStatusMap,
  };
};
