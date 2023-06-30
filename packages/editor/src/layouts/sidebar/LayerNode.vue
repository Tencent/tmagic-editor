<template>
  <div>
    {{ `${data.name} (${data.id})` }}
  </div>
  <div class="layer-node-tool">
    <template v-if="data.type !== 'page'">
      <el-icon v-if="data.visible === false" @click.stop="setNodeVisible(true)" title="点击显示">
        <Hide />
      </el-icon>
      <el-icon v-else @click.stop="setNodeVisible(false)" class="node-lock" title="点击隐藏">
        <View />
      </el-icon>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { inject } from 'vue';
import { Hide, View } from '@element-plus/icons-vue';

import { MNode } from '@tmagic/schema';

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
