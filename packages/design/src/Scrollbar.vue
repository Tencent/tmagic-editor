<template>
  <component class="tmagic-design-scrollbar" :is="uiComponent">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { getConfig } from './config';

defineOptions({
  name: 'TMScrollbar',
});

const ui = getConfig('components')?.scrollbar;

const uiComponent = ui?.component || 'el-scrollbar';
</script>
