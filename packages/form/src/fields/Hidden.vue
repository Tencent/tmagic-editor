<template>
  <input v-if="model" v-model="model[name]" type="hidden" />
</template>

<script setup lang="ts">
import type { FormValue } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormHidden',
});

const props = defineProps<{
  model: FormValue;
  name: string;
  prop: string;
}>();

useAddField(props.prop);
</script>
