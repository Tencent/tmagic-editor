<template>
  <el-date-picker
    v-model="model[name]"
    type="date"
    :size="size"
    :placeholder="config.placeholder"
    :disabled="disabled"
    :format="config.format"
    :value-format="config.format || 'YYYY-MM-DD HH:mm:ss'"
    @change="changeHandler"
  ></el-date-picker>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { datetimeFormatter } from '@tmagic/utils';

import { DateConfig } from '../schema';
import fieldProps from '../utils/fieldProps';
import { useAddField } from '../utils/useAddField';

export default defineComponent({
  name: 'm-fields-date',

  props: {
    ...fieldProps,
    config: {
      type: Object as PropType<DateConfig>,
      required: true,
    },
  },

  emits: ['change', 'input'],

  setup(props, { emit }) {
    useAddField(props.prop);

    props.model[props.name] = datetimeFormatter(props.model[props.name], '');
    return {
      changeHandler(v: string) {
        emit('change', v);
      },
    };
  },
});
</script>
