<template>
  <component class="tmagic-design-icon" :is="uiComponent">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { getDesignConfig } from './config';
import { IconProps } from './types';

defineOptions({
  name: 'TMIcon',
});

const ui = getDesignConfig('components')?.icon;
const uiComponent = ui?.component || 'el-icon';
defineProps<IconProps>();
</script>
