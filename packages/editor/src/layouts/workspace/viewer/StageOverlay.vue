<template>
  <div v-if="stageOverlayVisible" class="m-editor-stage-overlay">
    <TMagicIcon class="m-editor-stage-overlay-close" :size="'30'" @click="closeOverlayHandler"
      ><CloseBold
    /></TMagicIcon>

    <ScrollViewer
      class="m-editor-stage"
      :width="wrapWidth"
      :height="wrapHeight"
      :wrap-width="columnWidth.center"
      :wrap-height="frameworkRect.height"
      :zoom="zoom"
    >
      <div ref="stageOverlay" class="m-editor-stage-container" :style="style"></div>
    </ScrollViewer>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, useTemplateRef, watch } from 'vue';
import { CloseBold } from '@element-plus/icons-vue';

import { TMagicIcon } from '@tmagic/design';
import { getIdFromEl } from '@tmagic/utils';

import ScrollViewer from '@editor/components/ScrollViewer.vue';
import { useServices } from '@editor/hooks/use-services';
import type { StageOptions } from '@editor/type';

const { stageOverlayService, editorService, uiService } = useServices();

const stageOptions = inject<StageOptions>('stageOptions');

const stageOverlayEl = useTemplateRef<HTMLDivElement>('stageOverlay');

const stageOverlayVisible = computed(() => stageOverlayService.get('stageOverlayVisible'));
const wrapWidth = computed(() => stageOverlayService.get('wrapWidth'));
const wrapHeight = computed(() => stageOverlayService.get('wrapHeight'));
const stage = computed(() => editorService.get('stage'));
const zoom = computed(() => uiService.get('zoom'));
const columnWidth = computed(() => uiService.get('columnWidth'));
const frameworkRect = computed(() => uiService.get('frameworkRect'));

const style = computed(() => ({
  transform: `scale(${zoom.value})`,
}));

watch(stage, (stage) => {
  if (stage) {
    stage.on('dblclick', async (event: MouseEvent) => {
      const el = (await stage.actionManager?.getElementFromPoint(event)) || null;
      if (!el) return;

      const id = getIdFromEl()(el);
      if (id) {
        const node = editorService.getNodeById(id);
        if (node?.type === 'page-fragment-container' && node.pageFragmentId) {
          await editorService.select(node.pageFragmentId);
          return;
        }
      }

      if (isClippedByScrollContainer(el)) {
        stageOverlayService.openOverlay(el);
      }
    });
  } else {
    stageOverlayService.closeOverlay();
  }
});

watch(zoom, (zoom) => {
  const stage = stageOverlayService.get('stage');
  if (!stage || !zoom) return;
  stage.setZoom(zoom);
});

watch(stageOverlayEl, (stageOverlay) => {
  const subStage = stageOverlayService.createStage(stageOptions);
  stageOverlayService.set('stage', subStage);

  if (stageOverlay && subStage) {
    subStage.mount(stageOverlay);

    const { mask, renderer } = subStage;

    const { contentWindow } = renderer!;
    mask?.showRule(false);

    stageOverlayService.updateOverlay();

    contentWindow?.magic.onRuntimeReady({});
  }
});

onBeforeUnmount(() => {
  stageOverlayService.get('stage')?.destroy();
  stageOverlayService.set('stage', null);
});

/**
 * 判断元素是否被非页面级的滚动容器裁剪（未完整显示）
 *
 * 从元素向上遍历祖先节点，跳过页面/页面片容器，
 * 检查是否存在设置了 overflow 的滚动容器将该元素裁剪，
 * 只有元素未被完整显示时才需要打开 overlay 以展示完整内容
 */
const isClippedByScrollContainer = (el: HTMLElement): boolean => {
  const win = el.ownerDocument.defaultView;
  if (!win) return false;

  // 收集所有页面和页面片的 id
  const root = editorService.get('root');
  const pageIds = new Set(root?.items?.map((item) => `${item.id}`) ?? []);

  // el 本身就是页面或页面片，无需判断
  const elId = getIdFromEl()(el);
  if (elId && pageIds.has(elId)) return false;

  let parent = el.parentElement;

  while (parent && parent !== el.ownerDocument.documentElement) {
    const parentId = getIdFromEl()(parent);

    // 到达页面或页面片层级，不再继续向上查找
    if (parentId && pageIds.has(parentId)) {
      return false;
    }

    const { overflowX, overflowY } = win.getComputedStyle(parent);

    if (
      ['auto', 'scroll', 'hidden'].includes(overflowX) ||
      ['auto', 'scroll', 'hidden'].includes(overflowY) ||
      parent.scrollWidth > parent.clientWidth ||
      parent.scrollHeight > parent.clientHeight
    ) {
      // 比较元素与容器的可视区域，判断元素是否被裁剪
      const elRect = el.getBoundingClientRect();
      const containerRect = parent.getBoundingClientRect();
      if (
        elRect.top < containerRect.top ||
        elRect.left < containerRect.left ||
        elRect.bottom > containerRect.bottom ||
        elRect.right > containerRect.right
      ) {
        return true;
      }
    }
    parent = parent.parentElement;
  }
  return false;
};

const closeOverlayHandler = () => {
  stageOverlayService.closeOverlay();
};
</script>
