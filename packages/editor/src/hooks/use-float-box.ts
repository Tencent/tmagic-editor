import { computed, ComputedRef, ref, watch } from 'vue';

interface State {
  status: boolean;
  top: number;
  left: number;
}

export const useFloatBox = (slideKeys: ComputedRef<string[]>) => {
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
  const isDragging = ref(false);

  const dragstartHandler = () => (isDragging.value = true);
  const dragendHandler = (key: string, e: DragEvent) => {
    floatBoxStates.value[key] = {
      left: e.clientX,
      top: e.clientY,
      status: true,
    };
    isDragging.value = false;
  };

  document.body.addEventListener('dragover', (e: DragEvent) => {
    if (!isDragging.value) return;
    e.preventDefault();
  });

  watch(
    () => slideKeys.value,
    (slideKeys) => {
      slideKeys.forEach((key) => {
        if (floatBoxStates.value[key]) return;
        floatBoxStates.value[key] = {
          status: false,
          top: 0,
          left: 0,
        };
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
