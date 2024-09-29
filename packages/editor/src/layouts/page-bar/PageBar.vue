<template>
  <div class="m-editor-page-bar-tabs">
    <PageBarScrollContainer :page-bar-sort-options="pageBarSortOptions" :length="list.length">
      <template #prepend>
        <slot name="page-bar-add-button"><AddButton></AddButton></slot>

        <Search v-model:query="query"></Search>
        <PageList :list="list">
          <template #page-list-popover="{ list }"><slot name="page-list-popover" :list="list"></slot></template>
        </PageList>
      </template>

      <div
        v-for="item in list"
        class="m-editor-page-bar-item"
        :key="item.id"
        :page-id="item.id"
        :class="{ active: page?.id === item.id }"
        @click="switchPage(item.id)"
      >
        <div class="m-editor-page-bar-title">
          <slot name="page-bar-title" :page="item">
            <span :title="item.name">{{ item.name || item.id }}</span>
          </slot>
        </div>

        <TMagicPopover
          popper-class="page-bar-popover"
          placement="top"
          trigger="hover"
          :width="160"
          :destroy-on-close="true"
        >
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
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import { CaretBottom, Delete, DocumentCopy } from '@element-plus/icons-vue';

import { type Id, type MPage, type MPageFragment, NodeType } from '@tmagic/core';
import { TMagicIcon, TMagicPopover } from '@tmagic/design';

import ToolButton from '@editor/components/ToolButton.vue';
import type { PageBarSortOptions, Services } from '@editor/type';

import AddButton from './AddButton.vue';
import PageBarScrollContainer from './PageBarScrollContainer.vue';
import PageList from './PageList.vue';
import Search from './Search.vue';

defineOptions({
  name: 'MEditorPageBar',
});

defineProps<{
  disabledPageFragment: boolean;
  pageBarSortOptions?: PageBarSortOptions;
}>();

const services = inject<Services>('services');
const editorService = services?.editorService;

const root = computed(() => editorService?.get('root'));
const page = computed(() => editorService?.get('page'));

const query = ref<{
  pageType: NodeType[];
  keyword: string;
}>({
  pageType: [NodeType.PAGE, NodeType.PAGE_FRAGMENT],
  keyword: '',
});

const list = computed(() => {
  const { pageType, keyword } = query.value;
  if (pageType.length === 0) {
    return [];
  }

  return (root.value?.items || []).filter((item) => {
    if (pageType.includes(item.type)) {
      if (keyword) {
        return item.name?.includes(keyword);
      }
      return true;
    }
    return false;
  });
});

const switchPage = (id: Id) => {
  editorService?.select(id);
};

const copy = (node: MPage | MPageFragment) => {
  node && editorService?.copy(node);
  editorService?.paste({
    left: 0,
    top: 0,
  });
};

const remove = (node: MPage | MPageFragment) => {
  editorService?.remove(node);
};
</script>
