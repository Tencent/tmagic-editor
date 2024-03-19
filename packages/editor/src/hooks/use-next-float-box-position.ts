import { Ref, ref } from 'vue';

import { UiService } from '@editor/services/ui';

export const useNextFloatBoxPosition = (uiService?: UiService, parent?: Ref<HTMLDivElement | null>) => {
  const boxPosition = ref({
    left: 0,
    top: 0,
  });

  const calcBoxPosition = () => {
    const columnWidth = uiService?.get('columnWidth');
    const navMenuRect = uiService?.get('navMenuRect');
    let left = columnWidth?.left ?? 0;
    if (parent?.value) {
      const rect = parent?.value?.getBoundingClientRect();
      left = (rect?.left ?? 0) + (rect?.width ?? 0);
    }
    boxPosition.value = {
      left,
      top: (navMenuRect?.top ?? 0) + (navMenuRect?.height ?? 0),
    };
  };

  return {
    boxPosition,
    calcBoxPosition,
  };
};
