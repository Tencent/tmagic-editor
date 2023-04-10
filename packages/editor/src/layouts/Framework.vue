<template>
  <div class="m-editor">
    <slot name="nav" class="m-editor-nav-menu"></slot>

    <magic-code-editor
      v-if="showSrc"
      class="m-editor-content"
      :init-values="root"
      :options="codeOptions"
      @save="saveCode"
    ></magic-code-editor>

    <Layout
      v-else
      class="m-editor-content"
      left-class="m-editor-framework-left"
      center-class="m-editor-framework-center"
      right-class="m-editor-framework-right"
      v-model:left="columnWidth.left"
      v-model:right="columnWidth.right"
      :min-left="45"
      :min-right="1"
      @change="columnWidthChange"
    >
      <template #left>
        <slot name="sidebar"></slot>
      </template>

      <template #center>
        <slot v-if="pageLength > 0" name="workspace"></slot>
        <slot v-else name="empty">
          <AddPageBox></AddPageBox>
        </slot>
      </template>

      <template v-if="pageLength > 0 && nodes.length === 1" #right>
        <TMagicScrollbar>
          <slot name="props-panel"></slot>
        </TMagicScrollbar>
      </template>
    </Layout>
  </div>
</template>

<script lang="ts" setup name="MEditorFramework">
import { computed, inject, ref, watch } from 'vue';

import { TMagicScrollbar } from '@tmagic/design';

import Layout from '@editor/components/Layout.vue';
import type { GetColumnWidth, Services } from '@editor/type';

import AddPageBox from './AddPageBox.vue';

const DEFAULT_LEFT_COLUMN_WIDTH = 310;
const DEFAULT_RIGHT_COLUMN_WIDTH = 480;

withDefaults(
  defineProps<{
    codeOptions?: Record<string, any>;
  }>(),
  {
    codeOptions: () => ({}),
  },
);

const { editorService, uiService } = inject<Services>('services') || {};

const root = computed(() => editorService?.get('root'));
const nodes = computed(() => editorService?.get('nodes') || []);

const pageLength = computed(() => editorService?.get('pageLength') || 0);
const showSrc = computed(() => uiService?.get('showSrc'));

const LEFT_COLUMN_WIDTH_STORAGE_KEY = '$MagicEditorLeftColumnWidthData';
const RIGHT_COLUMN_WIDTH_STORAGE_KEY = '$MagicEditorRightColumnWidthData';

const leftColumnWidthCacheData = Number(globalThis.localStorage.getItem(LEFT_COLUMN_WIDTH_STORAGE_KEY));
const RightColumnWidthCacheData = Number(globalThis.localStorage.getItem(RIGHT_COLUMN_WIDTH_STORAGE_KEY));

const columnWidth = ref<Partial<GetColumnWidth>>({
  left: leftColumnWidthCacheData,
  center: 0,
  right: RightColumnWidthCacheData,
});

watch(
  pageLength,
  (length) => {
    const left = columnWidth.value.left || DEFAULT_LEFT_COLUMN_WIDTH;

    columnWidth.value.left = left;

    if (length <= 0) {
      columnWidth.value.right = undefined;
      columnWidth.value.center = globalThis.document.body.clientWidth - left;
    } else {
      const right = columnWidth.value.right || RightColumnWidthCacheData || DEFAULT_RIGHT_COLUMN_WIDTH;
      columnWidth.value.right = right;
      columnWidth.value.center = globalThis.document.body.clientWidth - left - right;
    }

    uiService?.set('columnWidth', columnWidth.value as GetColumnWidth);
  },
  {
    immediate: true,
  },
);

watch(
  () => columnWidth.value.right,
  (right) => {
    if (typeof right === 'undefined') return;
    globalThis.localStorage.setItem(RIGHT_COLUMN_WIDTH_STORAGE_KEY, `${right}`);
  },
);

watch(
  () => columnWidth.value.left,
  (left) => {
    globalThis.localStorage.setItem(LEFT_COLUMN_WIDTH_STORAGE_KEY, `${left}`);
  },
);

const columnWidthChange = (columnW: GetColumnWidth) => {
  columnWidth.value.left = columnW.left;
  columnWidth.value.center = columnW.center;
  columnWidth.value.right = columnW.right;
  uiService?.set('columnWidth', columnW);
};

const saveCode = (value: string) => {
  try {
    // eslint-disable-next-line no-eval
    editorService?.set('root', eval(value));
  } catch (e: any) {
    console.error(e);
  }
};
</script>
