<template>
  <component :is="uiComponent.component" v-bind="uiProps" @change="changeHandler" @update:modelValue="updateModelValue">
  </component>
</template>

<script setup lang="ts" name="TMColorPicker">
import { computed } from 'vue';

import { getConfig } from './config';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    disabled?: boolean;
    showAlpha?: boolean;
    size?: 'mini' | 'small' | 'medium';
  }>(),
  {
    showAlpha: false,
    disabled: false,
  },
);

const uiComponent = getConfig('components').colorPicker;

const uiProps = computed(() => uiComponent.props(props));

const emit = defineEmits(['change', 'update:modelValue']);

const changeHandler = (v: any) => {
  emit('change', v);
};

const updateModelValue = (v: any) => {
  emit('update:modelValue', v);
};
</script>
