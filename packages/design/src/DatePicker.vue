<template>
  <component
    class="tmagic-design-date-picker"
    :is="uiComponent"
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

const ui = getConfig('components')?.datePicker;

const uiComponent = ui?.component || 'el-date-picker';

const uiProps = computed(() => ui?.props(props) || props);

const emit = defineEmits(['change', 'update:modelValue']);

const changeHandler = (v: any) => {
  emit('change', v);
};

const updateModelValue = (v: any) => {
  emit('update:modelValue', v);
};
</script>
