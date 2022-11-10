<template>
  <div class="m-fields-code-select">
    <m-form-table
      :config="tableConfig"
      :model="model[name]"
      name="hookData"
      :prop="prop"
      :size="size"
      @change="changeHandler"
    >
    </m-form-table>
  </div>
</template>

<script lang="ts" setup name="MEditorCodeSelect">
import { computed, defineEmits, defineProps, inject, watch } from 'vue';
import { isEmpty, map } from 'lodash-es';

import { FormItem, TableConfig } from '@tmagic/form';
import { HookType } from '@tmagic/schema';

import { Services } from '../type';
const services = inject<Services>('services');
const emit = defineEmits(['change']);

const props = defineProps<{
  config: {
    tableConfig?: TableConfig;
  };
  model: any;
  prop: string;
  name: string;
  size: 'mini' | 'small' | 'medium';
}>();

const tableConfig = computed<FormItem>(() => {
  const defaultConfig = {
    dropSort: true,
    items: [
      {
        type: 'select',
        label: '代码块',
        name: 'codeId',
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
      },
    ],
  };
  return {
    ...defaultConfig,
    ...props.config.tableConfig,
  };
});

watch(
  () => props.model[props.name],
  (value) => {
    // 兼容旧的数据结构
    if (isEmpty(value)) {
      // 空值或者空数组
      props.model[props.name] = {
        hookType: HookType.CODE,
        hookData: [],
      };
    } else if (Array.isArray(value) && value.length > 0) {
      // 兼容旧的数据结构 ['code1','code2']
      const hookData = value.map((codeId) => ({
        codeId,
      }));
      props.model[props.name] = {
        hookType: HookType.CODE,
        hookData,
      };
    }
  },
  {
    immediate: true,
  },
);

const changeHandler = async () => {
  emit('change', props.model[props.name]);
};
</script>
