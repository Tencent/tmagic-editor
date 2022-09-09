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
    <el-button type="primary" :icon="View" :size="size" @click="viewHandler">查看</el-button>
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

const changeHandler = (value: any) => {
  emit('change', value);
};

const viewHandler = () => {
  services?.codeBlockService.setMode(EditorMode.LIST);
  services?.codeBlockService.setCombineIds(props.model[props.name]);
  services?.codeBlockService.setCodeEditorContent(true, props.model[props.name][0]);
};
</script>
