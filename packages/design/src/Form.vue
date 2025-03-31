<template>
  <component
    class="tmagic-design-form"
    :class="{ 'tmagic-design-form-inline': inline }"
    ref="form"
    :is="uiComponent"
    v-bind="uiProps"
  >
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { getDesignConfig } from './config';
import type { FormProps } from './types';

defineOptions({
  name: 'TMForm',
});

const props = defineProps<FormProps>();

const ui = getDesignConfig('components')?.form;

const uiComponent = ui?.component || 'el-form';

const uiProps = computed<FormProps>(() => ui?.props(props) || props);

const form = ref<any>();

defineExpose({
  validate() {
    return form.value?.validate();
  },

  resetFields() {
    if (typeof form.value?.resetFields === 'function') {
      return form.value?.resetFields();
    }
    if (typeof form.value?.reset === 'function') {
      return form.value?.reset();
    }
  },
});
</script>
