<template>
  <component
    class="tmagic-design-date-picker"
    :is="uiComponent.component"
    v-bind="uiProps"
    @change="changeHandler"
    @update:modelValue="updateModelValue"
  >
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { DatePickerProps } from './types';

defineOptions({
  name: 'TMDatePicker',
});

const props = withDefaults(defineProps<DatePickerProps>(), {
  type: 'date',
});

const uiComponent = getConfig('components').datePicker;

const uiProps = computed(() => uiComponent.props(props));

const emit = defineEmits(['change', 'update:modelValue']);

const changeHandler = (v: any) => {
  emit('change', v);
};

const updateModelValue = (v: any) => {
  emit('update:modelValue', v);
};
</script>
