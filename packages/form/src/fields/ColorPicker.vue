<template>
  <el-color-picker
    v-model="model[name]"
    :size="size"
    :disabled="disabled"
    :showAlpha="true"
    @change="changeHandler"
  ></el-color-picker>
</template>

<script lang="ts" setup>
import { ColorPickConfig } from '../schema';
import { useAddField } from '../utils/useAddField';

const props = defineProps<{
  config: ColorPickConfig;
  model: any;
  initValues?: any;
  values?: any;
  name: string;
  prop: string;
  disabled?: boolean;
  size: 'mini' | 'small' | 'medium';
}>();

const emit = defineEmits(['change']);

useAddField(props.prop);

const changeHandler = (value: string) => emit('change', value);
</script>
