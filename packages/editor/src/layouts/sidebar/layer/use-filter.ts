import { type ComputedRef, ref } from 'vue';

import { Id, MNode, MPage } from '@tmagic/schema';

import { LayerNodeStatus } from '@editor/type';
import { traverseNode } from '@editor/utils';
import { updateStatus } from '@editor/utils/tree';

export const useFilter = (
  nodeStatusMap: ComputedRef<Map<Id, LayerNodeStatus> | undefined>,
  page: ComputedRef<MPage | null | undefined>,
) => {
  // tree方法：对树节点进行筛选时执行的方法
  const filterIsMatch = (value: string, data: MNode): boolean => {
    if (!value) {
      return true;
    }
    let name = '';
    if (data.name) {
      name = data.name;
    } else if (data.items) {
      name = 'container';
    }
    return `${data.id}${name}${data.type}`.includes(value);
  };

  const filterNode = (text: string) => (node: MNode, parents: MNode[]) => {
    if (!nodeStatusMap.value) return;

    const visible = filterIsMatch(text, node);
    if (visible && parents.length) {
      parents.forEach((parent) => {
        updateStatus(nodeStatusMap.value!, parent.id, {
          visible,
          expand: true,
        });
      });
    }

    updateStatus(nodeStatusMap.value, node.id, {
      visible,
    });
  };

  const filter = (text: string) => {
    if (!page.value?.items?.length) return;

    page.value.items.forEach((node) => {
      traverseNode(node, filterNode(text));
    });
  };

  return {
    filterText: ref(''),
    filterTextChangeHandler(text: string) {
      filter(text);
    },
  };
};
