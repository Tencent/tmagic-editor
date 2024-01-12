<template>
  <div v-if="stageOverlayVisible" class="m-editor-stage-overlay" @click="closeOverlay">
    <TMagicIcon class="m-editor-stage-overlay-close" :size="20" @click="closeOverlay"><CloseBold /></TMagicIcon>
    <div ref="stageOverlay" class="m-editor-stage-overlay-container" @click.stop></div>
  </div>
</template>

<script setup lang="ts">
import { CloseBold } from '@element-plus/icons-vue';

import { TMagicIcon } from '@tmagic/design';

import { useStageOverlay } from '@editor/hooks/use-stage-overlay';

const { stageOverlayVisible, stageOverlay, closeOverlay } = useStageOverlay();
</script>
