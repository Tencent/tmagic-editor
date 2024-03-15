import { onBeforeUnmount, reactive } from 'vue';

export const useWindowRect = () => {
  const rect = reactive({ width: globalThis.innerWidth, height: globalThis.innerHeight });

  const windowResizeHandler = () => {
    rect.width = globalThis.innerWidth;
    rect.height = globalThis.innerHeight;
  };

  globalThis.addEventListener('resize', windowResizeHandler);

  onBeforeUnmount(() => {
    globalThis.removeEventListener('resize', windowResizeHandler);
  });

  return {
    rect,
  };
};
