<template>
  <component
    class="tmagic-design-checkbox-group"
    :is="uiComponent"
    v-bind="uiProps"
    @change="changeHandler"
    @update:modelValue="updateModelValue"
  >
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getDesignConfig } from './config';
import type { CheckboxGroupProps } from './types';

defineOptions({
  name: 'TMCheckboxGroup',
});

const props = defineProps<CheckboxGroupProps>();

const ui = getDesignConfig('components')?.checkboxGroup;

const uiComponent = ui?.component || 'el-checkbox-group';

const uiProps = computed<CheckboxGroupProps>(() => ui?.props(props) || props);

const emit = defineEmits(['change', 'update:modelValue']);

const changeHandler = (v: any) => {
  emit('change', v);
};

const updateModelValue = (v: any) => {
  emit('update:modelValue', v);
};
</script>
