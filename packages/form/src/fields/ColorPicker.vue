<template>
  <div v-if="model">
    <el-color-picker
      v-model="model[name]"
      :size="size"
      :disabled="disabled"
      :showAlpha="true"
      @change="changeHandler"
    ></el-color-picker>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { ColorPickConfig } from '../schema';
import fieldProps from '../utils/fieldProps';
import { useAddField } from '../utils/useAddField';
export default defineComponent({
  name: 'm-fields-color-picker',
});
</script>

<script lang="ts" setup>
const emit = defineEmits(['change']);

const props = defineProps({
  ...fieldProps,
  config: {
    type: Object as PropType<ColorPickConfig>,
    required: true,
  },
});

useAddField(props.prop);

const changeHandler = (value: string) => emit('change', value);
</script>
