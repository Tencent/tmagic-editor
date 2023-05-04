<template>
  <component class="tmagic-design-dropdown-menu" :is="uiComponent.component">
    <slot></slot>
  </component>
</template>

<script setup lang="ts" name="TMDropdownMenu">
import { getConfig } from './config';

const uiComponent = getConfig('components').dropdownMenu;
</script>
