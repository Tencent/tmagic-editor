<template>
  <input v-if="model" v-model="model[name]" type="hidden" />
</template>

<script setup lang="ts">
import { HiddenConfig } from '../schema';
import { useAddField } from '../utils/useAddField';

const props = defineProps<{
  config: HiddenConfig;
  model: any;
  initValues?: any;
  values?: any;
  name: string;
  prop: string;
}>();

useAddField(props.prop);
</script>
