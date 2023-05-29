<template>
  <component class="tmagic-design-form" ref="form" :is="uiComponent.component" v-bind="uiProps">
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

const uiComponent = getConfig('components').form;

const uiProps = computed(() => uiComponent.props(props));

const form = ref<any>();

defineExpose({
  validate() {
    return form.value?.validate();
  },

  resetFields() {
    return form.value?.resetFields();
  },
});
</script>
