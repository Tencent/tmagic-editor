<template>
  <component class="tmagic-design-alert" :is="uiComponent" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getDesignConfig } from './config';
import type { AlertProps } from './types';

defineOptions({
  name: 'TMAlert',
});

const props = defineProps<AlertProps>();

const ui = getDesignConfig('components')?.alert;
const uiComponent = ui?.component || 'el-alert';

const uiProps = computed<AlertProps>(() => ui?.props(props) || props);
</script>
