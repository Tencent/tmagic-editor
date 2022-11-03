<template>
  <component :is="uiComponent.component" v-bind="uiProps" @update:modelValue="updateModelValue" @change="changeHandler">
    <template #default>
      <slot></slot>
    </template>
  </component>
</template>

<script setup lang="ts" name="TMCheckbox">
import { computed } from 'vue';

import { getConfig } from './config';

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | boolean;
    label?: any;
    trueLabel?: string | number | boolean;
    falseLabel?: string | number | boolean;
    disabled?: boolean;
    size?: 'mini' | 'small' | 'medium';
  }>(),
  {
    trueLabel: undefined,
    falseLabel: undefined,
  },
);

const uiComponent = getConfig('components').checkbox;

const uiProps = computed(() => uiComponent.props(props));

const emit = defineEmits(['change', 'update:modelValue']);

const changeHandler = (v: any) => {
  emit('change', v);
};

const updateModelValue = (v: any) => {
  emit('update:modelValue', v);
};
</script>
