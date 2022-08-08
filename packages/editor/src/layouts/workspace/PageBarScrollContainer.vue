<template>
  <div class="m-editor-page-bar" ref="pageBar">
    <div id="m-editor-page-bar-add-icon" class="m-editor-page-bar-item m-editor-page-bar-item-icon" @click="addPage">
      <el-icon><plus></plus></el-icon>
    </div>
    <div v-if="canScroll" class="m-editor-page-bar-item m-editor-page-bar-item-icon" @click="scroll('left')">
      <el-icon><arrow-left-bold></arrow-left-bold></el-icon>
    </div>
    <div v-if="root" class="m-editor-page-bar-items" ref="itemsContainer" :style="`width: ${itemsContainerWidth}px`">
      <slot></slot>
    </div>
    <div v-if="canScroll" class="m-editor-page-bar-item m-editor-page-bar-item-icon" @click="scroll('right')">
      <el-icon><arrow-right-bold></arrow-right-bold></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, toRaw, watch } from 'vue';
import { ArrowLeftBold, ArrowRightBold, Plus } from '@element-plus/icons-vue';

import { MApp, NodeType } from '@tmagic/schema';

import type { Services } from '../../type';
import { generatePageNameByApp } from '../../utils/editor';

const services = inject<Services>('services');
const editorService = services?.editorService;

const pageBar = ref<HTMLDivElement>();
const itemsContainer = ref<HTMLDivElement>();
const pageBarWidth = ref(0);
const canScroll = ref(false);

const itemsContainerWidth = computed(() => pageBarWidth.value - 105);

let translateLeft = 0;
const resizeObserver = new ResizeObserver((entries) => {
  for (const { contentRect } of entries) {
    const { width } = contentRect;
    pageBarWidth.value = width || 0;

    setCanScroll();
  }
});

const setCanScroll = () => {
  if (itemsContainer.value) {
    canScroll.value = itemsContainer.value.scrollWidth > pageBarWidth.value - 105;
  }
};

const scroll = (type: 'left' | 'right' | 'start' | 'end') => {
  if (!itemsContainer.value) return;

  const maxScrollLeft = itemsContainer.value.scrollWidth - itemsContainerWidth.value;

  if (type === 'left') {
    translateLeft += 100;

    if (translateLeft > 0) {
      translateLeft = 0;
    }
  } else if (type === 'right') {
    translateLeft -= 100;

    if (-translateLeft > maxScrollLeft) {
      translateLeft = -maxScrollLeft;
    }
  } else if (type === 'start') {
    translateLeft = 0;
  } else if (type === 'end') {
    translateLeft = -maxScrollLeft;
  }

  itemsContainer.value.style.transform = `translate(${translateLeft}px, 0px)`;
};

onMounted(() => {
  pageBar.value && resizeObserver.observe(pageBar.value);
});

onUnmounted(() => {
  resizeObserver.disconnect();
});

const root = computed(() => editorService?.get<MApp>('root'));

watch(
  () => root.value?.items.length,
  (length = 0, preLength = 0) => {
    setTimeout(() => {
      setCanScroll();
      if (length < preLength) {
        scroll('start');
      } else {
        scroll('end');
      }
    });
  },
);

const addPage = () => {
  if (!editorService) return;
  const pageConfig = {
    type: NodeType.PAGE,
    name: generatePageNameByApp(toRaw(editorService.get('root'))),
  };
  editorService.add(pageConfig);
};
</script>
