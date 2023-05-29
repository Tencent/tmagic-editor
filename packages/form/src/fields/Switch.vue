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

import { SwitchConfig } from '../schema';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormSwitch',
});

const props = defineProps<{
  config: SwitchConfig;
  model: any;
  initValues?: any;
  values?: any;
  name: string;
  prop: string;
  disabled?: boolean;
  size?: 'large' | 'default' | 'small';
  lastValues?: Record<string, any>;
}>();

const emit = defineEmits(['change']);

useAddField(props.prop);

const changeHandler = (value: number) => {
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
