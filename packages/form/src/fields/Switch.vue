<template>
  <TMagicSwitch
    v-model="model[name]"
    :size="size"
    :activeValue="activeValue"
    :inactiveValue="inactiveValue"
    :disabled="disabled"
    @change="changeHandler"
  ></TMagicSwitch>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { TMagicSwitch } from '@tmagic/design';

import type { FieldProps, SwitchConfig } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormSwitch',
});

const props = defineProps<FieldProps<SwitchConfig>>();

const emit = defineEmits<{
  change: [value: any];
}>();

useAddField(props.prop);

const changeHandler = (value: any) => {
  emit('change', value);
};

const activeValue = computed(() => {
  if (typeof props.config.activeValue === 'undefined') {
    if (props.config.filter === 'number') {
      return 1;
    }
  } else {
    return props.config.activeValue;
  }

  return true;
});

const inactiveValue = computed(() => {
  if (typeof props.config.inactiveValue === 'undefined') {
    if (props.config.filter === 'number') {
      return 0;
    }
  } else {
    return props.config.inactiveValue;
  }

  return false;
});
</script>
