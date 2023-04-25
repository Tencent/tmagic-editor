<template>
  <component class="tmagic-design-radio-button" :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts" name="TMRadioButton">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  label?: string | number | boolean;
  disabled?: boolean;
  name?: string;
}>();

const uiComponent = getConfig('components').radioButton;

const uiProps = computed(() => uiComponent.props(props));
</script>
