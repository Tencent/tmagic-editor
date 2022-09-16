<template>
  <div ref="el">
    <template v-if="typeof props.left !== 'undefined'">
      <div class="m-editor-layout-left" :class="leftClass" :style="`width: ${left}px`">
        <slot name="left"></slot>
      </div>
      <Resizer @change="changeLeft"></Resizer>
    </template>

    <div class="m-editor-layout-center" :class="centerClass" :style="`width: ${center}px`">
      <slot name="center"></slot>
    </div>

    <template v-if="typeof props.right !== 'undefined'">
      <Resizer @change="changeRight"></Resizer>
      <div class="m-editor-layout-right" :class="rightClass" :style="`width: ${right}px`">
        <slot name="right"></slot>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';

import Resizer from './Resizer.vue';

const emit = defineEmits(['update:left', 'change', 'update:right']);

const props = withDefaults(
  defineProps<{
    left?: number;
    right?: number;
    minLeft?: number;
    minRight?: number;
    leftClass?: string;
    rightClass?: string;
    centerClass?: string;
  }>(),
  {
    minLeft: 1,
    minRight: 1,
  },
);

const el = ref<HTMLElement>();

let clientWidth = 0;
const resizerObserver = new ResizeObserver((entries) => {
  for (const { contentRect } of entries) {
    clientWidth = contentRect.width;

    center.value = clientWidth - (props.left || 0) - (props.right || 0);

    emit('change', {
      left: props.left,
      center: center.value,
      right: props.right,
    });
  }
});

onMounted(() => {
  if (el.value) {
    resizerObserver.observe(el.value);
  }
});

onUnmounted(() => {
  resizerObserver.disconnect();
});

const center = ref(0);

const changeLeft = (deltaX: number) => {
  if (typeof props.left === 'undefined') return;
  const left = Math.max(props.left + deltaX, props.minLeft) || 0;
  emit('update:left', left);
  center.value = clientWidth - left - (props.right || 0);

  emit('change', {
    left,
    center: center.value,
    right: props.right,
  });
};

const changeRight = (deltaX: number) => {
  if (typeof props.right === 'undefined') return;
  const right = Math.max(props.right - deltaX, props.minRight) || 0;
  emit('update:right', right);
  center.value = clientWidth - (props.left || 0) - right;

  emit('change', {
    left: props.left,
    center: center.value,
    right,
  });
};
</script>
