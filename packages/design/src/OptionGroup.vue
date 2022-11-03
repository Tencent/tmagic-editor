<template>
  <component ref="optionGroup" :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts" name="TMOptionGroup">
import { computed, ref } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  label?: string;
  disabled?: boolean;
}>();

const uiComponent = getConfig('components').optionGroup;

const uiProps = computed(() => uiComponent.props(props));

const optionGroup = ref<any>();
</script>
