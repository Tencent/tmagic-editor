<template>
  <div v-if="nodes.length === 1" ref="containerRef" class="m-editor-breadcrumb">
    <template v-for="(item, index) in displayPath" :key="item.isEllipsis ? `ellipsis-${index}` : item.id">
      <span v-if="item.isEllipsis" class="m-editor-breadcrumb-ellipsis">...</span>
      <TMagicTooltip v-else :content="item.name" placement="top" :show-after="500">
        <TMagicButton class="m-editor-breadcrumb-item" link :disabled="item.id === node?.id" @click="select(item)">{{
          item.name
        }}</TMagicButton>
      </TMagicTooltip>
      <span v-if="index < displayPath.length - 1" class="m-editor-breadcrumb-separator">/</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import type { MNode } from '@tmagic/core';
import { TMagicButton, TMagicTooltip } from '@tmagic/design';
import { getNodePath } from '@tmagic/utils';

import { useServices } from '@editor/hooks/use-services';

defineOptions({
  name: 'MEditorBreadcrumb',
});

type DisplayItem = (MNode & { isEllipsis?: false }) | { isEllipsis: true; id: string; name: string };

const { editorService } = useServices();

const node = computed(() => editorService.get('node'));
const nodes = computed(() => editorService.get('nodes'));
const root = computed(() => editorService.get('root'));
const path = computed(() => getNodePath(node.value?.id || '', root.value?.items || []));

const containerRef = ref<HTMLElement | null>(null);
// 当面包屑宽度超过父元素宽度的阈值时折叠
const COLLAPSE_RATIO = 0.8;
const collapsed = ref(false);

const displayPath = computed<DisplayItem[]>(() => {
  const list = path.value;
  // 折叠后视觉元素数（first + ... + last2 = 4 个），所以只有路径 > 3 时折叠才能减少占位
  if (!collapsed.value || list.length <= 3) {
    return list as DisplayItem[];
  }
  return [
    list[0],
    { isEllipsis: true, id: '__ellipsis__', name: '...' },
    list[list.length - 2],
    list[list.length - 1],
  ] as DisplayItem[];
});

const measureOverflow = async () => {
  // 先恢复完整渲染再测量，避免折叠后误判
  if (collapsed.value) {
    collapsed.value = false;
    await nextTick();
  }
  const el = containerRef.value;
  const parent = el?.parentElement;
  if (!el || !parent) return;
  // scrollWidth 取内容自然宽度（不受自身 max-width 影响），与父容器宽度做比例判断
  const contentWidth = el.scrollWidth;
  const parentWidth = parent.clientWidth;
  if (parentWidth <= 0) return;
  collapsed.value = contentWidth > parentWidth * COLLAPSE_RATIO;
};

let resizeObserver: ResizeObserver | null = null;

const observe = () => {
  resizeObserver?.disconnect();
  const el = containerRef.value;
  if (!el || typeof ResizeObserver === 'undefined') return;
  resizeObserver = new ResizeObserver(() => {
    measureOverflow();
  });
  resizeObserver.observe(el);
  if (el.parentElement) {
    resizeObserver.observe(el.parentElement);
  }
};

onMounted(() => {
  observe();
  measureOverflow();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});

watch(
  () => nodes.value.length,
  async () => {
    await nextTick();
    observe();
    measureOverflow();
  },
);

watch(path, async () => {
  await nextTick();
  measureOverflow();
});

const select = async (node: MNode) => {
  await editorService.select(node);
  editorService.get('stage')?.select(node.id);
};
</script>
