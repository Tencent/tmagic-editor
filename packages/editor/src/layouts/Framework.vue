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

    <div class="m-editor-content" v-else>
      <div class="m-editor-framework-left" :style="`width: ${columnWidth?.left}px`">
        <slot name="sidebar"></slot>
      </div>

      <resizer type="left"></resizer>

      <template v-if="pageLength > 0">
        <div class="m-editor-framework-center" :style="`width: ${columnWidth?.center}px`">
          <slot name="workspace"></slot>
        </div>

        <resizer type="right"></resizer>

        <div class="m-editor-framework-right" :style="`width: ${columnWidth?.right}px`">
          <el-scrollbar>
            <slot name="props-panel"></slot>
          </el-scrollbar>
        </div>
      </template>

      <slot v-else name="empty">
        <add-page-box></add-page-box>
      </slot>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject } from 'vue';

import type { MApp } from '@tmagic/schema';

import { GetColumnWidth, Services } from '../type';

import AddPageBox from './AddPageBox.vue';
import Resizer from './Resizer.vue';

export default defineComponent({
  components: {
    AddPageBox,
    Resizer,
  },

  props: {
    codeOptions: {
      type: Object,
      default: () => ({}),
    },
  },

  setup() {
    const { editorService, uiService } = inject<Services>('services') || {};

    const root = computed(() => editorService?.get<MApp>('root'));

    return {
      root,
      pageLength: computed(() => editorService?.get<number>('pageLength') || 0),
      showSrc: computed(() => uiService?.get<boolean>('showSrc')),
      columnWidth: computed(() => uiService?.get<GetColumnWidth>('columnWidth')),

      saveCode(value: string) {
        try {
          // eslint-disable-next-line no-eval
          editorService?.set('root', eval(value));
        } catch (e: any) {
          console.error(e);
        }
      },
    };
  },
});
</script>
