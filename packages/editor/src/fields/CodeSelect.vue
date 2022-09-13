<template>
  <div class="m-fields-code-select">
    <m-fields-select
      :config="config.selectConfig"
      :model="model"
      :prop="prop"
      :name="name"
      :size="size"
      @change="changeHandler"
    ></m-fields-select>
    <el-button
      type="primary"
      :icon="View"
      :size="size"
      @click="viewHandler"
      :disabled="props.model[props.name].length === 0"
      >查看</el-button
    >
  </div>
</template>

<script lang="ts" setup>
import { defineEmits, defineProps, inject } from 'vue';
import { View } from '@element-plus/icons-vue';

import { SelectConfig } from '@tmagic/form';

import type { Services } from '../type';
import { EditorMode } from '../type';
const services = inject<Services>('services');

const emit = defineEmits(['change']);

const props = defineProps<{
  config: {
    selectConfig: SelectConfig;
  };
  model: any;
  prop: string;
  name: string;
  size: string;
}>();

const changeHandler = async (value: any) => {
  // 记录组件与代码块的绑定关系
  const { id = '' } = services?.editorService.get('node') || {};
  await services?.codeBlockService.setCompRelation(id, value);
  emit('change', value);
};

const viewHandler = async () => {
  await services?.codeBlockService.setMode(EditorMode.LIST);
  await services?.codeBlockService.setCombineIds(props.model[props.name]);
  services?.codeBlockService.setCodeEditorContent(true, props.model[props.name][0]);
};
</script>
