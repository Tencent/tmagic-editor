<template>
  <div
    v-if="showPageListButton"
    id="m-editor-page-bar-list-icon"
    class="m-editor-page-bar-item m-editor-page-bar-item-icon"
  >
    <TMagicPopover popper-class="page-bar-popover" placement="top" :width="160" trigger="hover">
      <div>
        <slot name="page-list-popover" :list="list">
          <ToolButton
            v-for="(item, index) in list"
            :data="{
              type: 'button',
              text: item.devconfig?.tabName || item.name || item.id,
              handler: () => switchPage(item.id),
            }"
            :key="index"
          ></ToolButton>
        </slot>
      </div>
      <template #reference>
        <TMagicIcon class="m-editor-page-list-menu-icon">
          <Files></Files>
        </TMagicIcon>
      </template>
    </TMagicPopover>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { Files } from '@element-plus/icons-vue';

import { TMagicIcon, TMagicPopover } from '@tmagic/design';
import { Id, MPage, MPageFragment } from '@tmagic/schema';

import ToolButton from '@editor/components/ToolButton.vue';
import type { Services } from '@editor/type';
defineOptions({
  name: 'MEditorPageList',
});

defineProps<{
  list: MPage[] | MPageFragment[];
}>();

const services = inject<Services>('services');
const uiService = services?.uiService;
const editorService = services?.editorService;

const showPageListButton = computed(() => uiService?.get('showPageListButton'));
const switchPage = (id: Id) => {
  editorService?.select(id);
};
</script>
