<template>
  <component class="tmagic-design-icon" :is="uiComponent.component">
    <slot></slot>
  </component>
</template>

<script setup lang="ts" name="TMIcon">
import { getConfig } from './config';

const uiComponent = getConfig('components').icon;
</script>
