<template>
  <div
    v-if="showPageListButton"
    id="m-editor-page-bar-list-icon"
    class="m-editor-page-bar-item m-editor-page-bar-item-icon"
  >
    <TMagicPopover
      popper-class="page-bar-popover"
      placement="top"
      trigger="hover"
      :width="160"
      :destroy-on-close="true"
    >
      <div>
        <slot name="page-list-popover" :list="list">
          <ToolButton
            v-for="(item, index) in list"
            :data="{
              type: 'button',
              text: item.devconfig?.tabName || item.name || item.id,
              className: item.id === page?.id ? 'active' : '',
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
import { computed } from 'vue';
import { Files } from '@element-plus/icons-vue';

import { Id, MPage, MPageFragment } from '@tmagic/core';
import { TMagicIcon, TMagicPopover } from '@tmagic/design';

import ToolButton from '@editor/components/ToolButton.vue';
import { useServices } from '@editor/hooks/use-services';
defineOptions({
  name: 'MEditorPageList',
});

defineProps<{
  list: (MPage | MPageFragment)[];
}>();

const { editorService, uiService } = useServices();

const showPageListButton = computed(() => uiService.get('showPageListButton'));
const page = computed(() => editorService.get('page'));
const switchPage = async (id: Id) => {
  await editorService.select(id);
};
</script>
