import { ref, useTemplateRef } from 'vue';

import { useZIndex } from '@tmagic/design';

export const useFullscreen = () => {
  const isFullscreen = ref(false);
  const mTableEl = useTemplateRef<HTMLDivElement>('mTable');

  const { nextZIndex } = useZIndex();

  const toggleFullscreen = () => {
    if (!mTableEl.value) return;

    if (isFullscreen.value) {
      mTableEl.value.classList.remove('fixed');
      isFullscreen.value = false;
    } else {
      mTableEl.value.classList.add('fixed');
      mTableEl.value.style.zIndex = `${nextZIndex()}`;
      isFullscreen.value = true;
    }
  };

  return {
    isFullscreen,
    toggleFullscreen,
  };
};
