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
      stageOverlayService.openOverlay(el);
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

const closeOverlayHandler = () => {
  stageOverlayService.closeOverlay();
};
</script>
