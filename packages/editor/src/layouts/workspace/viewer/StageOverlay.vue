<template>
  <div v-if="stageOverlayVisible" class="m-editor-stage-overlay" @click="closeOverlayHandler">
    <TMagicIcon class="m-editor-stage-overlay-close" :size="'20'" @click="closeOverlayHandler"
      ><CloseBold
    /></TMagicIcon>
    <div ref="stageOverlay" class="m-editor-stage-overlay-container" :style="style" @click.stop></div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, useTemplateRef, watch } from 'vue';
import { CloseBold } from '@element-plus/icons-vue';

import { TMagicIcon } from '@tmagic/design';

import { useServices } from '@editor/hooks/use-services';
import type { StageOptions } from '@editor/type';

const { stageOverlayService, editorService } = useServices();

const stageOptions = inject<StageOptions>('stageOptions');

const stageOverlayEl = useTemplateRef<HTMLDivElement>('stageOverlay');

const stageOverlayVisible = computed(() => stageOverlayService.get('stageOverlayVisible'));
const wrapWidth = computed(() => stageOverlayService.get('wrapWidth'));
const wrapHeight = computed(() => stageOverlayService.get('wrapHeight'));
const stage = computed(() => editorService.get('stage'));

const style = computed(() => ({
  width: `${wrapWidth.value}px`,
  height: `${wrapHeight.value}px`,
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
