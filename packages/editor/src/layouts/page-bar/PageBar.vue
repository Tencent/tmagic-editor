<template>
  <div class="m-editor-page-bar-tabs">
    <PageBarScrollContainer
      ref="pageBarScrollContainer"
      :page-bar-sort-options="pageBarSortOptions"
      :length="list.length"
    >
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
        ref="pageBarItems"
        :key="item.id"
        :data-page-id="item.id"
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
import { computed, inject, ref, useTemplateRef, watch } from 'vue';
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

const props = withDefaults(
  defineProps<{
    disabledPageFragment: boolean;
    pageBarSortOptions?: PageBarSortOptions;
    filterFunction?: (page: MPage | MPageFragment, keyword: string) => boolean;
  }>(),
  {
    filterFunction: (page, keyword) => page.name?.includes(keyword) || `${page.id}`.includes(keyword),
  },
);

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
        return props.filterFunction(item, keyword);
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

const pageBarScrollContainerRef = useTemplateRef<InstanceType<typeof PageBarScrollContainer>>('pageBarScrollContainer');
const pageBarItemEls = useTemplateRef<HTMLDivElement[]>('pageBarItems');
watch(page, (page) => {
  if (
    !page ||
    !pageBarScrollContainerRef.value?.itemsContainerWidth ||
    !pageBarItemEls.value ||
    pageBarItemEls.value.length < 2
  ) {
    return;
  }

  const firstItem = pageBarItemEls.value[0];
  const lastItem = pageBarItemEls.value[pageBarItemEls.value.length - 1];

  if (page.id === firstItem.dataset.pageId) {
    pageBarScrollContainerRef.value.scroll('start');
  } else if (page.id === lastItem.dataset.pageId) {
    pageBarScrollContainerRef.value.scroll('end');
  } else {
    const pageItem = pageBarItemEls.value.find((item) => item.dataset.pageId === page.id);
    if (!pageItem) {
      return;
    }

    const pageItemRect = pageItem.getBoundingClientRect();
    const offsetLeft = pageItemRect.left - firstItem.getBoundingClientRect().left;
    const { itemsContainerWidth } = pageBarScrollContainerRef.value;

    const left = itemsContainerWidth - offsetLeft - pageItemRect.width;

    const translateLeft = pageBarScrollContainerRef.value.getTranslateLeft();
    if (offsetLeft + translateLeft < 0 || offsetLeft + pageItemRect.width > itemsContainerWidth - translateLeft) {
      pageBarScrollContainerRef.value.scrollTo(left);
    }
  }
});
</script>
