<template>
  <Teleport to="body" v-if="visible">
    <div ref="target" class="m-editor-float-box" :style="{ ...style, zIndex: curZIndex }" @mousedown="nextZIndex">
      <div ref="titleEl" class="m-editor-float-box-title">
        <slot name="title">
          <span>{{ title }}</span>
        </slot>
        <div>
          <TMagicButton link size="small" @click="closeHandler"><MIcon :icon="Close"></MIcon></TMagicButton>
        </div>
      </div>
      <div class="m-editor-float-box-body" :style="{ height: `${bodyHeight}px` }">
        <slot name="body"></slot>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, provide, ref, watch } from 'vue';
import { Close } from '@element-plus/icons-vue';
import VanillaMoveable from 'moveable';

import { TMagicButton, useZIndex } from '@tmagic/design';

import MIcon from '@editor/components/Icon.vue';
import type { Services } from '@editor/type';

interface Position {
  left: number;
  top: number;
}

const width = defineModel<number>('width', { default: 0 });
const height = defineModel<number>('height', { default: 0 });
const visible = defineModel<boolean>('visible', { default: false });

const props = withDefaults(
  defineProps<{
    position?: Position;
    title?: string;
    beforeClose?: (done: (cancel?: boolean) => void) => void;
  }>(),
  {
    title: '',
    position: () => ({ left: 0, top: 0 }),
  },
);

const target = ref<HTMLDivElement>();
const titleEl = ref<HTMLDivElement>();

const zIndex = useZIndex();
const curZIndex = ref<number>(0);

const titleHeight = ref(0);
const bodyHeight = computed(() => {
  if (height.value) {
    return height.value - titleHeight.value;
  }

  if (target.value) {
    return target.value.clientHeight - titleHeight.value;
  }

  return 'auto';
});

const services = inject<Services>('services');
const frameworkWidth = computed(() => services?.uiService.get('frameworkRect').width || 0);
const style = computed(() => {
  let { left } = props.position;
  if (width.value) {
    left = left + width.value > frameworkWidth.value ? frameworkWidth.value - width.value : left;
  }

  return {
    left: `${left}px`,
    top: `${props.position.top}px`,
    width: width.value ? `${width.value}px` : 'auto',
    height: height.value ? `${height.value}px` : 'auto',
  };
});

let moveable: VanillaMoveable | null = null;

const initMoveable = () => {
  moveable = new VanillaMoveable(globalThis.document.body, {
    className: 'm-editor-floating-box-moveable',
    target: target.value,
    draggable: true,
    resizable: true,
    edge: true,
    keepRatio: false,
    origin: false,
    snappable: true,
    dragTarget: titleEl.value,
    dragTargetSelf: false,
    linePadding: 10,
    controlPadding: 10,
    bounds: { left: 0, top: 0, right: 0, bottom: 0, position: 'css' },
  });

  moveable.on('drag', (e) => {
    e.target.style.transform = e.transform;
  });

  moveable.on('resize', (e) => {
    width.value = e.width;
    height.value = e.height;
    e.target.style.width = `${e.width}px`;
    e.target.style.height = `${e.height}px`;
    e.target.style.transform = e.drag.transform;
  });
};

const destroyMoveable = () => {
  moveable?.destroy();
  moveable = null;
};

watch(
  visible,
  async (visible) => {
    if (visible) {
      await nextTick();
      curZIndex.value = zIndex.nextZIndex();

      const targetRect = target.value?.getBoundingClientRect();
      if (targetRect) {
        width.value = targetRect.width;
        height.value = targetRect.height;
        initMoveable();
      }

      if (titleEl.value) {
        const titleRect = titleEl.value.getBoundingClientRect();
        titleHeight.value = titleRect.height;
      }
    } else {
      destroyMoveable();
    }
  },
  {
    immediate: true,
  },
);

onBeforeUnmount(() => {
  destroyMoveable();
});

const hide = (cancel?: boolean) => {
  if (cancel !== false) {
    visible.value = false;
  }
};

const closeHandler = () => {
  if (typeof props.beforeClose === 'function') {
    props.beforeClose(hide);
  } else {
    hide();
  }
};

const nextZIndex = () => {
  curZIndex.value = zIndex.nextZIndex();
};

provide('parentFloating', target);

defineExpose({
  bodyHeight,
  target,
  titleEl,
});
</script>
