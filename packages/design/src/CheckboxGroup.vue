<template>
  <component
    class="tmagic-design-checkbox-group"
    :is="uiComponent.component"
    v-bind="uiProps"
    @change="changeHandler"
    @update:modelValue="updateModelValue"
  >
    <slot></slot>
  </component>
</template>

<script setup lang="ts" name="TMCheckboxGroup">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  modelValue?: any[];
  label?: string;
  disabled?: boolean;
  size?: 'large' | 'default' | 'small';
}>();

const uiComponent = getConfig('components').checkboxGroup;

const uiProps = computed(() => uiComponent.props(props));

const emit = defineEmits(['change', 'update:modelValue']);

const changeHandler = (v: any) => {
  emit('change', v);
};

const updateModelValue = (v: any) => {
  emit('update:modelValue', v);
};
</script>
