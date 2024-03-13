<template>
  <m-fields-link :config="formConfig" :model="modelValue" name="form" @change="changeHandler"></m-fields-link>
</template>

<script lang="ts" setup>
import { computed, reactive, watch } from 'vue';
import serialize from 'serialize-javascript';

import type { FieldProps, FormItem } from '@tmagic/form';

import { getConfig } from '@editor/utils/config';

defineOptions({
  name: 'MFieldsCodeLink',
});

const props = defineProps<
  FieldProps<
    {
      type: 'code-link';
      formTitle?: string;
      codeOptions?: Object;
    } & FormItem
  >
>();

const emit = defineEmits(['change']);

const formConfig = computed(() => {
  const { codeOptions, ...config } = props.config;
  return {
    ...config,
    text: '',
    type: 'link',
    form: [
      {
        name: props.name,
        type: 'vs-code',
        options: {
          tabSize: 2,
          ...(codeOptions || {}),
        },
      },
    ],
  };
});

const modelValue = reactive<{ form: Record<string, string> }>({
  form: {
    [props.name]: '',
  },
});

watch(
  () => props.model[props.name],
  (value) => {
    modelValue.form = {
      [props.name]: serialize(value, {
        space: 2,
        unsafe: true,
      }).replace(/"(\w+)":\s/g, '$1: '),
    };
  },
  {
    immediate: true,
  },
);

const changeHandler = (v: Record<string, any>) => {
  if (!props.name || !props.model) return;

  try {
    const parseDSL = getConfig('parseDSL');
    props.model[props.name] = parseDSL(`(${v[props.name]})`);
    emit('change', props.model[props.name]);
  } catch (e) {
    console.error(e);
  }
};
</script>
