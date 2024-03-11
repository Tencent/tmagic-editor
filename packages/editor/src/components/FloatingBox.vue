<template>
  <Teleport to="body" v-if="visible">
    <div ref="target" class="m-editor-float-box" :style="style" @mousedown="nextZIndex">
      <div ref="dragTarget" class="m-editor-float-box-title">
        <slot name="title">
          <span>{{ title }}</span>
        </slot>
        <div>
          <TMagicButton link size="small" :icon="Close" @click="closeHandler"></TMagicButton>
        </div>
      </div>
      <div class="m-editor-float-box-body">
        <slot name="body"></slot>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { Close } from '@element-plus/icons-vue';
import VanillaMoveable from 'moveable';

import { TMagicButton, useZIndex } from '@tmagic/design';

interface Position {
  left: number;
  top: number;
}

interface Rect {
  width: number | string;
  height: number | string;
}

const props = withDefaults(defineProps<{ visible: boolean; position?: Position; rect?: Rect; title?: string }>(), {
  visible: false,
  title: '',
  position: () => ({ left: 0, top: 0 }),
  rect: () => ({ width: 'auto', height: 'auto' }),
});

const emit = defineEmits<{
  'update:visible': [boolean];
}>();

const target = ref<HTMLDivElement>();
const dragTarget = ref<HTMLDivElement>();

const zIndex = useZIndex();
const curZIndex = ref<number>(zIndex.nextZIndex());

const style = computed(() => ({
  left: `${props.position.left}px`,
  top: `${props.position.top}px`,
  width: typeof props.rect.width === 'string' ? props.rect.width : `${props.rect.width}px`,
  height: typeof props.rect.height === 'string' ? props.rect.height : `${props.rect.height}px`,
  zIndex: curZIndex.value,
}));

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
    dragTarget: dragTarget.value,
    dragTargetSelf: false,
    linePadding: 10,
    controlPadding: 10,
    bounds: { left: 0, top: 0, right: 0, bottom: 0, position: 'css' },
  });

  moveable.on('drag', (e) => {
    e.target.style.transform = e.transform;
  });

  moveable.on('resize', (e) => {
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
  () => props.visible,
  async (visible) => {
    if (visible) {
      await nextTick();
      initMoveable();
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

const closeHandler = () => {
  emit('update:visible', false);
};

const nextZIndex = () => {
  curZIndex.value = zIndex.nextZIndex();
};

defineExpose({
  target,
});
</script>
