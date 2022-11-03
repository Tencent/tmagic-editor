<template>
  <component ref="form" :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts" name="TMForm">
import { computed, ref } from 'vue';

import { getConfig } from './config';

const form = ref<any>();

const props = defineProps<{
  model?: any;
  labelWidth?: string;
  disabled?: boolean;
  inline?: boolean;
  labelPosition?: string;
}>();

const uiComponent = getConfig('components').form;

const uiProps = computed(() => uiComponent.props(props));

defineExpose({
  validate() {
    return form.value?.validate();
  },

  resetFields() {
    return form.value?.resetFields();
  },
});
</script>
