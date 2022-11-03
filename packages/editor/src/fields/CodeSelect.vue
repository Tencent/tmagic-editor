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

<script lang="ts" setup name="MEditorCodeSelect">
import { computed, defineEmits, defineProps, inject, ref, watchEffect } from 'vue';
import { map, xor } from 'lodash-es';

import { TMagicCard, tMagicMessage, TMagicTooltip } from '@tmagic/design';
import { FormState, SelectConfig } from '@tmagic/form';

import type { Services } from '../type';
import { CodeEditorMode, CodeSelectOp } from '../type';
const services = inject<Services>('services');
const form = inject<FormState>('mForm');
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
const lastTagSnapshot = ref<string[]>([]);

watchEffect(async () => {
  if (!props.model[props.name]) return;
  const combineNames = await Promise.all(
    props.model[props.name].map(async (id: string) => {
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
    // initValues为表单初始值，当表单内容发生变化时，initValues也会更新，可以理解为上一次表单内容的快照
    lastTagSnapshot.value = form?.initValues[props.name] || [];
    opFlag = codeIds.length < lastTagSnapshot.value.length ? CodeSelectOp.DELETE : CodeSelectOp.ADD;
    diffValues = xor(codeIds, lastTagSnapshot.value) as string[];
  }
  // 记录绑定关系
  await services?.codeBlockService.setCombineRelation(id, diffValues, opFlag, props.prop);
};

const viewHandler = async () => {
  if (props.model[props.name].length === 0) {
    tMagicMessage.error('请先绑定代码块');
    return;
  }
  // 记录当前已被绑定的代码块，为查看弹窗的展示内容
  await services?.codeBlockService.setCombineIds(props.model[props.name]);
  await services?.codeBlockService.setMode(CodeEditorMode.LIST);
  services?.codeBlockService.setCodeEditorContent(true, props.model[props.name][0]);
};
</script>
