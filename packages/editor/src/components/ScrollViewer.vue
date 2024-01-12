<template>
  <div class="m-editor-scroll-viewer-container" ref="container">
    <div ref="el" :style="style">
      <slot></slot>
    </div>

    <slot name="content"></slot>

    <ScrollBar
      v-if="scrollHeight > wrapHeight"
      :scroll-size="scrollHeight"
      :pos="vOffset"
      :size="wrapHeight"
      @scroll="vScrollHandler"
    ></ScrollBar>
    <ScrollBar
      v-if="scrollWidth > wrapWidth"
      :is-horizontal="true"
      :scroll-size="scrollWidth"
      :pos="hOffset"
      :size="wrapWidth"
      @scroll="hScrollHandler"
    ></ScrollBar>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { isNumber } from '@tmagic/utils';

import type { ScrollViewerEvent } from '@editor/type';
import { ScrollViewer } from '@editor/utils/scroll-viewer';

import ScrollBar from './ScrollBar.vue';

defineOptions({
  name: 'MEditorScrollViewer',
});

const props = withDefaults(
  defineProps<{
    width?: number | string;
    height?: number | string;
    wrapWidth?: number;
    wrapHeight?: number;
    zoom?: number;
    correctionScrollSize?: {
      width: number;
      height: number;
    };
  }>(),
  {
    width: 0,
    height: 0,
    wrapWidth: 0,
    wrapHeight: 0,
    zoom: 1,
    correctionScrollSize: () => ({
      width: 0,
      height: 0,
    }),
  },
);

const container = ref<HTMLDivElement>();
const el = ref<HTMLDivElement>();
const style = computed(
  () => `
        width: ${isNumber(`${props.width}`) ? `${props.width}px` : props.width};
        height: ${isNumber(`${props.height}`) ? `${props.height}px` : props.height};
        position: absolute;
        margin-top: 30px;
      `,
);

const scrollWidth = ref(0);
const scrollHeight = ref(0);

let scrollViewer: ScrollViewer;

onMounted(() => {
  if (!container.value || !el.value) return;
  scrollViewer = new ScrollViewer({
    container: container.value,
    target: el.value,
    zoom: props.zoom,
    correctionScrollSize: props.correctionScrollSize,
  });

  scrollViewer.on('scroll', (data: ScrollViewerEvent) => {
    hOffset.value = data.scrollLeft;
    vOffset.value = data.scrollTop;
    scrollWidth.value = data.scrollWidth;
    scrollHeight.value = data.scrollHeight;
  });
});

onBeforeUnmount(() => {
  scrollViewer.destroy();
});

watch(
  () => props.zoom,
  () => {
    scrollViewer.setZoom(props.zoom);
  },
);

const vOffset = ref(0);
const vScrollHandler = (delta: number) => {
  vOffset.value += delta;
  scrollViewer.scrollTo({
    top: vOffset.value,
  });
};
const hOffset = ref(0);
const hScrollHandler = (delta: number) => {
  hOffset.value += delta;
  scrollViewer.scrollTo({
    left: hOffset.value,
  });
};

defineExpose({
  container,
});
</script>
