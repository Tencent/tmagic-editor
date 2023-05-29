<template>
  <TMagicOption
    v-for="option in options"
    :label="option.text"
    :value="option.value"
    :key="valueKey ? option.value[valueKey] : option.value"
    :disabled="option.disabled"
  ></TMagicOption>
</template>

<script lang="ts" setup>
import { TMagicOption } from '@tmagic/design';

import { SelectOption } from '../schema';

defineOptions({
  name: 'MFormSelectOptions',
});

defineProps<{
  options: SelectOption[];
  valueKey?: string;
}>();
</script>
