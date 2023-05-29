<template>
  <component class="tmagic-design-row" :is="uiComponent">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { getConfig } from './config';

defineOptions({
  name: 'TMRow',
});

const uiComponent = getConfig('components')?.row.component || 'el-row';
</script>
