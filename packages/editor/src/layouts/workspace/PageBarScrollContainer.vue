<template>
  <div class="m-editor-page-bar" ref="pageBar">
    <div
      v-if="showAddPageButton"
      id="m-editor-page-bar-add-icon"
      class="m-editor-page-bar-item m-editor-page-bar-item-icon"
      @click="addPage"
    >
      <Icon :icon="Plus"></Icon>
    </div>
    <div v-else style="width: 21px"></div>
    <div v-if="canScroll" class="m-editor-page-bar-item m-editor-page-bar-item-icon" @click="scroll('left')">
      <Icon :icon="ArrowLeftBold"></Icon>
    </div>
    <div
      v-if="pageLength"
      class="m-editor-page-bar-items"
      ref="itemsContainer"
      :style="`width: ${itemsContainerWidth}px`"
    >
      <slot></slot>
    </div>
    <div v-if="canScroll" class="m-editor-page-bar-item m-editor-page-bar-item-icon" @click="scroll('right')">
      <Icon :icon="ArrowRightBold"></Icon>
    </div>
  </div>
</template>

<script setup lang="ts" name="MEditorPageBarScrollContainer">
import { computed, inject, nextTick, onMounted, onUnmounted, ref, toRaw, watch } from 'vue';
import { ArrowLeftBold, ArrowRightBold, Plus } from '@element-plus/icons-vue';

import { NodeType } from '@tmagic/schema';

import Icon from '@editor/components/Icon.vue';
import type { Services } from '@editor/type';
import { generatePageNameByApp } from '@editor/utils/editor';

const services = inject<Services>('services');
const editorService = services?.editorService;
const uiService = services?.uiService;

const itemsContainer = ref<HTMLDivElement>();
const canScroll = ref(false);

const showAddPageButton = computed(() => uiService?.get('showAddPageButton'));

const itemsContainerWidth = ref(0);

const setCanScroll = () => {
  // 减去新增、左移、右移三个按钮的宽度
  // 37 = icon width 16 + padding 10 * 2 + border-right 1
  itemsContainerWidth.value = (pageBar.value?.clientWidth || 0) - 37 * 2 - (showAddPageButton.value ? 37 : 21);

  nextTick(() => {
    if (itemsContainer.value) {
      canScroll.value = itemsContainer.value.scrollWidth - itemsContainerWidth.value > 1;
    }
  });
};

const resizeObserver = new ResizeObserver(() => {
  setCanScroll();
});

const pageBar = ref<HTMLDivElement>();
onMounted(() => {
  pageBar.value && resizeObserver.observe(pageBar.value);
});

onUnmounted(() => {
  resizeObserver.disconnect();
});

let translateLeft = 0;

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

const pageLength = computed(() => editorService?.get('pageLength'));

watch(pageLength, (length = 0, preLength = 0) => {
  setTimeout(() => {
    setCanScroll();
    if (length < preLength) {
      scroll('start');
    } else {
      scroll('end');
    }
  });
});

const addPage = () => {
  if (!editorService) return;
  const root = toRaw(editorService.get('root'));
  if (!root) throw new Error('root 不能为空');
  const pageConfig = {
    type: NodeType.PAGE,
    name: generatePageNameByApp(root),
  };
  editorService.add(pageConfig);
};
</script>
