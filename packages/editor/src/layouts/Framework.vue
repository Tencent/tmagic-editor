<template>
  <div class="m-editor" ref="content" style="min-width: 900px">
    <slot name="header"></slot>

    <slot name="nav"></slot>

    <slot name="content-before"></slot>

    <slot name="src-code" v-if="showSrc">
      <CodeEditor class="m-editor-content" :init-values="root" :options="codeOptions" @save="saveCode"></CodeEditor>
    </slot>

    <SplitView
      v-else
      ref="splitView"
      class="m-editor-content"
      left-class="m-editor-framework-left"
      center-class="m-editor-framework-center"
      right-class="m-editor-framework-right"
      :left="columnWidth.left"
      :right="columnWidth.right"
      :min-left="MIN_LEFT_COLUMN_WIDTH"
      :min-right="MIN_RIGHT_COLUMN_WIDTH"
      :min-center="MIN_CENTER_COLUMN_WIDTH"
      :width="frameworkRect.width"
      @change="columnWidthChange"
    >
      <template #left>
        <slot name="sidebar"></slot>
      </template>

      <template #center>
        <slot v-if="page" name="workspace"></slot>
        <slot v-else name="empty">
          <AddPageBox :disabled-page-fragment="disabledPageFragment"></AddPageBox>
        </slot>

        <slot name="page-bar">
          <PageBar
            :disabled-page-fragment="disabledPageFragment"
            :page-bar-sort-options="pageBarSortOptions"
            :filter-function="pageFilterFunction"
          >
            <template #page-bar-add-button><slot name="page-bar-add-button"></slot></template>
            <template #page-bar-title="{ page }"><slot name="page-bar-title" :page="page"></slot></template>
            <template #page-bar-popover="{ page }"><slot name="page-bar-popover" :page="page"></slot></template>
            <template #page-list-popover="{ list }"><slot name="page-list-popover" :list="list"></slot></template>
          </PageBar>
        </slot>
      </template>

      <template v-if="page" #right>
        <slot name="props-panel"></slot>
      </template>
    </SplitView>

    <slot name="content-after"></slot>
    <slot name="footer"></slot>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue';

import type { MPage, MPageFragment } from '@tmagic/core';

import SplitView from '@editor/components/SplitView.vue';
import { useServices } from '@editor/hooks/use-services';
import { Protocol } from '@editor/services/storage';
import type { FrameworkSlots, GetColumnWidth, PageBarSortOptions } from '@editor/type';
import { getEditorConfig } from '@editor/utils/config';
import {
  DEFAULT_LEFT_COLUMN_WIDTH,
  LEFT_COLUMN_WIDTH_STORAGE_KEY,
  MIN_CENTER_COLUMN_WIDTH,
  MIN_LEFT_COLUMN_WIDTH,
  MIN_RIGHT_COLUMN_WIDTH,
  RIGHT_COLUMN_WIDTH_STORAGE_KEY,
} from '@editor/utils/const';

import PageBar from './page-bar/PageBar.vue';
import AddPageBox from './AddPageBox.vue';
import CodeEditor from './CodeEditor.vue';

defineSlots<FrameworkSlots>();

defineOptions({
  name: 'MEditorFramework',
});

defineProps<{
  disabledPageFragment: boolean;
  pageBarSortOptions?: PageBarSortOptions;
  pageFilterFunction?: (_page: MPage | MPageFragment, _keyword: string) => boolean;
}>();

const codeOptions = inject('codeOptions', {});
const { editorService, uiService, storageService } = useServices();

const contentEl = useTemplateRef<HTMLDivElement>('content');
const splitViewRef = useTemplateRef<InstanceType<typeof SplitView>>('splitView');

const root = computed(() => editorService.get('root'));
const page = computed(() => editorService.get('page'));

const pageLength = computed(() => editorService.get('pageLength') || 0);
const showSrc = computed(() => uiService.get('showSrc'));

const columnWidth = computed(() => uiService.get('columnWidth'));

watch(pageLength, () => {
  splitViewRef.value?.updateWidth();
});

watch(
  () => uiService.get('hideSlideBar'),
  (hideSlideBar) => {
    uiService.set('columnWidth', {
      ...columnWidth.value,
      left: hideSlideBar
        ? 0
        : storageService.getItem(LEFT_COLUMN_WIDTH_STORAGE_KEY, { protocol: Protocol.NUMBER }) ||
          DEFAULT_LEFT_COLUMN_WIDTH,
    });
  },
);

const columnWidthChange = (columnW: GetColumnWidth) => {
  storageService.setItem(LEFT_COLUMN_WIDTH_STORAGE_KEY, columnW.left, { protocol: Protocol.NUMBER });
  storageService.setItem(RIGHT_COLUMN_WIDTH_STORAGE_KEY, columnW.right, { protocol: Protocol.NUMBER });

  uiService.set('columnWidth', columnW);
};

const frameworkRect = computed(() => uiService.get('frameworkRect'));

const resizerObserver = new ResizeObserver((entries) => {
  const { contentRect } = entries[0];
  uiService.set('frameworkRect', {
    width: contentRect.width,
    height: contentRect.height,
    left: contentRect.left,
    top: contentRect.top,
  });
});

onMounted(() => {
  if (contentEl.value) {
    resizerObserver.observe(contentEl.value);
  }
});

onBeforeUnmount(() => {
  resizerObserver.disconnect();
});

const saveCode = (value: string) => {
  try {
    const parseDSL = getEditorConfig('parseDSL');
    editorService.set('root', parseDSL(value));
  } catch (e: any) {
    console.error(e);
  }
};
</script>
