<template>
  <component class="tmagic-design-radio-button" :is="uiComponent" v-bind="uiProps">
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

const ui = getConfig('components')?.radioButton;

const uiComponent = ui?.component || 'el-radio-button';

const uiProps = computed(() => ui?.props(props) || props);
</script>
