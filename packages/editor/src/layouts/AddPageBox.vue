<template>
  <div class="m-editor-empty-panel">
    <div class="m-editor-empty-content">
      <div class="m-editor-empty-button" @click="clickHandler(NodeType.PAGE)">
        <div>
          <MIcon :icon="Plus"></MIcon>
        </div>
        <p>新增页面</p>
      </div>

      <div v-if="!disabledPageFragment" class="m-editor-empty-button" @click="clickHandler(NodeType.PAGE_FRAGMENT)">
        <div>
          <MIcon :icon="Plus"></MIcon>
        </div>
        <p>新增页面片</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { inject, toRaw } from 'vue';
import { Plus } from '@element-plus/icons-vue';

import { NodeType } from '@tmagic/schema';

import MIcon from '@editor/components/Icon.vue';
import type { Services } from '@editor/type';
import { generatePageNameByApp } from '@editor/utils';

defineOptions({
  name: 'MEditorAddPageBox',
});

defineProps<{
  disabledPageFragment: boolean;
}>();

const services = inject<Services>('services');

const clickHandler = (type: NodeType.PAGE | NodeType.PAGE_FRAGMENT) => {
  const { editorService } = services || {};

  if (!editorService) return;

  const root = toRaw(editorService.get('root'));
  if (!root) throw new Error('root 不能为空');

  editorService.add({
    type,
    name: generatePageNameByApp(root, type),
    items: [],
  });
};
</script>
