<template>
  <div class="m-editor-workspace" tabindex="-1">
    <Breadcrumb></Breadcrumb>

    <slot name="stage">
      <MagicStage v-if="page" :stage-content-menu="stageContentMenu"></MagicStage>
    </slot>

    <slot name="workspace-content"></slot>

    <PageBar>
      <template #page-bar-title="{ page }"><slot name="page-bar-title" :page="page"></slot></template>
      <template #page-bar-popover="{ page }"><slot name="page-bar-popover" :page="page"></slot></template>
    </PageBar>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';

import type { MenuButton, MenuComponent, Services } from '@editor/type';

import Breadcrumb from './Breadcrumb.vue';
import PageBar from './PageBar.vue';
import MagicStage from './Stage.vue';

defineOptions({
  name: 'MEditorWorkspace',
});

defineProps<{
  stageContentMenu: (MenuButton | MenuComponent)[];
}>();

const services = inject<Services>('services');

const page = computed(() => services?.editorService.get('page'));
</script>
