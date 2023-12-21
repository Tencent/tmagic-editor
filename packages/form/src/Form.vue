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
        :last-values="lastValuesProcessed"
        :is-compare="isCompare"
        :label-width="item.labelWidth || labelWidth"
        :step-active="stepActive"
        :size="size"
        @change="changeHandler"
      ></Container>
    </template>
  </TMagicForm>
</template>

<script setup lang="ts">
import { provide, reactive, ref, toRaw, watch, watchEffect } from 'vue';
import { cloneDeep, isEqual } from 'lodash-es';

import { TMagicForm } from '@tmagic/design';

import Container from './containers/Container.vue';
import { getConfig } from './utils/config';
import { initValue } from './utils/form';
import type { FormConfig, FormState, FormValue, ValidateError } from './schema';

defineOptions({
  name: 'MForm',
});

const props = withDefaults(
  defineProps<{
    /** 表单配置 */
    config: FormConfig;
    /** 表单值 */
    initValues: Record<string, any>;
    /** 需对比的值（开启对比模式时传入） */
    lastValues?: Record<string, any>;
    /** 是否开启对比模式 */
    isCompare?: boolean;
    parentValues?: Record<string, any>;
    labelWidth?: string;
    disabled?: boolean;
    height?: string;
    stepActive?: string | number;
    size?: 'small' | 'default' | 'large';
    inline?: boolean;
    labelPosition?: string;
    keyProp?: string;
    popperClass?: string;
    extendState?: (state: FormState) => Record<string, any> | Promise<Record<string, any>>;
  }>(),
  {
    config: () => [],
    initValues: () => ({}),
    lastValues: () => ({}),
    isCompare: false,
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

const emit = defineEmits(['change', 'error', 'field-input', 'field-change']);

const tMagicForm = ref<InstanceType<typeof TMagicForm>>();
const initialized = ref(false);
const values = ref<FormValue>({});
const lastValuesProcessed = ref<FormValue>({});
const fields = new Map<string, any>();

const requestFuc = getConfig('request') as Function;

const formState: FormState = reactive<FormState>({
  keyProp: props.keyProp,
  popperClass: props.popperClass,
  config: props.config,
  initValues: props.initValues,
  isCompare: props.isCompare,
  lastValues: props.lastValues,
  parentValues: props.parentValues,
  values,
  lastValuesProcessed,
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

watchEffect(async () => {
  formState.initValues = props.initValues;
  formState.lastValues = props.lastValues;
  formState.isCompare = props.isCompare;
  formState.config = props.config;
  formState.keyProp = props.keyProp;
  formState.popperClass = props.popperClass;
  formState.parentValues = props.parentValues;

  if (typeof props.extendState === 'function') {
    const state = (await props.extendState(formState)) || {};
    Object.entries(state).forEach(([key, value]) => {
      formState[key] = value;
    });
  }
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
      // 非对比模式，初始化完成
      initialized.value = !props.isCompare;
    });

    if (props.isCompare) {
      // 对比模式下初始化待对比的表单值
      initValue(formState, {
        initValues: props.lastValues,
        config: props.config,
      }).then((value) => {
        lastValuesProcessed.value = value;
        initialized.value = true;
      });
    }
  },
  { immediate: true },
);

const changeHandler = () => {
  emit('change', values.value);
};

defineExpose({
  values,
  lastValuesProcessed,
  formState,
  initialized,

  changeHandler,

  resetForm: () => tMagicForm.value?.resetFields(),

  submitForm: async (native?: boolean): Promise<any> => {
    try {
      await tMagicForm.value?.validate();
      return native ? values.value : cloneDeep(toRaw(values.value));
    } catch (invalidFields: any) {
      emit('error', invalidFields);

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
