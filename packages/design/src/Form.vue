<template>
  <component class="tmagic-design-form" ref="form" :is="uiComponent" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { getConfig } from './config';
import type { FormProps } from './types';

defineOptions({
  name: 'TMForm',
});

const props = defineProps<FormProps>();

const ui = getConfig('components')?.form;

const uiComponent = ui?.component || 'el-form';

const uiProps = computed(() => ui?.props(props) || props);

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
