<template>
  <div v-if="model">
    <el-date-picker
      v-model="model[modelName]"
      type="date"
      :size="size"
      :placeholder="config.placeholder"
      :disabled="disabled"
      :format="config.format"
      :value-format="config.format || 'YYYY-MM-DD HH:mm:ss'"
      @change="changeHandler"
    ></el-date-picker>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';

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

    const modelName = computed(() => props.prop || props.config.name || '');
    props.model[modelName.value] = datetimeFormatter(props.model[modelName.value], '');
    return {
      modelName,
      changeHandler(v: string) {
        emit('change', v);
      },
    };
  },
});
</script>
