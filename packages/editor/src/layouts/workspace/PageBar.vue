<template>
  <PageBarScrollContainer>
    <div
      v-for="item in (root && root.items) || []"
      class="m-editor-page-bar-item"
      :key="item.key"
      :class="{ active: page?.id === item.id }"
      @click="switchPage(item)"
    >
      <div class="m-editor-page-bar-title">
        <slot name="page-bar-title" :page="item">
          <TMagicTooltip effect="dark" placement="top-start" :content="item.name">
            <span>{{ item.name || item.id }}</span>
          </TMagicTooltip>
        </slot>
      </div>

      <TMagicPopover popper-class="page-bar-popover" placement="top" :width="160" trigger="hover">
        <div>
          <slot name="page-bar-popover" :page="item">
            <ToolButton
              :data="{
                type: 'button',
                text: '复制',
                icon: DocumentCopy,
                handler: () => copy(item),
              }"
            ></ToolButton>
            <ToolButton
              :data="{
                type: 'button',
                text: '删除',
                icon: Delete,
                handler: () => remove(item),
              }"
            ></ToolButton>
          </slot>
        </div>
        <template #reference>
          <TMagicIcon class="m-editor-page-bar-menu-icon">
            <CaretBottom></CaretBottom>
          </TMagicIcon>
        </template>
      </TMagicPopover>
    </div>
  </PageBarScrollContainer>
</template>

<script lang="ts" setup name="MEditorPageBar">
import { computed, inject } from 'vue';
import { CaretBottom, Delete, DocumentCopy } from '@element-plus/icons-vue';

import { TMagicIcon, TMagicPopover, TMagicTooltip } from '@tmagic/design';
import type { MPage } from '@tmagic/schema';

import ToolButton from '@editor/components/ToolButton.vue';
import type { Services } from '@editor/type';

import PageBarScrollContainer from './PageBarScrollContainer.vue';

const services = inject<Services>('services');
const editorService = services?.editorService;

const root = computed(() => editorService?.get('root'));

const page = computed(() => editorService?.get('page'));

const switchPage = (page: MPage) => {
  editorService?.select(page);
};

const copy = (node: MPage) => {
  node && editorService?.copy(node);
  editorService?.paste({
    left: 0,
    top: 0,
  });
};

const remove = (node: MPage) => {
  editorService?.remove(node);
};
</script>
