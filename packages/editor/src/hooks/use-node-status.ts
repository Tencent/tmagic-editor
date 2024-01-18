import { ComputedRef, ref, watch } from 'vue';

import type { Id, MNode } from '@tmagic/schema';

import { LayerNodeStatus, TreeNodeData } from '@editor/type';
import { traverseNode } from '@editor/utils';

const createPageNodeStatus = (nodeData: TreeNodeData[], initialLayerNodeStatus?: Map<Id, LayerNodeStatus>) => {
  const map = new Map<Id, LayerNodeStatus>();

  nodeData.forEach((node: MNode) =>
    traverseNode(node, (node) => {
      map.set(
        node.id,
        initialLayerNodeStatus?.get(node.id) || {
          visible: true,
          expand: false,
          selected: false,
          draggable: false,
        },
      );
    }),
  );

  return map;
};

export const useNodeStatus = (nodeData: ComputedRef<TreeNodeData[]>) => {
  /** 所有页面的节点状态 */
  const nodeStatusMap = ref(new Map<Id, LayerNodeStatus>());

  // 切换页面或者新增页面，重新生成节点状态
  watch(
    nodeData,
    (nodeData) => {
      // 生成节点状态
      nodeStatusMap.value = createPageNodeStatus(nodeData, nodeStatusMap.value);
    },
    {
      immediate: true,
      deep: true,
    },
  );

  return {
    nodeStatusMap,
  };
};
