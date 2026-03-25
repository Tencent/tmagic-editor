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

import { useServices } from '@editor/hooks/use-services';
import type { CustomContentMenuFunction, MenuButton, MenuComponent, StageOptions, WorkspaceSlots } from '@editor/type';

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
    customContentMenu: CustomContentMenuFunction;
  }>(),
  {
    disabledStageOverlay: false,
  },
);

const stageOptions = inject<StageOptions>('stageOptions');

const { editorService } = useServices();

const page = computed(() => editorService.get('page'));
</script>
