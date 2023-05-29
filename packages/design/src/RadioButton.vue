<template>
  <component class="tmagic-design-radio-button" :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { RadioButtonProps } from './types';

defineOptions({
  name: 'TMRadioButton',
});

const props = defineProps<RadioButtonProps>();

const uiComponent = getConfig('components').radioButton;

const uiProps = computed(() => uiComponent.props(props));
</script>
