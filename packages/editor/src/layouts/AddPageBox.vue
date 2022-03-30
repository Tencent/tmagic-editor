<template>
  <div class="m-editor-empty-panel">
    <div class="m-editor-empty-content">
      <div class="m-editor-empty-button" @click="clickHandler">
        <div>
          <el-icon><plus /></el-icon>
        </div>
        <p>新增页面</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, toRaw } from 'vue';
import { Plus } from '@element-plus/icons';

import { NodeType } from '@tmagic/schema';

import { Services } from '@editor/type';
import { generatePageNameByApp } from '@editor/utils';

export default defineComponent({
  components: { Plus },

  setup() {
    const services = inject<Services>('services');

    return {
      clickHandler() {
        const { editorService } = services || {};

        if (!editorService) return;

        editorService.add({
          type: NodeType.PAGE,
          name: generatePageNameByApp(toRaw(editorService.get('root'))),
        });
      },
    };
  },
});
</script>
