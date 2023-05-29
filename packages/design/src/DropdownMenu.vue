<template>
  <component class="tmagic-design-dropdown-menu" :is="uiComponent">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { getConfig } from './config';

defineOptions({
  name: 'TMDropdownMenu',
});

const ui = getConfig('components')?.dropdownMenu;

const uiComponent = ui?.component || 'el-dropdown-menu';
</script>
