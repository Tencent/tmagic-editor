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

    <layout
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
          <add-page-box></add-page-box>
        </slot>
      </template>

      <template v-if="pageLength > 0" #right>
        <el-scrollbar>
          <slot name="props-panel"></slot>
        </el-scrollbar>
      </template>
    </layout>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';

import type { MApp } from '@tmagic/schema';

import { GetColumnWidth, Services } from '../type';

import AddPageBox from './AddPageBox.vue';
import Layout from './Layout.vue';

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

const root = computed(() => editorService?.get<MApp>('root'));

const pageLength = computed(() => editorService?.get<number>('pageLength') || 0);
const showSrc = computed(() => uiService?.get<boolean>('showSrc'));
const columnWidth = ref({
  left: DEFAULT_LEFT_COLUMN_WIDTH,
  center: globalThis.document.body.clientWidth - DEFAULT_LEFT_COLUMN_WIDTH - DEFAULT_RIGHT_COLUMN_WIDTH,
  right: DEFAULT_RIGHT_COLUMN_WIDTH,
});
uiService?.set('columnWidth', columnWidth.value);

const saveCode = (value: string) => {
  try {
    // eslint-disable-next-line no-eval
    editorService?.set('root', eval(value));
  } catch (e: any) {
    console.error(e);
  }
};

const COLUMN_WIDTH_STORAGE_KEY = '$MagicEditorColumnWidthData';

const columnWidthCacheData = globalThis.localStorage.getItem(COLUMN_WIDTH_STORAGE_KEY);
if (columnWidthCacheData) {
  try {
    const columnWidthCache = JSON.parse(columnWidthCacheData);
    columnWidth.value = columnWidthCache;
  } catch (e) {
    console.error(e);
  }
}

const columnWidthChange = (columnWidth: GetColumnWidth) => {
  uiService?.set('columnWidth', columnWidth);
  globalThis.localStorage.setItem(COLUMN_WIDTH_STORAGE_KEY, JSON.stringify(columnWidth));
};
</script>
