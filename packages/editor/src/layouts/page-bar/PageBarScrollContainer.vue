<template>
  <div class="m-editor-page-bar" ref="pageBar">
    <slot name="prepend"></slot>
    <div v-if="length" class="m-editor-page-bar-items" ref="itemsContainer">
      <slot></slot>
    </div>

    <div
      v-if="canScroll"
      class="m-editor-page-bar-item m-editor-page-bar-item-icon m-editor-page-bar-item-left-icon"
      @click="scroll('left')"
    >
      <Icon :icon="ArrowLeftBold"></Icon>
    </div>

    <div
      v-if="canScroll"
      class="m-editor-page-bar-item m-editor-page-bar-item-icon m-editor-page-bar-item-right-icon"
      @click="scroll('right')"
    >
      <Icon :icon="ArrowRightBold"></Icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ArrowLeftBold, ArrowRightBold } from '@element-plus/icons-vue';
import Sortable, { type SortableEvent } from 'sortablejs';

import type { Id } from '@tmagic/core';

import Icon from '@editor/components/Icon.vue';
import type { PageBarSortOptions, Services } from '@editor/type';

defineOptions({
  name: 'MEditorPageBarScrollContainer',
});

const props = defineProps<{
  pageBarSortOptions?: PageBarSortOptions;
  length: number;
}>();

const services = inject<Services>('services');
const editorService = services?.editorService;
const uiService = services?.uiService;

const itemsContainer = ref<HTMLElement>();
const canScroll = ref(false);

const showAddPageButton = computed(() => uiService?.get('showAddPageButton'));
const showPageListButton = computed(() => uiService?.get('showPageListButton'));

const itemsContainerWidth = ref(0);

const setCanScroll = () => {
  // 减去新增、搜索、页面列表、左移、右移5个按钮的宽度
  // 37 = icon width 16 + padding 10 * 2 + border-right 1
  itemsContainerWidth.value =
    (pageBar.value?.clientWidth || 0) -
    37 * 2 -
    37 -
    (showAddPageButton.value ? 37 : 21) -
    (showPageListButton.value ? 37 : 0);

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

onBeforeUnmount(() => {
  resizeObserver.disconnect();
});

let translateLeft = 0;

const scroll = (type: 'left' | 'right' | 'start' | 'end') => {
  if (!itemsContainer.value || !canScroll.value) return;

  const maxScrollLeft = itemsContainer.value.scrollWidth - itemsContainerWidth.value;

  if (type === 'left') {
    scrollTo(translateLeft + 200);
  } else if (type === 'right') {
    scrollTo(translateLeft - 200);
  } else if (type === 'start') {
    scrollTo(0);
  } else if (type === 'end') {
    scrollTo(-maxScrollLeft);
  }
};

const scrollTo = (value: number) => {
  if (!itemsContainer.value || !canScroll.value) return;
  const maxScrollLeft = itemsContainer.value.scrollWidth - itemsContainerWidth.value;

  if (value >= 0) {
    value = 0;
  }

  if (-value > maxScrollLeft) {
    value = -maxScrollLeft;
  }

  translateLeft = value;

  itemsContainer.value.style.transform = `translate(${translateLeft}px, 0px)`;
};

watch(
  () => props.length,
  (length = 0, preLength = 0) => {
    setTimeout(() => {
      setCanScroll();
      nextTick(() => {
        if (length < preLength || preLength === 0) {
          scroll('start');
        } else {
          scroll('end');
        }
      });
      if (length > 1) {
        const el = document.querySelector('.m-editor-page-bar-items') as HTMLElement;
        let beforeDragList: Id[] = [];
        const options = {
          ...{
            dataIdAttr: 'page-id', // 获取排序后的数据
            onStart: async (event: SortableEvent) => {
              if (typeof props.pageBarSortOptions?.beforeStart === 'function') {
                await props.pageBarSortOptions.beforeStart(event, sortable);
              }
              beforeDragList = sortable.toArray();
            },
            onUpdate: async (event: SortableEvent) => {
              await editorService?.sort(
                beforeDragList[event.oldIndex as number],
                beforeDragList[event.newIndex as number],
              );
              if (typeof props.pageBarSortOptions?.afterUpdate === 'function') {
                await props.pageBarSortOptions.afterUpdate(event, sortable);
              }
            },
          },
          ...{
            ...(props.pageBarSortOptions ? props.pageBarSortOptions : {}),
          },
        };
        if (!el) return;
        const sortable = new Sortable(el, options);
      }
    });
  },
  {
    immediate: true,
  },
);

defineExpose({
  itemsContainerWidth,
  scroll,
  scrollTo,
  getTranslateLeft() {
    return translateLeft;
  },
});
</script>
