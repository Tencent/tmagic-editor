<template>
  <m-fields-link :config="formConfig" :model="modelValue" name="form" @change="changeHandler"></m-fields-link>
</template>

<script lang="ts" setup name="MEditorCodeLink">
import { computed, reactive, watch } from 'vue';
import serialize from 'serialize-javascript';

const props = defineProps<{
  config: {
    type: 'code-link';
    name: string;
    text?: string;
    formTitle?: string;
    codeOptions?: Object;
  };
  model: any;
  name: string;
  prop: string;
}>();

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
    // eslint-disable-next-line no-eval
    props.model[props.name] = eval(`(${v[props.name]})`);
    emit('change', props.model[props.name]);
  } catch (e) {
    console.error(e);
  }
};
</script>
