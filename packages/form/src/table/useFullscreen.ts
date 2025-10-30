import { ref } from 'vue';

export const useFullscreen = () => {
  const isFullscreen = ref(false);

  const toggleFullscreen = () => {
    if (isFullscreen.value) {
      isFullscreen.value = false;
    } else {
      isFullscreen.value = true;
    }
  };

  return {
    isFullscreen,
    toggleFullscreen,
  };
};
