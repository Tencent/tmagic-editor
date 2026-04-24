import { ref, watch } from 'vue';

import { useZIndex } from '@tmagic/design';

export const useFullscreen = () => {
  const { nextZIndex } = useZIndex();

  const fullscreenZIndex = ref(nextZIndex());

  const isFullscreen = ref(false);

  const toggleFullscreen = () => {
    if (isFullscreen.value) {
      isFullscreen.value = false;
    } else {
      isFullscreen.value = true;
    }
  };

  watch(isFullscreen, (value) => {
    if (value) {
      fullscreenZIndex.value = nextZIndex();
    }
  });

  return {
    isFullscreen,
    fullscreenZIndex,
    toggleFullscreen,
  };
};
