<template>
  <div
    v-if="showAddPageButton"
    id="m-editor-page-bar-add-icon"
    class="m-editor-page-bar-item m-editor-page-bar-item-icon"
  >
    <TMagicPopover popper-class="data-source-list-panel-add-menu">
      <template #reference>
        <Icon :icon="Plus"></Icon>
      </template>

      <ToolButton
        :data="{
          type: 'button',
          text: '页面',
          handler: () => {
            addPage(NodeType.PAGE);
          },
        }"
      ></ToolButton>
      <ToolButton
        :data="{
          type: 'button',
          text: '页面片',
          handler: () => {
            addPage(NodeType.PAGE_FRAGMENT);
          },
        }"
      ></ToolButton>
    </TMagicPopover>
  </div>
  <div v-else style="width: 21px"></div>
</template>

<script setup lang="ts">
import { computed, inject, toRaw } from 'vue';
import { Plus } from '@element-plus/icons-vue';

import { NodeType } from '@tmagic/core';
import { TMagicPopover } from '@tmagic/design';

import Icon from '@editor/components/Icon.vue';
import ToolButton from '@editor/components/ToolButton.vue';
import type { Services } from '@editor/type';
import { generatePageNameByApp } from '@editor/utils/editor';

defineOptions({
  name: 'MEditorPageBarAddButton',
});

const services = inject<Services>('services');
const uiService = services?.uiService;
const editorService = services?.editorService;

const showAddPageButton = computed(() => uiService?.get('showAddPageButton'));

const addPage = (type: NodeType.PAGE | NodeType.PAGE_FRAGMENT) => {
  if (!editorService) return;
  const root = toRaw(editorService.get('root'));
  if (!root) throw new Error('root 不能为空');
  const pageConfig = {
    type,
    name: generatePageNameByApp(root, type),
    items: [],
  };
  editorService.add(pageConfig);
};
</script>
