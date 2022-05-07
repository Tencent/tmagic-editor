<template>
  <el-checkbox
    v-model="model[name]"
    :size="size"
    :trueLabel="activeValue"
    :falseLabel="inactiveValue"
    :disabled="disabled"
    :label="config.text"
    @change="changeHandler"
  ></el-checkbox>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';

import { CheckboxConfig } from '../schema';
import fieldProps from '../utils/fieldProps';
import { useAddField } from '../utils/useAddField';

export default defineComponent({
  name: 'm-fields-checkbox',

  props: {
    ...fieldProps,
    config: {
      type: Object as PropType<CheckboxConfig>,
      required: true,
    },
  },

  emits: ['change', 'input'],

  setup(props, { emit }) {
    useAddField(props.prop);

    return {
      activeValue: computed(() => {
        if (typeof props.config.activeValue === 'undefined') {
          if (props.config.filter === 'number') {
            return 1;
          }
        } else {
          return props.config.activeValue;
        }

        return undefined;
      }),

      inactiveValue: computed(() => {
        if (typeof props.config.inactiveValue === 'undefined') {
          if (props.config.filter === 'number') {
            return 0;
          }
        } else {
          return props.config.inactiveValue;
        }

        return undefined;
      }),

      changeHandler(value: number | boolean) {
        emit('change', value);
      },
    };
  },
});
</script>
