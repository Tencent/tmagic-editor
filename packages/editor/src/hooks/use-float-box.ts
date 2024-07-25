import { computed, ComputedRef, inject, onBeforeUnmount, ref, watch } from 'vue';

import type { Services } from '@editor/type';

interface State {
  status: boolean;
  top: number;
  left: number;
}

export const useFloatBox = (slideKeys: ComputedRef<string[]>) => {
  const services = inject<Services>('services');

  const floatBoxStates = ref<{
    [key in (typeof slideKeys.value)[number]]: State;
  }>(
    slideKeys.value.reduce(
      (total, cur) => ({
        ...total,
        [cur]: {
          status: false,
          top: 0,
          left: 0,
        },
      }),
      {},
    ),
  );

  const showingBoxKeys = computed(() =>
    Object.keys(floatBoxStates.value).filter((key) => floatBoxStates.value[key].status),
  );

  const dragState = {
    startOffset: {
      x: 0,
      y: 0,
    },
    isDragging: false,
  };

  const dragstartHandler = (e: DragEvent) => {
    dragState.isDragging = true;

    dragState.startOffset.x = e.clientX;
    dragState.startOffset.y = e.clientY;
  };

  const effectiveDistance = 20;

  const dragendHandler = (key: string, e: DragEvent) => {
    if (!dragState.isDragging) return;

    const { startOffset } = dragState;

    if (
      Math.abs(startOffset.x - e.clientX) > effectiveDistance ||
      Math.abs(startOffset.y - e.clientY) > effectiveDistance
    ) {
      const navMenuRect = services?.uiService?.get('navMenuRect');
      floatBoxStates.value[key] = {
        left: e.clientX,
        top: (navMenuRect?.top ?? 0) + (navMenuRect?.height ?? 0),
        status: true,
      };
    }

    dragState.isDragging = false;
  };

  const dragoverHandler = (e: DragEvent) => {
    if (!dragState.isDragging) return;
    e.preventDefault();
  };

  const blurHandler = () => {
    dragState.startOffset.x = 0;
    dragState.startOffset.y = 0;

    dragState.isDragging = false;
  };

  globalThis.document.body.addEventListener('dragover', dragoverHandler);
  globalThis.addEventListener('blur', blurHandler);

  onBeforeUnmount(() => {
    globalThis.document.body.removeEventListener('dragover', dragoverHandler);
    globalThis.removeEventListener('blur', blurHandler);
  });

  watch(
    () => slideKeys.value,
    (slideKeys) => {
      slideKeys.forEach((key) => {
        if (!floatBoxStates.value[key]) {
          floatBoxStates.value[key] = {
            status: false,
            top: 0,
            left: 0,
          };
        }
      });
    },
    {
      deep: true,
      immediate: true,
    },
  );

  return {
    dragstartHandler,
    dragendHandler,
    floatBoxStates,
    showingBoxKeys,
  };
};
