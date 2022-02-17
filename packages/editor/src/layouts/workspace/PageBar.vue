<template>
  <div class="m-editor-page-bar">
    <div class="m-editor-page-bar-item" @click="addPage">
      <el-icon class="m-editor-page-bar-menu-add-icon"><plus></plus></el-icon>
    </div>
    <template v-if="root">
      <div
        v-for="item in root.items"
        :key="item.key"
        class="m-editor-page-bar-item"
        :class="{ active: page?.id === item.id }"
        @click="switchPage(item)"
      >
        <slot name="page-bar-title" :page="item">
          <span>{{ item.name }}</span>
        </slot>

        <el-popover placement="top" :width="160" trigger="hover">
          <div>
            <slot name="page-bar-popover" :page="item">
              <div class="magic-editor-content-menu-item" @click="() => copy(item)">复制</div>
              <div class="magic-editor-content-menu-item" @click="() => remove(item)">删除</div>
            </slot>
          </div>
          <template #reference>
            <el-icon class="m-editor-page-bar-menu-icon">
              <caret-bottom></caret-bottom>
            </el-icon>
          </template>
        </el-popover>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, toRaw } from 'vue';
import { CaretBottom, Plus } from '@element-plus/icons';

import type { MPage } from '@tmagic/schema';

import type { Services } from '@editor/type';
import { generatePageNameByApp } from '@editor/utils/editor';

export default defineComponent({
  components: { CaretBottom, Plus },

  setup() {
    const services = inject<Services>('services');
    const editorService = services?.editorService;

    return {
      root: computed(() => editorService?.get('root')),
      page: computed(() => editorService?.get('page')),

      switchPage(page: MPage) {
        editorService?.select(page);
      },

      addPage() {
        if (!editorService) return;
        const pageConfig = {
          type: 'page',
          name: generatePageNameByApp(toRaw(editorService.get('root'))),
        };
        editorService.add(pageConfig);
      },

      copy(node: MPage) {
        node && editorService?.copy(node);
        editorService?.paste({
          left: 0,
          top: 0,
        });
      },

      remove(node: MPage) {
        editorService?.remove(node);
      },
    };
  },
});
</script>
