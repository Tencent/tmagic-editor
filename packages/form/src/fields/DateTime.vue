<template>
  <el-date-picker
    v-model="model[name]"
    popper-class="magic-datetime-picker-popper"
    type="datetime"
    :size="size"
    :placeholder="config.placeholder"
    :disabled="disabled"
    :format="config.format || 'YYYY-MM-DD HH:mm:ss'"
    :value-format="config.valueFormat || 'YYYY-MM-DD HH:mm:ss'"
    :default-time="config.defaultTime"
    @change="changeHandler"
  ></el-date-picker>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { datetimeFormatter } from '@tmagic/utils';

import { DateTimeConfig } from '../schema';
import fieldProps from '../utils/fieldProps';
import { useAddField } from '../utils/useAddField';

export default defineComponent({
  name: 'm-fields-datetime',

  props: {
    ...fieldProps,
    config: {
      type: Object as PropType<DateTimeConfig>,
      required: true,
    },
  },

  emits: ['change'],

  setup(props, { emit }) {
    useAddField(props.prop);

    const value = props.model?.[props.name].toString();
    if (props.model) {
      if (value === 'Invalid Date') {
        props.model[props.name] = '';
      } else {
        props.model[props.name] = datetimeFormatter(props.model[props.name], '', props.config.valueFormat);
      }
    }

    return {
      value,
      changeHandler: (v: Date) => {
        emit('change', v);
      },
    };
  },
});
</script>
