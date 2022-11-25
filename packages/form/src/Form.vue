<template>
  <TMagicForm
    class="m-form"
    ref="tMagicForm"
    :model="values"
    :label-width="labelWidth"
    :style="`height: ${height}`"
    :inline="inline"
    :label-position="labelPosition"
  >
    <template v-if="initialized && Array.isArray(config)">
      <Container
        v-for="(item, index) in config"
        :disabled="disabled"
        :key="item[keyProp] ?? index"
        :config="item"
        :model="values"
        :label-width="item.labelWidth || labelWidth"
        :step-active="stepActive"
        :size="size"
        @change="changeHandler"
      ></Container>
    </template>
  </TMagicForm>
</template>

<script setup lang="ts" name="MForm">
import { provide, reactive, ref, toRaw, watch, watchEffect } from 'vue';
import cloneDeep from 'lodash-es/cloneDeep';
import isEqual from 'lodash-es/isEqual';

import { TMagicForm } from '@tmagic/design';

import Container from './containers/Container.vue';
import { getConfig } from './utils/config';
import { initValue } from './utils/form';
import type { FormConfig, FormState, FormValue, ValidateError } from './schema';

const props = withDefaults(
  defineProps<{
    config: FormConfig;
    initValues: Object;
    parentValues?: Object;
    labelWidth?: string;
    disabled?: boolean;
    height?: string;
    stepActive?: string | number;
    size?: 'small' | 'default' | 'large';
    inline?: boolean;
    labelPosition?: string;
    keyProp?: string;
    popperClass?: string;
  }>(),
  {
    config: () => [],
    initValues: () => ({}),
    parentValues: () => ({}),
    labelWidth: '200px',
    disabled: false,
    height: 'auto',
    stepActive: 1,
    inline: false,
    labelPosition: 'right',
    keyProp: '__key',
  },
);

const emit = defineEmits(['change', 'field-input', 'field-change']);

const tMagicForm = ref<InstanceType<typeof TMagicForm>>();
const initialized = ref(false);
const values = ref<FormValue>({});
const fields = new Map<string, any>();

const requestFuc = getConfig('request') as Function;

const formState: FormState = reactive<FormState>({
  keyProp: props.keyProp,
  popperClass: props.popperClass,
  config: props.config,
  initValues: props.initValues,
  parentValues: props.parentValues,
  values,
  $emit: emit as (event: string, ...args: any[]) => void,
  fields,
  setField: (prop: string, field: any) => fields.set(prop, field),
  getField: (prop: string) => fields.get(prop),
  deleteField: (prop: string) => fields.delete(prop),
  post: (options: any) => {
    if (requestFuc) {
      return requestFuc({
        ...options,
        method: 'POST',
      });
    }
  },
});

watchEffect(() => {
  formState.initValues = props.initValues;
  formState.config = props.config;
  formState.keyProp = props.keyProp;
  formState.popperClass = props.popperClass;
  formState.parentValues = props.parentValues;
});

provide('mForm', formState);

watch(
  [() => props.config, () => props.initValues],
  ([config], [preConfig]) => {
    if (!isEqual(toRaw(config), toRaw(preConfig))) {
      initialized.value = false;
    }

    initValue(formState, {
      initValues: props.initValues,
      config: props.config,
    }).then((value) => {
      values.value = value;
      initialized.value = true;
    });
  },
  { immediate: true },
);

const changeHandler = () => {
  emit('change', values.value);
};

defineExpose({
  values,
  formState,
  initialized,

  changeHandler,

  resetForm: () => tMagicForm.value?.resetFields(),

  submitForm: async (native?: boolean): Promise<any> => {
    try {
      await tMagicForm.value?.validate();
      return native ? values.value : cloneDeep(toRaw(values.value));
    } catch (invalidFields: any) {
      const error: string[] = [];

      Object.entries(invalidFields).forEach(([, ValidateError]) => {
        (ValidateError as ValidateError[]).forEach(({ field, message }) => {
          if (field && message) error.push(`${field} -> ${message}`);
          if (field && !message) error.push(`${field} -> 出现错误`);
          if (!field && message) error.push(`${message}`);
        });
      });
      throw new Error(error.join('<br>'));
    }
  },
});
</script>
