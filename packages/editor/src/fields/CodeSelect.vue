<template>
  <div class="m-fields-code-select" :key="fieldKey">
    <el-card shadow="never">
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
        <el-tooltip class="tool-item" effect="dark" content="查看代码块" placement="top">
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
import { map, union } from 'lodash-es';

import { SelectConfig } from '@tmagic/form';

import type { Services } from '../type';
import { CodeEditorMode } from '../type';
const services = inject<Services>('services');
const codeHooks = inject<string[]>('codeHooks');

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
  const combineNames = await Promise.all(
    combineIds.value.map(async (id) => {
      const { name = '' } = (await services?.codeBlockService.getCodeContentById(id)) || {};
      return name;
    }),
  );
  fieldKey.value = combineNames.join('-');
});

const changeHandler = async (value: any) => {
  await setCombineRelation();
  emit('change', value);
};

// 同步绑定关系
const setCombineRelation = async () => {
  //  绑定数组先置空
  combineIds.value = [];
  // 组件id
  const { id = '' } = services?.editorService.get('node') || {};
  codeHooks?.forEach((hook) => {
    // continue
    if (!props.model[hook]) return true;
    if (typeof props.model[hook] === 'string' && props.model[hook]) {
      combineIds.value = union(combineIds.value, [props.model[hook]]);
    } else if (Array.isArray(props.model[hook])) {
      combineIds.value = union(combineIds.value, props.model[hook]);
    }
  });
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
  await setCombineRelation();
  await services?.codeBlockService.setMode(CodeEditorMode.LIST);
  services?.codeBlockService.setCodeEditorContent(true, combineIds.value[0]);
};
</script>
