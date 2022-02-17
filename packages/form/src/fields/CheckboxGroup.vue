<template>
  <el-checkbox-group v-model="model[name]" :size="size" :disabled="disabled" @change="changeHandler">
    <el-checkbox v-for="option in config.options" :label="option.value" :key="option.value"
      >{{ option.text }}
    </el-checkbox>
  </el-checkbox-group>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { CheckboxGroupConfig } from '../schema';
import fieldProps from '../utils/fieldProps';
import { useAddField } from '../utils/useAddField';

export default defineComponent({
  name: 'm-fields-checkbox-group',

  props: {
    ...fieldProps,
    config: {
      type: Object as PropType<CheckboxGroupConfig>,
      required: true,
    },
  },

  emits: ['change'],

  setup(props, { emit }) {
    useAddField(props.prop);

    // 初始化选项
    if (props.model && !props.model[props.name]) {
      // eslint-disable-next-line no-param-reassign
      props.model[props.name] = [];
    }
    return {
      changeHandler: (v: Array<string | number | boolean>) => {
        emit('change', v);
      },
    };
  },
});
</script>
