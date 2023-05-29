<template>
  <component class="tmagic-design-dropdown-menu" :is="uiComponent.component">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { getConfig } from './config';

defineOptions({
  name: 'TMDropdownMenu',
});

const uiComponent = getConfig('components').dropdownMenu;
</script>
