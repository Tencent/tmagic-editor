<template>
  <el-form
    class="m-form"
    ref="elForm"
    :model="values"
    :label-width="labelWidth"
    :disabled="disabled"
    :style="`height: ${height}`"
    :inline="inline"
    :label-position="labelPosition"
  >
    <template v-if="initialized && Array.isArray(config)">
      <m-form-container
        v-for="(item, index) in config"
        :key="item[keyProp] ?? index"
        :config="item"
        :model="values"
        :label-width="item.labelWidth || labelWidth"
        :step-active="stepActive"
        :size="size"
        @change="changeHandler"
      ></m-form-container>
    </template>
  </el-form>
</template>

<script lang="ts">
import { defineComponent, PropType, provide, reactive, ref, toRaw, watch } from 'vue';
import { cloneDeep, isEqual } from 'lodash-es';

import { getConfig } from './utils/config';
import { initValue } from './utils/form';
import { FormConfig, FormState, FormValue } from './schema';

interface ValidateError {
  message: string;
  field: string;
}

export default defineComponent({
  name: 'm-form',

  props: {
    // 表单初始化值
    initValues: {
      type: Object,
      required: true,
      default: () => ({}),
    },

    parentValues: {
      type: Object,
      default: () => ({}),
    },

    // 表单配置
    config: {
      type: Array as PropType<FormConfig>,
      required: true,
      default: () => [],
    },

    labelWidth: {
      type: String,
      default: () => '200px',
    },

    disabled: {
      type: Boolean,
      default: () => false,
    },

    height: {
      type: String,
      default: () => 'auto',
    },

    stepActive: {
      type: [String, Number],
      default: () => 1,
    },

    size: {
      type: String as PropType<'small' | 'default' | 'large'>,
    },

    inline: {
      type: Boolean,
      default: false,
    },

    labelPosition: {
      type: String,
      default: 'right',
    },

    keyProp: {
      type: String,
      default: '__key',
    },

    popperClass: {
      type: String,
    },
  },

  emits: ['change', 'field-input', 'field-change'],

  setup(props, { emit }) {
    // InstanceType<typeof ElForm>，构建types的时候会出错
    const elForm = ref<any>();
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

    return {
      initialized,
      values,
      elForm,

      formState,

      changeHandler: () => {
        emit('change', values.value);
      },

      resetForm: () => elForm.value?.resetFields(),

      submitForm: async (native?: boolean): Promise<any> => {
        try {
          await elForm.value?.validate();
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
    };
  },
});
</script>
