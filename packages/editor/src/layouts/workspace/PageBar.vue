<template>
  <div class="m-editor-page-bar" ref="pageBar">
    <div id="m-editor-page-bar-add-icon" class="m-editor-page-bar-item m-editor-page-bar-item-icon" @click="addPage">
      <el-icon><plus></plus></el-icon>
    </div>
    <div
      v-if="scrollState.canScroll"
      class="m-editor-page-bar-item m-editor-page-bar-item-icon"
      @click="scrollState.scroll('left')"
    >
      <el-icon><arrow-left-bold></arrow-left-bold></el-icon>
    </div>
    <div
      v-if="root"
      class="m-editor-page-bar-items"
      ref="itemsContainer"
      :style="`width: ${scrollState.itemsContainerWidth}px`"
    >
      <div
        v-for="item in root.items"
        :key="item.key"
        class="m-editor-page-bar-item"
        :class="{ active: page?.id === item.id }"
        @click="switchPage(item)"
      >
        <div class="m-editor-page-bar-title">
          <slot name="page-bar-title" :page="item">
            <el-tooltip effect="dark" placement="top-start" :content="item.name">
              <span>{{ item.name }}</span>
            </el-tooltip>
          </slot>
        </div>

        <el-popover popper-class="page-bar-popover" placement="top" :width="160" trigger="hover">
          <div>
            <slot name="page-bar-popover" :page="item">
              <tool-button
                :data="{
                  type: 'button',
                  text: '复制',
                  icon: DocumentCopy,
                  handler: () => copy(item),
                }"
              ></tool-button>
              <tool-button
                :data="{
                  type: 'button',
                  text: '删除',
                  icon: Delete,
                  handler: () => remove(item),
                }"
              ></tool-button>
            </slot>
          </div>
          <template #reference>
            <el-icon class="m-editor-page-bar-menu-icon">
              <caret-bottom></caret-bottom>
            </el-icon>
          </template>
        </el-popover>
      </div>
    </div>
    <div
      v-if="scrollState.canScroll"
      class="m-editor-page-bar-item m-editor-page-bar-item-icon"
      @click="scrollState.scroll('right')"
    >
      <el-icon><arrow-right-bold></arrow-right-bold></el-icon>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ComputedRef, inject, onMounted, onUnmounted, ref, toRaw, watch } from 'vue';
import { ArrowLeftBold, ArrowRightBold, CaretBottom, Delete, DocumentCopy, Plus } from '@element-plus/icons-vue';

import type { MApp, MPage } from '@tmagic/schema';
import { NodeType } from '@tmagic/schema';

import ToolButton from '@editor/components/ToolButton.vue';
import type { Services } from '@editor/type';
import { generatePageNameByApp } from '@editor/utils/editor';

const useScroll = (root: ComputedRef<MApp | undefined>) => {
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

  return {
    pageBar,
    itemsContainer,
    canScroll,

    itemsContainerWidth,

    scroll,
  };
};

const services = inject<Services>('services');
const editorService = services?.editorService;

const root = computed(() => editorService?.get<MApp>('root'));

const scrollState = useScroll(root);
const page = computed(() => editorService?.get('page'));

const switchPage = (page: MPage) => {
  editorService?.select(page);
};

const addPage = () => {
  if (!editorService) return;
  const pageConfig = {
    type: NodeType.PAGE,
    name: generatePageNameByApp(toRaw(editorService.get('root'))),
  };
  editorService.add(pageConfig);
};

const copy = (node: MPage) => {
  node && editorService?.copy(node);
  editorService?.paste({
    left: 0,
    top: 0,
  });
};

const remove = (node: MPage) => {
  editorService?.remove(node);
};
</script>
