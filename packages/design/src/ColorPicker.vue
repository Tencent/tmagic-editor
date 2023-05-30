<template>
  <component
    class="tmagic-design-color-picker"
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
import type { ColorPickerProps } from './types';

defineOptions({
  name: 'TMColorPicker',
});

const props = withDefaults(defineProps<ColorPickerProps>(), {
  showAlpha: false,
  disabled: false,
});

const ui = getConfig('components')?.colorPicker;

const uiComponent = ui?.component || 'el-color-picker';

const uiProps = computed(() => ui?.props(props) || props);

const emit = defineEmits(['change', 'update:modelValue']);

const changeHandler = (v: any) => {
  emit('change', v);
};

const updateModelValue = (v: any) => {
  emit('update:modelValue', v);
};
</script>
