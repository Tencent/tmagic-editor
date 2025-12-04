<template>
  <template v-if="data.type !== 'page'">
    <TMagicButton
      link
      :type="data.visible === false ? 'primary' : 'default'"
      :icon="data.visible === false ? Hide : View"
      :title="data.visible === false ? '点击显示' : '点击隐藏'"
      @click.stop="setNodeVisible(data.visible === false)"
    ></TMagicButton>
  </template>
</template>

<script setup lang="ts">
import { Hide, View } from '@element-plus/icons-vue';

import type { MNode } from '@tmagic/core';
import { TMagicButton } from '@tmagic/design';

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
