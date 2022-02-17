<template>
  <el-input-number
    v-if="model"
    v-model="model[name]"
    clearable
    controls-position="right"
    :size="size"
    :max="config.max"
    :min="config.min"
    :step="config.step"
    :placeholder="config.placeholder"
    :disabled="disabled"
    @change="changeHandler"
    @input="inputHandler"
  ></el-input-number>
</template>

<script lang="ts">
import { defineComponent, inject, PropType } from 'vue';

import { FormState, NumberConfig } from '../schema';
import fieldProps from '../utils/fieldProps';
import { useAddField } from '../utils/useAddField';
export default defineComponent({
  name: 'm-fields-number',

  props: {
    ...fieldProps,
    config: {
      type: Object as PropType<NumberConfig>,
      required: true,
    },
  },

  emits: ['change', 'input'],

  setup(props, { emit }) {
    useAddField(props.prop);

    const mForm = inject<FormState | null>('mForm');
    return {
      mForm,
      changeHandler: (value: number) => {
        emit('change', value);
      },
      inputHandler: (v: string) => {
        emit('input', v);
        mForm?.$emit('field-input', props.prop, v);
      },
    };
  },
});
</script>
