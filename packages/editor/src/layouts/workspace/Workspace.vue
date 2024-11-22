<template>
  <div class="m-editor-workspace">
    <Breadcrumb></Breadcrumb>

    <slot name="stage">
      <MagicStage
        v-if="page && (stageOptions?.render || stageOptions?.runtimeUrl)"
        :stage-options="stageOptions"
        :disabled-stage-overlay="disabledStageOverlay"
        :stage-content-menu="stageContentMenu"
        :custom-content-menu="customContentMenu"
      ></MagicStage>
    </slot>

    <slot name="workspace-content"></slot>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';

import type { MenuButton, MenuComponent, Services, StageOptions, WorkspaceSlots } from '@editor/type';

import MagicStage from './viewer/Stage.vue';
import Breadcrumb from './Breadcrumb.vue';

defineSlots<WorkspaceSlots>();

defineOptions({
  name: 'MEditorWorkspace',
});

withDefaults(
  defineProps<{
    stageContentMenu: (MenuButton | MenuComponent)[];
    disabledStageOverlay?: boolean;
    customContentMenu?: (menus: (MenuButton | MenuComponent)[], type: string) => (MenuButton | MenuComponent)[];
  }>(),
  {
    disabledStageOverlay: false,
  },
);

const stageOptions = inject<StageOptions>('stageOptions');

const services = inject<Services>('services');

const page = computed(() => services?.editorService.get('page'));
</script>
