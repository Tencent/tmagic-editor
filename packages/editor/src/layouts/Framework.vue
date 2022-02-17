<template>
  <div class="m-editor">
    <slot name="nav" class="m-editor-nav-menu"></slot>

    <magic-code-editor v-if="showSrc" class="m-editor-content" :init-values="root" @save="saveCode"></magic-code-editor>

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
            <slot name="propsPanel"></slot>
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

import { GetColumnWidth, Services } from '@editor/type';

import AddPageBox from './AddPageBox.vue';
import Resizer from './Resizer.vue';

export default defineComponent({
  components: {
    AddPageBox,
    Resizer,
  },

  setup() {
    const services = inject<Services>('services');

    const root = computed(() => services?.editorService.get<MApp>('root'));

    return {
      root,
      pageLength: computed(() => root.value?.items?.length || 0),
      showSrc: computed(() => services?.uiService.get<boolean>('showSrc')),
      columnWidth: computed(() => services?.uiService.get<GetColumnWidth>('columnWidth')),

      saveCode(value: string) {
        try {
          // eslint-disable-next-line no-eval
          services?.editorService.set('root', eval(value));
        } catch (e: any) {
          console.error(e);
        }
      },
    };
  },
});
</script>
