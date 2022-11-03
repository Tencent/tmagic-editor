<template>
  <component :is="uiComponent.component" v-bind="uiProps" @close="closeHandler" @update:modelValue="updateModelValue">
    <slot></slot>

    <template #footer>
      <slot name="footer"></slot>
    </template>
  </component>
</template>

<script setup lang="ts" name="TMDialog">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  modelValue?: boolean;
  appendToBody?: boolean;
  beforeClose?: any;
  title?: string;
  width?: string | number;
  fullscreen?: boolean;
  closeOnClickModal?: boolean;
  labelPosition?: string;
}>();

const uiComponent = getConfig('components').dialog;

const uiProps = computed(() => uiComponent.props(props));

const emit = defineEmits(['close', 'update:modelValue']);

const closeHandler = (...args: any[]) => {
  emit('close', ...args);
};

const updateModelValue = (v: any) => {
  emit('update:modelValue', v);
};
</script>
