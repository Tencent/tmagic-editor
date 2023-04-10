<template>
  <div class="m-editor-empty-panel">
    <div class="m-editor-empty-content">
      <div class="m-editor-empty-button" @click="clickHandler">
        <div>
          <MIcon :icon="Plus"></MIcon>
        </div>
        <p>新增页面</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup name="MEditorAddPageBox">
import { inject, toRaw } from 'vue';
import { Plus } from '@element-plus/icons-vue';

import { NodeType } from '@tmagic/schema';

import MIcon from '@editor/components/Icon.vue';
import type { Services } from '@editor/type';
import { generatePageNameByApp } from '@editor/utils';

const services = inject<Services>('services');

const clickHandler = () => {
  const { editorService } = services || {};

  if (!editorService) return;

  const root = toRaw(editorService.get('root'));
  if (!root) throw new Error('root 不能为空');

  editorService.add({
    type: NodeType.PAGE,
    name: generatePageNameByApp(root),
  });
};
</script>
