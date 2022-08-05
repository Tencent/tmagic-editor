<template>
  <div class="m-editor-scroll-viewer-container" ref="container">
    <div ref="el" :style="style">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';

import { ScrollViewer } from '../utils/scroll-viewer';

export default defineComponent({
  name: 'm-editor-scroll-viewer',

  props: {
    width: Number,
    height: Number,
    zoom: {
      type: Number,
      default: 1,
    },
  },

  setup(props) {
    const container = ref<HTMLDivElement>();
    const el = ref<HTMLDivElement>();
    let scrollViewer: ScrollViewer;

    onMounted(() => {
      if (!container.value || !el.value) return;
      scrollViewer = new ScrollViewer({
        container: container.value,
        target: el.value,
        zoom: props.zoom,
      });
    });

    onUnmounted(() => {
      scrollViewer.destroy();
    });

    watch(
      () => props.zoom,
      () => {
        scrollViewer.setZoom(props.zoom);
      },
    );

    return {
      container,
      el,

      style: computed(
        () => `
        width: ${props.width}px;
        height: ${props.height}px;
        position: absolute;
        margin-top: 30px;
      `,
      ),
    };
  },
});
</script>
