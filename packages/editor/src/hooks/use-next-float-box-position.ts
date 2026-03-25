import { type Ref, ref } from 'vue';

import type { Services } from '@editor/type';

export const useNextFloatBoxPosition = (uiService: Services['uiService'], parent?: Ref<HTMLDivElement | null>) => {
  const boxPosition = ref({
    left: 0,
    top: 0,
  });

  const calcBoxPosition = () => {
    const columnWidth = uiService.get('columnWidth');
    const navMenuRect = uiService.get('navMenuRect');
    let left = columnWidth.left ?? 0;
    if (parent?.value) {
      const rect = parent.value.getBoundingClientRect();
      left = rect.left + rect.width;
    }
    boxPosition.value = {
      left,
      top: navMenuRect.top + navMenuRect.height,
    };
  };

  return {
    boxPosition,
    calcBoxPosition,
  };
};
