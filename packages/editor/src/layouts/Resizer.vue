<template>
  <span ref="target" class="m-editor-resizer">
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

let getso: Gesto;

onMounted(() => {
  if (!target.value) return;
  getso = new Gesto(target.value, {
    container: window,
    pinchOutside: true,
  }).on('drag', (e) => {
    if (!target.value) return;

    emit('change', e.deltaX);
  });
});

onUnmounted(() => {
  getso?.unset();
});
</script>
