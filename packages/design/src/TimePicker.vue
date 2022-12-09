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

<script setup lang="ts" name="TMTimePicker">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  modelValue?: any;
  disabled?: boolean;
  placeholder?: string;
  size?: 'large' | 'default' | 'small';
}>();

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
