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

import MIcon from '../components/Icon.vue';
import type { Services } from '../type';
import { generatePageNameByApp } from '../utils';

const services = inject<Services>('services');

const clickHandler = () => {
  const { editorService } = services || {};

  if (!editorService) return;

  editorService.add({
    type: NodeType.PAGE,
    name: generatePageNameByApp(toRaw(editorService.get('root'))),
  });
};
</script>
