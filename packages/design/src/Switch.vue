<template>
  <component
    class="tmagic-design-switch"
    :is="uiComponent"
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

import { getDesignConfig } from './config';
import type { SwitchProps } from './types';

defineOptions({
  name: 'TMSwitch',
});

const props = defineProps<SwitchProps>();

const ui = getDesignConfig('components')?.switch;

const uiComponent = ui?.component || 'el-switch';

const uiProps = computed<SwitchProps>(() => ui?.props(props) || props);

const emit = defineEmits(['change', 'update:modelValue']);

const changeHandler = (v: any) => {
  emit('change', v);
};

const updateModelValue = (v: any) => {
  emit('update:modelValue', v);
};
</script>
