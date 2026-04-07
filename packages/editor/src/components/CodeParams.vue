<template>
  <MForm
    ref="form"
    :config="codeParamsConfig"
    :init-values="model"
    :disabled="disabled"
    :size="size"
    :watch-props="false"
    @change="onParamsChangeHandler"
  ></MForm>
</template>

<script lang="ts" setup>
import { computed, useTemplateRef } from 'vue';

import { type ContainerChangeEventData, type FormItemConfig, type FormValue, MForm } from '@tmagic/form';

import type { CodeParamStatement } from '@editor/type';
import { error } from '@editor/utils';

defineOptions({
  name: 'MEditorCodeParams',
});

const props = defineProps<{
  model: any;
  size?: 'small' | 'default' | 'large';
  disabled?: boolean;
  name: string;
  paramsConfig: CodeParamStatement[];
}>();

const emit = defineEmits(['change']);

const formRef = useTemplateRef<InstanceType<typeof MForm>>('form');

const getFormConfig = (items: FormItemConfig[] = []) => [
  {
    type: 'fieldset',
    items,
    legend: '参数',
    labelWidth: '120px',
    name: props.name,
  },
];

const codeParamsConfig = computed(() =>
  getFormConfig(
    props.paramsConfig.map(({ name, text, extra, ...config }) => {
      let { type } = config;
      if (typeof type === 'function') {
        type = type(undefined, {
          model: props.model[props.name],
        });
      }
      if (type && ['data-source-field-select', 'vs-code'].includes(type)) {
        return {
          ...config,
          name,
          text,
          extra,
        };
      }
      return {
        type: 'data-source-field-select' as const,
        name,
        text,
        extra,
        fieldConfig: config,
      };
    }) as FormItemConfig[],
  ),
);

/**
 * 参数值修改更新
 */
const onParamsChangeHandler = async (v: FormValue, eventData: ContainerChangeEventData) => {
  try {
    const value = await formRef.value?.submitForm(true);
    emit('change', value, eventData);
  } catch (e) {
    error(e);
  }
};
</script>
