<template>
  <el-input
    v-model="model[name]"
    type="textarea"
    :size="size"
    clearable
    :placeholder="config.placeholder"
    :disabled="disabled"
    @change="changeHandler"
    @input="inputHandler"
  >
  </el-input>
</template>

<script lang="ts">
import { defineComponent, inject, PropType } from 'vue';

import { FormState, TextareaConfig } from '../schema';
import fieldProps from '../utils/fieldProps';
import { useAddField } from '../utils/useAddField';
export default defineComponent({
  name: 'm-fields-textarea',

  props: {
    ...fieldProps,
    config: {
      type: Object as PropType<TextareaConfig>,
      required: true,
    },
  },

  emits: {
    change(values: string | number) {
      return values;
    },

    input(values: string | number) {
      return values;
    },
  },

  setup(props, { emit }) {
    useAddField(props.prop);

    const mForm = inject<FormState | null>('mForm');

    return {
      mForm,
      changeHandler: (v: string) => {
        emit('change', v);
      },

      inputHandler: (v: string) => {
        emit('input', v);
        mForm?.$emit('field-input', props.prop, v);
      },
    };
  },
});
</script>
