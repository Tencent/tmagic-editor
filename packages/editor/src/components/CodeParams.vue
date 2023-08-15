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
import { computed, ref } from 'vue';

import { FormConfig, MForm } from '@tmagic/form';

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

const form = ref<InstanceType<typeof MForm>>();

const getFormConfig = (items: FormConfig = []) => [
  {
    type: 'fieldset',
    items,
    legend: '参数',
    labelWidth: '70px',
    name: props.name,
  },
];

const codeParamsConfig = computed(() => getFormConfig(props.paramsConfig));

/**
 * 参数值修改更新
 */
const onParamsChangeHandler = async () => {
  try {
    const value = await form.value?.submitForm(true);
    emit('change', value);
  } catch (e) {
    error(e);
  }
};
</script>
