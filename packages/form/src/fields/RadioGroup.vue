<template>
  <el-radio-group v-if="model" v-model="model[name]" :size="size" :disabled="disabled" @change="changeHandler">
    <el-radio v-for="option in config.options" :label="option.value" :key="option.value">{{ option.text }}</el-radio>
  </el-radio-group>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import fieldProps from '../utils/fieldProps';
import { useAddField } from '../utils/useAddField';

export default defineComponent({
  name: 'm-fields-radio-group',

  props: {
    ...fieldProps,
    config: {
      type: Object,
      required: true,
    },
  },

  emits: ['change'],

  setup(props, { emit }) {
    useAddField(props.prop);
    return {
      changeHandler: (v: string | number | boolean) => emit('change', v),
    };
  },
});
</script>
