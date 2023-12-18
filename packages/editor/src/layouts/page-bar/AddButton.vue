<template>
  <div
    v-if="showAddPageButton"
    id="m-editor-page-bar-add-icon"
    class="m-editor-page-bar-item m-editor-page-bar-item-icon"
    @click="addPage"
  >
    <Icon :icon="Plus"></Icon>
  </div>
  <div v-else style="width: 21px"></div>
</template>

<script setup lang="ts">
import { computed, inject, toRaw } from 'vue';
import { Plus } from '@element-plus/icons-vue';

import { NodeType } from '@tmagic/schema';

import Icon from '@editor/components/Icon.vue';
import type { Services } from '@editor/type';
import { generatePageNameByApp } from '@editor/utils/editor';

defineOptions({
  name: 'MEditorPageBarAddButton',
});

const props = defineProps<{
  type: NodeType.PAGE | NodeType.PAGE_FRAGMENT;
}>();

const services = inject<Services>('services');
const uiService = services?.uiService;
const editorService = services?.editorService;

const showAddPageButton = computed(() => uiService?.get('showAddPageButton'));

const addPage = () => {
  if (!editorService) return;
  const root = toRaw(editorService.get('root'));
  if (!root) throw new Error('root 不能为空');
  const pageConfig = {
    type: props.type,
    name: generatePageNameByApp(root, props.type),
    items: [],
  };
  editorService.add(pageConfig);
};
</script>
