<template>
  <div class="m-editor" ref="content" style="min-width: 180px">
    <slot name="header"></slot>

    <slot name="nav"></slot>

    <slot name="content-before"></slot>

    <slot name="src-code" v-if="showSrc">
      <CodeEditor class="m-editor-content" :init-values="root" :options="codeOptions" @save="saveCode"></CodeEditor>
    </slot>

    <SplitView
      v-loading="stageLoading"
      element-loading-text="Runtime 加载中..."
      v-else
      ref="splitView"
      class="m-editor-content"
      left-class="m-editor-framework-left"
      center-class="m-editor-framework-center"
      right-class="m-editor-framework-right"
      v-model:left="columnWidth.left"
      v-model:right="columnWidth.right"
      :min-left="65"
      :min-right="20"
      :min-center="100"
      :width="frameworkRect?.width || 0"
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
          <PageBar :disabled-page-fragment="disabledPageFragment" :page-bar-sort-options="pageBarSortOptions">
            <template #page-bar-title="{ page }"><slot name="page-bar-title" :page="page"></slot></template>
            <template #page-bar-popover="{ page }"><slot name="page-bar-popover" :page="page"></slot></template>
            <template #page-list-popover="{ list }"><slot name="page-list-popover" :list="list"></slot></template>
          </PageBar>
        </slot>
      </template>

      <template v-if="page" #right>
        <TMagicScrollbar>
          <slot name="props-panel"></slot>
        </TMagicScrollbar>
      </template>
    </SplitView>

    <slot name="content-after"></slot>
    <slot name="footer"></slot>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { TMagicScrollbar } from '@tmagic/design';

import SplitView from '@editor/components/SplitView.vue';
import type { FrameworkSlots, GetColumnWidth, PageBarSortOptions, Services } from '@editor/type';
import { getConfig } from '@editor/utils/config';

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
}>();

const DEFAULT_LEFT_COLUMN_WIDTH = 310;
const DEFAULT_RIGHT_COLUMN_WIDTH = 480;

const codeOptions = inject('codeOptions', {});
const { editorService, uiService } = inject<Services>('services') || {};

const content = ref<HTMLDivElement>();
const splitView = ref<InstanceType<typeof SplitView>>();

const root = computed(() => editorService?.get('root'));
const page = computed(() => editorService?.get('page'));

const pageLength = computed(() => editorService?.get('pageLength') || 0);
const stageLoading = computed(() => editorService?.get('stageLoading') || false);
const showSrc = computed(() => uiService?.get('showSrc'));

const LEFT_COLUMN_WIDTH_STORAGE_KEY = '$MagicEditorLeftColumnWidthData';
const RIGHT_COLUMN_WIDTH_STORAGE_KEY = '$MagicEditorRightColumnWidthData';

const getLeftColumnWidthCacheData = () =>
  Number(globalThis.localStorage.getItem(LEFT_COLUMN_WIDTH_STORAGE_KEY)) || DEFAULT_LEFT_COLUMN_WIDTH;

const getRightColumnWidthCacheData = () =>
  Number(globalThis.localStorage.getItem(RIGHT_COLUMN_WIDTH_STORAGE_KEY)) || DEFAULT_RIGHT_COLUMN_WIDTH;

const columnWidth = ref<Partial<GetColumnWidth>>({
  left: getLeftColumnWidthCacheData(),
  center: 0,
  right: getRightColumnWidthCacheData(),
});

watch(pageLength, () => {
  splitView.value?.updateWidth();
});

watch(
  () => uiService?.get('hideSlideBar'),
  (hideSlideBar) => {
    columnWidth.value.left = hideSlideBar ? 0 : getLeftColumnWidthCacheData();
  },
);

const columnWidthChange = (columnW: GetColumnWidth) => {
  columnWidth.value = columnW;

  globalThis.localStorage.setItem(LEFT_COLUMN_WIDTH_STORAGE_KEY, `${columnW.left}`);
  globalThis.localStorage.setItem(RIGHT_COLUMN_WIDTH_STORAGE_KEY, `${columnW.right}`);
  uiService?.set('columnWidth', columnW);
};

const frameworkRect = computed(() => uiService?.get('frameworkRect'));

const resizerObserver = new ResizeObserver((entries) => {
  const { contentRect } = entries[0];
  uiService?.set('frameworkRect', {
    width: contentRect.width,
    height: contentRect.height,
    left: contentRect.left,
    top: contentRect.top,
  });
});

onMounted(() => {
  if (content.value) {
    resizerObserver.observe(content.value);
  }
});

onBeforeUnmount(() => {
  resizerObserver.disconnect();
});

const saveCode = (value: string) => {
  try {
    const parseDSL = getConfig('parseDSL');
    editorService?.set('root', parseDSL(value));
  } catch (e: any) {
    console.error(e);
  }
};
</script>
