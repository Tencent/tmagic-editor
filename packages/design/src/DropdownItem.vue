<template>
  <component :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts" name="TMDropdownItem">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  command?: any;
  disabled?: boolean;
  divided?: boolean;
  icon?: any;
}>();

const uiComponent = getConfig('components').dropdownItem;

const uiProps = computed(() => uiComponent.props(props));
</script>
