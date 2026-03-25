import { onBeforeUnmount, onMounted, ref, type ShallowRef } from 'vue';
import Gesto, { type OnDrag } from 'gesto';

export const useGetSo = (target: ShallowRef<HTMLElement | null>, emit: (evt: 'change', e: OnDrag<Gesto>) => void) => {
  let getso: Gesto;
  const isDragging = ref(false);

  onMounted(() => {
    if (!target.value) return;
    getso = new Gesto(target.value, {
      container: window,
      pinchOutside: true,
    })
      .on('drag', (e) => {
        if (!target.value) return;

        emit('change', e);
      })
      .on('dragStart', () => {
        isDragging.value = true;
      })
      .on('dragEnd', () => {
        isDragging.value = false;
      });
  });

  onBeforeUnmount(() => {
    getso?.unset();
    isDragging.value = false;
  });

  return {
    isDragging,
  };
};
