<template>
  <span v-if="model">{{ model[name] }}</span>
</template>

<script setup lang="ts">
import { DisplayConfig } from '../schema';
import { useAddField } from '../utils/useAddField';

const props = defineProps<{
  config: DisplayConfig;
  model: any;
  initValues?: any;
  values?: any;
  name: string;
  prop: string;
}>();

if (props.config.initValue && props.model) {
  // eslint-disable-next-line vue/no-setup-props-destructure
  props.model[props.name] = props.config.initValue;
}

useAddField(props.prop);
</script>
