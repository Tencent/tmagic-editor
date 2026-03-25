<template>
  <component class="tmagic-design-radio" :is="uiComponent" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getDesignConfig } from './config';
import type { RadioProps } from './types';

defineOptions({
  name: 'TMRadio',
});

const props = defineProps<RadioProps>();

const ui = getDesignConfig('components')?.radio;

const uiComponent = ui?.component || 'el-radio';

const uiProps = computed<RadioProps>(() => ui?.props(props) || props);
</script>
