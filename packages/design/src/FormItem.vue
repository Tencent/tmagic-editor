<template>
  <component class="tmagic-design-form-item" :is="uiComponent.component" v-bind="uiProps">
    <template #label>
      <slot name="label"></slot>
    </template>
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { FormItemProps } from './types';

defineOptions({
  name: 'TMFormItem',
});

const props = defineProps<FormItemProps>();

const uiComponent = getConfig('components').formItem;

const uiProps = computed(() => uiComponent.props(props));
</script>
