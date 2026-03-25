<template>
  <component class="tmagic-design-form-item" :is="uiComponent" v-bind="uiProps">
    <template #label>
      <slot name="label"></slot>
    </template>

    <template #default>
      <slot></slot>
      <div v-if="adapterType === 'element-plus' && extra" v-html="extra" class="m-form-tip"></div>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getDesignConfig } from './config';
import type { FormItemProps } from './types';

defineOptions({
  name: 'TMFormItem',
});

const props = defineProps<FormItemProps>();

const ui = getDesignConfig('components')?.formItem;

const uiComponent = ui?.component || 'el-form-item';

const adapterType = getDesignConfig('adapterType');

const uiProps = computed<FormItemProps>(() => {
  const { extra, ...rest } = ui?.props(props) || props;
  return rest;
});
</script>
