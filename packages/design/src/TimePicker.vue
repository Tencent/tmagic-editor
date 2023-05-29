<template>
  <component
    class="tmagic-design-time-picker"
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
import type { TimePickerProps } from './types';

defineOptions({
  name: 'TMTimePicker',
});

const props = defineProps<TimePickerProps>();

const uiComponent = getConfig('components').timePicker;

const uiProps = computed(() => uiComponent.props(props));

const emit = defineEmits(['change', 'update:modelValue']);

const changeHandler = (v: any) => {
  emit('change', v);
};

const updateModelValue = (v: any) => {
  emit('update:modelValue', v);
};
</script>
