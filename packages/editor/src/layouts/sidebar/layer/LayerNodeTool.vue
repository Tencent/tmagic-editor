<template>
  <template v-if="data.type !== 'page'">
    <MIcon v-if="data.visible === false" :icon="Hide" @click.stop="setNodeVisible(true)" title="点击显示"></MIcon>
    <MIcon v-else :icon="View" @click.stop="setNodeVisible(false)" class="node-lock" title="点击隐藏"></MIcon>
  </template>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { Hide, View } from '@element-plus/icons-vue';

import type { MNode } from '@tmagic/schema';

import MIcon from '@editor/components/Icon.vue';
import { Services } from '@editor/type';

const props = defineProps<{
  data: MNode;
}>();

const services = inject<Services>('services');
const editorService = services?.editorService;

const setNodeVisible = (visible: boolean) => {
  if (!editorService) return;

  editorService.update({
    id: props.data.id,
    visible,
  });
};
</script>
