import { onBeforeUnmount, onMounted, type Ref, ref } from 'vue';
import Gesto, { type OnDrag } from 'gesto';

export const useGetSo = (target: Ref<HTMLElement | undefined>, emit: (evt: 'change', e: OnDrag<Gesto>) => void) => {
  let getso: Gesto;
  const isDraging = ref(false);

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
        isDraging.value = true;
      })
      .on('dragEnd', () => {
        isDraging.value = false;
      });
  });

  onBeforeUnmount(() => {
    getso?.unset();
    isDraging.value = false;
  });

  return {
    isDraging,
  };
};
