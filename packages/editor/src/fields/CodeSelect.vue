<template>
  <div class="m-fields-code-select" :key="fieldKey">
    <el-card>
      <template #header>
        <m-fields-select
          :config="selectConfig"
          :model="model"
          :prop="prop"
          :name="name"
          :size="size"
          @change="changeHandler"
        ></m-fields-select>
      </template>
      <div class="tool-bar">
        <el-tooltip class="tool-item" effect="dark" content="查看源代码" placement="top">
          <svg
            @click="viewHandler"
            preserveAspectRatio="xMidYMid meet"
            viewBox="0 0 24 24"
            width="15px"
            height="15px"
            data-v-65a7fb6c=""
          >
            <path
              fill="currentColor"
              d="m23 12l-7.071 7.071l-1.414-1.414L20.172 12l-5.657-5.657l1.414-1.414L23 12zM3.828 12l5.657 5.657l-1.414 1.414L1 12l7.071-7.071l1.414 1.414L3.828 12z"
            ></path>
          </svg>
        </el-tooltip>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineEmits, defineProps, inject, ref, watchEffect } from 'vue';
import { ElMessage } from 'element-plus';
import { map } from 'lodash-es';

import { SelectConfig } from '@tmagic/form';

import type { Services } from '../type';
import { EditorMode } from '../type';
const services = inject<Services>('services');

const emit = defineEmits(['change']);

const props = defineProps<{
  config: {
    selectConfig?: SelectConfig;
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
  if (props.model[props.name].length === 0) {
    ElMessage.error('请先绑定代码块');
    return;
  }
  await setCombineRelation(props.model[props.name]);
  await services?.codeBlockService.setMode(EditorMode.LIST);
  services?.codeBlockService.setCodeEditorContent(true, combineIds.value[0]);
};
</script>
