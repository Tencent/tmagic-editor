<template>
  <component class="tmagic-design-scrollbar" :is="uiComponent">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { getDesignConfig } from './config';

defineOptions({
  name: 'TMScrollbar',
});

const ui = getDesignConfig('components')?.scrollbar;

const uiComponent = ui?.component || 'el-scrollbar';
</script>
