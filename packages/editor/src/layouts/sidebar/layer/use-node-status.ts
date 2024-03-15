import { computed, ref, watch } from 'vue';

import type { Id, MNode, MPage, MPageFragment } from '@tmagic/schema';
import { getNodePath, isPage, isPageFragment } from '@tmagic/utils';

import { LayerNodeStatus, Services } from '@editor/type';
import { traverseNode } from '@editor/utils';
import { updateStatus } from '@editor/utils/tree';

const createPageNodeStatus = (page: MPage | MPageFragment, initialLayerNodeStatus?: Map<Id, LayerNodeStatus>) => {
  const map = new Map<Id, LayerNodeStatus>();

  map.set(page.id, {
    visible: true,
    expand: true,
    selected: true,
    draggable: false,
  });

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

export const useNodeStatus = (services: Services | undefined) => {
  const page = computed(() => services?.editorService.get('page'));
  const nodes = computed(() => services?.editorService.get('nodes') || []);

  /** 所有页面的节点状态 */
  const nodeStatusMaps = ref(new Map<Id, Map<Id, LayerNodeStatus>>());

  /** 当前页面的节点状态 */
  const nodeStatusMap = computed(() =>
    page.value ? nodeStatusMaps.value.get(page.value.id) : new Map<Id, LayerNodeStatus>(),
  );

  // 切换页面或者新增页面，重新生成节点状态
  watch(
    () => page.value?.id,
    (pageId) => {
      if (!pageId) {
        return;
      }

      // 生成节点状态
      nodeStatusMaps.value.set(pageId, createPageNodeStatus(page.value!, nodeStatusMaps.value.get(pageId)));
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
  });

  services?.editorService.on('remove', (nodes: MNode[]) => {
    nodes.forEach((node) => {
      traverseNode(node, (node: MNode) => {
        nodeStatusMap.value?.delete(node.id);
      });
    });
  });

  return {
    nodeStatusMaps,
    nodeStatusMap,
  };
};
