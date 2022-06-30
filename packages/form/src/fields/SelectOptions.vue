<template>
  <el-option
    v-for="option in options"
    :label="option.text"
    :value="option.value"
    :key="valueKey ? option.value[valueKey] : option.value"
    :disabled="option.disabled"
  ></el-option>
</template>

<script lang="ts" setup>
import { SelectOption } from '../schema';

defineProps<{
  options: SelectOption[];
  valueKey?: string;
}>();
</script>
