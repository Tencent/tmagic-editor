<template>
  <div class="m-fields-code-select" :key="fieldKey">
    <m-fields-select
      :config="selectConfig"
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
import { computed, defineEmits, defineProps, inject, ref, watch, watchEffect } from 'vue';
import { View } from '@element-plus/icons-vue';
import { isEmpty, map } from 'lodash-es';

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

const selectConfig = computed(() => {
  const defaultConfig = {
    multiple: true,
    options: async () => {
      const codeDsl = await services?.codeBlockService.getCodeDsl();
      if (codeDsl) {
        return map(codeDsl, (value, key) => ({
          text: `${value.name}（${key}）`,
          label: `${value.name}（${key}）`,
          value: key,
        }));
      }
      return [];
    },
  };
  return {
    ...defaultConfig,
    ...props.config.selectConfig,
  };
});
const fieldKey = ref('');
const combineIds = ref<string[]>([]);

watchEffect(async () => {
  if (!combineIds.value) return;
  const combineNames = await Promise.all(
    combineIds.value.map(async (id) => {
      const { name = '' } = (await services?.codeBlockService.getCodeContentById(id)) || {};
      return name;
    }),
  );
  fieldKey.value = combineNames.join('-');
});

const changeHandler = async (value: any) => {
  await setCombineRelation(value);
  emit('change', value);
};

// 同步绑定关系
const setCombineRelation = async (selectedIds: string[] | string) => {
  if (typeof selectedIds === 'string') {
    // 兼容select单选
    combineIds.value = [selectedIds];
  } else {
    combineIds.value = selectedIds;
  }
  // 组件id
  const { id = '' } = services?.editorService.get('node') || {};
  // 记录组件与代码块的绑定关系
  await services?.codeBlockService.setCompRelation(id, combineIds.value);
  // 记录当前已被绑定的代码块，为查看弹窗的展示内容
  await services?.codeBlockService.setCombineIds(combineIds.value);
};

const viewHandler = async () => {
  await services?.codeBlockService.setMode(EditorMode.LIST);
  services?.codeBlockService.setCodeEditorContent(true, combineIds.value[0]);
};

watch(
  () => props.model[props.name],
  async (value) => {
    if (isEmpty(value)) return;
    await setCombineRelation(value);
  },
  {
    immediate: true,
  },
);
</script>
