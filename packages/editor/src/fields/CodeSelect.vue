<template>
  <div class="m-fields-code-select" :key="fieldKey">
    <TMagicCard shadow="never">
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
        <TMagicTooltip class="tool-item" effect="dark" content="查看代码块" placement="top">
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
        </TMagicTooltip>
      </div>
    </TMagicCard>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineEmits, defineProps, inject, ref, watchEffect } from 'vue';
import { cloneDeep, map, xor } from 'lodash-es';

import { TMagicCard, tMagicMessage, TMagicTooltip } from '@tmagic/design';
import { SelectConfig } from '@tmagic/form';

import type { Services } from '../type';
import { CodeEditorMode, CodeSelectOp } from '../type';
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
const multiple = ref(true);
const combineIds = ref<string[]>([]);
let lastTagSnapshot = cloneDeep(props.model[props.name]) || [];

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
  let codeIds = value;
  if (typeof value === 'string') {
    multiple.value = false;
    lastTagSnapshot = [lastTagSnapshot];
    codeIds = value ? [value] : [];
  }
  await setCombineRelation(codeIds);
  emit('change', value);
};

// 同步绑定关系
const setCombineRelation = async (codeIds: string[]) => {
  // 组件id
  const { id = '' } = services?.editorService.get('node') || {};

  // 兼容单选
  let opFlag = CodeSelectOp.CHANGE;
  let diffValues = codeIds;
  if (multiple.value) {
    opFlag = codeIds.length < lastTagSnapshot.length ? CodeSelectOp.DELETE : CodeSelectOp.ADD;
    diffValues = xor(codeIds, lastTagSnapshot) as string[];
  }

  // 记录绑定关系
  await services?.codeBlockService.setCombineRelation(id, diffValues, opFlag, props.prop);
  lastTagSnapshot = codeIds;
  await setCombineIds(codeIds);
};

// 记录当前已被绑定的代码块，为查看弹窗的展示内容
const setCombineIds = async (codeIds: string[]) => {
  combineIds.value = codeIds;
  await services?.codeBlockService.setCombineIds(codeIds);
};

const viewHandler = async () => {
  if (props.model[props.name].length === 0) {
    tMagicMessage.error('请先绑定代码块');
    return;
  }
  // 记录当前已被绑定的代码块，为查看弹窗的展示内容
  await setCombineIds(props.model[props.name]);
  await services?.codeBlockService.setMode(CodeEditorMode.LIST);
  services?.codeBlockService.setCodeEditorContent(true, combineIds.value[0]);
};
</script>
