<template>
  <component
    class="tmagic-design-checkbox"
    :is="uiComponent.component"
    v-bind="uiProps"
    @update:modelValue="updateModelValue"
    @change="changeHandler"
  >
    <template #default>
      <slot></slot>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { CheckboxProps } from './types';

defineOptions({
  name: 'TMCheckbox',
});

const props = withDefaults(defineProps<CheckboxProps>(), {
  trueLabel: undefined,
  falseLabel: undefined,
});

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
