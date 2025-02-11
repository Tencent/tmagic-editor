<template>
  <template v-if="data.type !== 'page'">
    <MIcon v-if="data.visible === false" :icon="Hide" @click.stop="setNodeVisible(true)" title="点击显示"></MIcon>
    <MIcon v-else :icon="View" @click.stop="setNodeVisible(false)" class="node-lock" title="点击隐藏"></MIcon>
  </template>
</template>

<script setup lang="ts">
import { Hide, View } from '@element-plus/icons-vue';

import type { MNode } from '@tmagic/core';

import MIcon from '@editor/components/Icon.vue';
import { useServices } from '@editor/hooks/use-services';

const props = defineProps<{
  data: MNode;
}>();

const { editorService } = useServices();

const setNodeVisible = (visible: boolean) => {
  editorService.update({
    id: props.data.id,
    visible,
  });
};
</script>
