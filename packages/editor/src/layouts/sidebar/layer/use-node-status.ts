import { computed, type ComputedRef, ref, watch } from 'vue';

import type { Id, MNode, MPage } from '@tmagic/schema';
import { getNodePath } from '@tmagic/utils';

import { LayerNodeStatus, Services } from '@editor/type';
import { traverseNode } from '@editor/utils';

import { updateStatus } from './use-filter';

const createPageNodeStatus = (services: Services | undefined, pageId: Id) => {
  const map = new Map<Id, LayerNodeStatus>();

  map.set(pageId, {
    visible: true,
    expand: true,
    selected: true,
  });

  services?.editorService.getNodeById(pageId)?.items.forEach((node: MNode) =>
    traverseNode(node, (node) => {
      map.set(node.id, {
        visible: true,
        expand: false,
        selected: false,
      });
    }),
  );

  return map;
};

export const useNodeStatus = (services: Services | undefined, page: ComputedRef<MPage | null | undefined>) => {
  const nodes = computed(() => services?.editorService.get('nodes') || []);

  /** 所有页面的节点状态 */
  const nodeStatusMaps = ref(new Map<Id, Map<Id, LayerNodeStatus>>());

  /** 当前页面的节点状态 */
  const nodeStatusMap = computed(() =>
    page.value ? nodeStatusMaps.value.get(page.value.id) : new Map<Id, LayerNodeStatus>(),
  );

  // 切换页面，重新生成节点状态
  watch(
    () => page.value?.id,
    (pageId) => {
      // 已经存在，不需要重新生成
      if (!pageId || nodeStatusMaps.value.has(pageId)) {
        return;
      }

      // 新增页面，生成节点状态
      nodeStatusMaps.value.set(pageId, createPageNodeStatus(services, pageId));
    },
    {
      immediate: true,
    },
  );

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

  services?.editorService.on('add', (newNodes: MNode[]) => {
    newNodes.forEach((node) => {
      nodeStatusMap.value?.set(node.id, {
        visible: true,
        expand: Array.isArray(node.items),
        selected: true,
      });
    });
  });

  services?.editorService.on('remove', (nodes: MNode[]) => {
    nodes.forEach((node) => {
      nodeStatusMap.value?.delete(node.id);
    });
  });

  return {
    nodeStatusMaps,
    nodeStatusMap,
  };
};
