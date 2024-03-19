<template>
  <div v-if="stageOverlayVisible" class="m-editor-stage-overlay" @click="closeOverlayHandler">
    <TMagicIcon class="m-editor-stage-overlay-close" :size="'20'" @click="closeOverlayHandler"
      ><CloseBold
    /></TMagicIcon>
    <div ref="stageOverlay" class="m-editor-stage-overlay-container" :style="style" @click.stop></div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import { CloseBold } from '@element-plus/icons-vue';

import { TMagicIcon } from '@tmagic/design';

import type { Services, StageOptions } from '@editor/type';

const services = inject<Services>('services');

const stageOptions = inject<StageOptions>('stageOptions');

const stageOverlay = ref<HTMLDivElement>();

const stageOverlayVisible = computed(() => services?.stageOverlayService.get('stageOverlayVisible'));
const wrapWidth = computed(() => services?.stageOverlayService.get('wrapWidth') || 0);
const wrapHeight = computed(() => services?.stageOverlayService.get('wrapHeight') || 0);
const stage = computed(() => services?.editorService.get('stage'));

const style = computed(() => ({
  width: `${wrapWidth.value}px`,
  height: `${wrapHeight.value}px`,
}));

watch(stage, (stage) => {
  if (stage) {
    stage.on('dblclick', async (event: MouseEvent) => {
      const el = await stage.actionManager.getElementFromPoint(event);
      services?.stageOverlayService.openOverlay(el);
    });
  } else {
    services?.stageOverlayService.closeOverlay();
  }
});

watch(stageOverlay, (stageOverlay) => {
  if (!services) return;

  const subStage = services.stageOverlayService.createStage(stageOptions);
  services?.stageOverlayService.set('stage', subStage);

  if (stageOverlay && subStage) {
    subStage.mount(stageOverlay);

    const { mask, renderer } = subStage;

    const { contentWindow } = renderer;
    mask.showRule(false);

    services?.stageOverlayService.updateOverlay();

    contentWindow?.magic.onRuntimeReady({});
  }
});

const closeOverlayHandler = () => {
  services?.stageOverlayService.closeOverlay();
};
</script>
