<template>
  <div ref="el" class="m-editor-layout">
    <template v-if="hasLeft">
      <div class="m-editor-layout-left" :class="leftClass" :style="`width: ${left}px`">
        <slot name="left"></slot>
      </div>
      <Resizer @change="changeLeft"></Resizer>
    </template>

    <div class="m-editor-layout-center" :class="centerClass" :style="`width: ${center}px`">
      <slot name="center"></slot>
    </div>

    <template v-if="hasRight">
      <Resizer @change="changeRight"></Resizer>
      <div class="m-editor-layout-right" :class="rightClass" :style="`width: ${right}px`">
        <slot name="right"></slot>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup name="MEditorLayout">
import { computed, onMounted, onUnmounted, ref } from 'vue';

import Resizer from '@editor/layouts/Resizer.vue';

const emit = defineEmits(['update:left', 'change', 'update:right']);

const props = withDefaults(
  defineProps<{
    left?: number;
    right?: number;
    minLeft?: number;
    minRight?: number;
    minCenter?: number;
    leftClass?: string;
    rightClass?: string;
    centerClass?: string;
  }>(),
  {
    minLeft: 46,
    minRight: 1,
    minCenter: 5,
  },
);

const el = ref<HTMLElement>();

const hasLeft = computed(() => typeof props.left !== 'undefined');
const hasRight = computed(() => typeof props.right !== 'undefined');

const getCenterWidth = (clientWidth: number, left: number, right: number) => {
  let center = clientWidth - left - right;
  if (center < props.minCenter) {
    center = props.minCenter;
    if (left < right) {
      right = clientWidth - left - props.minCenter;
    } else {
      left = clientWidth - right - props.minCenter;
    }
  }
  return {
    center,
    left,
    right,
  };
};

let clientWidth = 0;
const resizerObserver = new ResizeObserver((entries) => {
  for (const { contentRect } of entries) {
    clientWidth = contentRect.width;

    let left = props.left || 0;
    let right = props.right || 0;

    if (left > clientWidth) {
      left = clientWidth / 3;
    }

    if (right > clientWidth) {
      right = clientWidth / 3;
    }

    const columnWidth = getCenterWidth(clientWidth, left, right);

    center.value = columnWidth.center;

    emit('change', {
      left: columnWidth.left,
      center: center.value,
      right: columnWidth.right,
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
  let left = Math.max(props.left + deltaX, props.minLeft) || 0;
  emit('update:left', left);

  if (clientWidth - left - (props.right || 0) <= 0) {
    left = props.left;
  }

  const columnWidth = getCenterWidth(clientWidth, left, props.right || 0);

  center.value = columnWidth.center;

  emit('change', {
    left: columnWidth.left,
    center: center.value,
    right: columnWidth.right,
  });
};

const changeRight = (deltaX: number) => {
  if (typeof props.right === 'undefined') return;
  let right = Math.max(props.right - deltaX, props.minRight) || 0;
  emit('update:right', right);

  if (clientWidth - (props.left || 0) - right <= 0) {
    right = props.right;
  }

  const columnWidth = getCenterWidth(clientWidth, props.left || 0, right);

  center.value = columnWidth.center;

  emit('change', {
    left: columnWidth.left,
    center: center.value,
    right: columnWidth.right,
  });
};
</script>
