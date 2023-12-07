import { computed, type ComputedRef, ref } from 'vue';

import { Id, MNode } from '@tmagic/schema';

import { LayerNodeStatus, Services } from '@editor/type';
import { traverseNode } from '@editor/utils';
import { updateStatus } from '@editor/utils/tree';

export const useFilter = (
  services: Services | undefined,
  nodeStatusMap: ComputedRef<Map<Id, LayerNodeStatus> | undefined>,
  filterNodeMethod: (value: string, data: MNode) => boolean,
) => {
  const page = computed(() => services?.editorService.get('page'));

  // tree方法：对树节点进行筛选时执行的方法
  const filterIsMatch = (value: string | string[], data: MNode): boolean => {
    const string = !Array.isArray(value) ? [value] : value;

    if (!string.length) {
      return true;
    }

    return string.some((v) => filterNodeMethod(v, data));
  };

  const filter = (text: string | string[]) => {
    if (!page.value?.items?.length) return;

    page.value.items.forEach((node) => {
      traverseNode(node, (node: MNode, parents: MNode[]) => {
        if (!nodeStatusMap.value) return;

        const visible = filterIsMatch(text, node);
        if (visible && parents.length) {
          console.log(
            node.id,
            parents.map((a) => a.id),
          );
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
      });
    });
  };

  return {
    filterText: ref(''),
    filterTextChangeHandler(text: string | string[]) {
      filter(text);
    },
  };
};
