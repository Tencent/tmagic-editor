<template>
  <component class="tmagic-design-row" :is="uiComponent">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { getDesignConfig } from './config';

defineOptions({
  name: 'TMRow',
});

const uiComponent = getDesignConfig('components')?.row.component || 'el-row';
</script>
