<template>
  <el-date-picker
    v-model="value"
    type="datetimerange"
    range-separator="-"
    start-placeholder="开始日期"
    end-placeholder="结束日期"
    :size="size"
    :unlink-panels="true"
    :disabled="disabled"
    :default-time="config.defaultTime"
    @change="changeHandler"
  ></el-date-picker>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';

import { datetimeFormatter } from '@tmagic/utils';

import { DaterangeConfig } from '../schema';
import fieldProps from '../utils/fieldProps';
import { useAddField } from '../utils/useAddField';

export default defineComponent({
  name: 'm-fields-daterange',

  props: {
    ...fieldProps,
    config: {
      type: Object as PropType<DaterangeConfig>,
      required: true,
    },
  },

  emits: ['change'],

  setup(props, { emit }) {
    useAddField(props.prop);

    // eslint-disable-next-line vue/no-setup-props-destructure
    const { names } = props.config;
    const value = ref<(string | number)[]>([]);

    if (props.model !== undefined) {
      if (names?.length) {
        value.value = names.map((item) => datetimeFormatter(props.model?.[item], ''));
      } else if (props.name && props.model[props.name]) {
        value.value = props.model[props.name].map((item: string) => datetimeFormatter(item, ''));
      }
    }

    const setValue = (v: Date[] | Date) => {
      if (names?.length && v instanceof Array) {
        names.forEach((item, index) => {
          if (props.model) {
            props.model[item] = datetimeFormatter(v[index].toString(), '');
          }
        });
      } else if (props.model && props.name && v instanceof Date) {
        props.model[props.name] = datetimeFormatter(v.toString(), '');
      } else if (names?.length) {
        names.forEach((item) => {
          if (props.model) {
            props.model[item] = undefined;
          }
        });
      } else if (props.name) {
        props.model[props.name] = undefined;
      }
    };

    return {
      value,
      changeHandler(v: Date[]) {
        setValue(v);
        emit('change', v);
      },
    };
  },
});
</script>
