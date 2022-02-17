<template>
  <el-switch
    v-if="model"
    v-model="model[n]"
    :size="size"
    :activeValue="activeValue"
    :inactiveValue="inactiveValue"
    :disabled="disabled"
    @change="changeHandler"
  ></el-switch>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';

import { SwitchConfig } from '../schema';
import fieldProps from '../utils/fieldProps';
import { useAddField } from '../utils/useAddField';
export default defineComponent({
  name: 'm-fields-switch',

  props: {
    ...fieldProps,
    config: {
      type: Object as PropType<SwitchConfig>,
      required: true,
    },
  },

  emits: ['change'],

  setup(props, { emit }) {
    useAddField(props.prop);

    return {
      n: computed(() => props.name || props.config.name || ''),
      activeValue: computed(() => {
        if (typeof props.config.activeValue === 'undefined') {
          if (props.config.filter === 'number') {
            return 1;
          }
        } else {
          return props.config.activeValue;
        }

        return true;
      }),
      inactiveValue: computed(() => {
        if (typeof props.config.inactiveValue === 'undefined') {
          if (props.config.filter === 'number') {
            return 0;
          }
        } else {
          return props.config.inactiveValue;
        }

        return false;
      }),
      changeHandler: (v: boolean | number | string) => {
        emit('change', v);
      },
    };
  },
});
</script>
