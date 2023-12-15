<template>
  <div ref="bar" class="m-editor-scroll-bar" :class="isHorizontal ? 'horizontal' : 'vertical'">
    <div ref="thumb" class="m-editor-scroll-bar-thumb" :style="thumbStyle"></div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import Gesto from 'gesto';

defineOptions({
  name: 'MEditorScrollBar',
});

const props = defineProps<{
  size: number;
  scrollSize: number;
  isHorizontal?: boolean;
  pos: number;
}>();

const emit = defineEmits(['scroll']);

const bar = ref<HTMLDivElement>();
const thumb = ref<HTMLDivElement>();

const thumbSize = computed(() => props.size * (props.size / props.scrollSize));
const thumbPos = computed(() => (props.pos / props.scrollSize) * props.size);

const thumbStyle = computed(() => ({
  [props.isHorizontal ? 'width' : 'height']: `${thumbSize.value}px`,
  transform: `translate${props.isHorizontal ? 'X' : 'Y'}(${thumbPos.value}px)`,
}));

let gesto: Gesto;

onMounted(() => {
  if (!thumb.value) return;
  const thumbEl = thumb.value;
  gesto = new Gesto(thumbEl, {
    container: window,
  });

  gesto
    .on('dragStart', (e) => {
      e.inputEvent.stopPropagation();
      e.inputEvent.preventDefault();
    })
    .on('drag', (e) => {
      scrollBy(getDelta(e));
    });

  bar.value?.addEventListener('wheel', wheelHandler, false);
});

onBeforeUnmount(() => {
  if (gesto) gesto.off();
  bar.value?.removeEventListener('wheel', wheelHandler, false);
});

const wheelHandler = (e: WheelEvent) => {
  const delta = props.isHorizontal ? e.deltaX : e.deltaY;
  if (delta) {
    e.preventDefault();
  }
  scrollBy(delta);
};

const getDelta = (e: any) => {
  const ratio = (props.isHorizontal ? e.deltaX : e.deltaY) / props.size;
  return props.scrollSize * ratio;
};

const scrollBy = (delta: number) => {
  if (delta < 0) {
    if (props.pos <= 0) {
      emit('scroll', 0);
    } else {
      emit('scroll', -Math.min(-delta, props.pos));
    }
  } else {
    const leftPos = props.size - (thumbSize.value + thumbPos.value);
    if (leftPos <= 0) {
      emit('scroll', 0);
    } else {
      emit('scroll', Math.min(delta, leftPos));
    }
  }
};
</script>

<style lang="scss">
.m-editor-scroll-bar {
  position: absolute;
  background-color: transparent;
  opacity: 0.3;
  transition: background-color 0.2s linear, opacity 0.2s linear;

  .m-editor-scroll-bar-thumb {
    background-color: #aaa;
    border-radius: 6px;
    position: absolute;
  }

  &.horizontal {
    width: 100%;
    height: 15px;
    bottom: 0;

    .m-editor-scroll-bar-thumb {
      height: 6px;
      transition: background-color 0.2s linear, height 0.2s ease-in-out;
      bottom: 2px;
    }
  }

  &.vertical {
    height: 100%;
    width: 15px;
    right: 5px;

    .m-editor-scroll-bar-thumb {
      width: 6px;
      transition: background-color 0.2s linear, width 0.2s ease-in-out;
      right: 2px;
    }
  }

  &:hover,
  &:focus {
    background-color: #eee;
    opacity: 0.9;

    .m-editor-scroll-bar-thumb {
      background-color: #999;
    }

    &.horizontal {
      .m-editor-scroll-bar-thumb {
        height: 11px;
      }
    }

    &.vertical {
      .m-editor-scroll-bar-thumb {
        width: 11px;
      }
    }
  }
}
</style>
