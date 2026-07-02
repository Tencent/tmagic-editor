<template>
  <Teleport to="body" v-if="visible">
    <div
      ref="target"
      class="m-editor-float-box"
      v-bind="$attrs"
      :style="{ ...style, zIndex: curZIndex }"
      @mousedown="nextZIndex"
    >
      <div ref="title" class="m-editor-float-box-title">
        <slot name="title">
          <span>{{ title }}</span>
        </slot>
        <div>
          <TMagicButton link size="small" @click="closeHandler"><MIcon :icon="Close"></MIcon></TMagicButton>
        </div>
      </div>
      <div class="m-editor-float-box-body" :style="{ height: `${bodyHeight}px`, ...bodyStyle }">
        <slot name="body"></slot>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, type CSSProperties, nextTick, onBeforeUnmount, provide, ref, useTemplateRef, watch } from 'vue';
import { Close } from '@element-plus/icons-vue';
import VanillaMoveable from 'moveable';

import { TMagicButton, useZIndex } from '@tmagic/design';

import MIcon from '@editor/components/Icon.vue';
import { useServices } from '@editor/hooks/use-services';

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
    bodyStyle?: CSSProperties;
    beforeClose?: (_done: (_cancel?: boolean) => void) => void;
  }>(),
  {
    title: '',
    position: () => ({ left: 0, top: 0 }),
  },
);

const targetEl = useTemplateRef<HTMLDivElement>('target');
const titleEl = useTemplateRef<HTMLDivElement>('title');

const zIndex = useZIndex();
const curZIndex = ref<number>(0);

const titleHeight = ref(0);
const bodyHeight = computed(() => {
  if (height.value) {
    return height.value - titleHeight.value;
  }

  if (targetEl.value) {
    return targetEl.value.clientHeight - titleHeight.value;
  }

  return 'auto';
});

const { uiService } = useServices();
const frameworkWidth = computed(() => uiService.get('frameworkRect').width || 0);
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

// 拖拽/缩放时用于覆盖 iframe 的遮罩，防止鼠标进入 iframe 区域后事件被 iframe 吞掉导致拖拽丢失
let dragMask: HTMLDivElement | null = null;

const showDragMask = () => {
  if (!dragMask) {
    dragMask = globalThis.document.createElement('div');
    dragMask.className = 'm-editor-float-box-drag-mask';
  }
  globalThis.document.body.appendChild(dragMask);

  // 拖拽标题时，root 上的 @mousedown="nextZIndex" 会在 dragStart 之后把浮窗 z-index 抬高，
  // 若此时才读取会拿到旧值导致遮罩被浮窗（及其内部 iframe）盖住，故用 nextTick 在 z-index 稳定后再设置到浮窗之上
  const setMaskZIndex = () => {
    if (dragMask) {
      dragMask.style.zIndex = `${curZIndex.value + 1}`;
    }
  };
  setMaskZIndex();
  nextTick(setMaskZIndex);
};

const hideDragMask = () => {
  dragMask?.parentNode?.removeChild(dragMask);
};

const initMoveable = () => {
  moveable = new VanillaMoveable(globalThis.document.body, {
    className: 'm-editor-floating-box-moveable',
    target: targetEl.value,
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

  moveable.on('dragStart', showDragMask);
  moveable.on('resizeStart', showDragMask);
  moveable.on('dragEnd', hideDragMask);
  moveable.on('resizeEnd', hideDragMask);

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
  hideDragMask();
  moveable?.destroy();
  moveable = null;
};

watch(
  visible,
  async (visible) => {
    if (visible) {
      await nextTick();
      curZIndex.value = zIndex.nextZIndex();

      const targetRect = targetEl.value?.getBoundingClientRect();
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

provide('parentFloating', targetEl);

defineExpose({
  bodyHeight,
  target: targetEl,
  titleEl,
});
</script>
