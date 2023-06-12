<template>
  <span ref="target" class="m-editor-resizer" :class="{ 'm-editor-resizer-draging': isDraging }">
    <slot></slot>
  </span>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import Gesto from 'gesto';

defineOptions({
  name: 'MEditorResizer',
});

const emit = defineEmits(['change']);

const target = ref<HTMLSpanElement>();
const isDraging = ref(false);

let getso: Gesto;

onMounted(() => {
  if (!target.value) return;
  getso = new Gesto(target.value, {
    container: window,
    pinchOutside: true,
  })
    .on('drag', (e) => {
      if (!target.value) return;

      emit('change', e.deltaX);
    })
    .on('dragStart', () => {
      isDraging.value = true;
    })
    .on('dragEnd', () => {
      isDraging.value = false;
    });
});

onUnmounted(() => {
  getso?.unset();
  isDraging.value = false;
});
</script>
