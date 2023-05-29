<template>
  <component class="tmagic-design-icon" :is="uiComponent.component">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { getConfig } from './config';

defineOptions({
  name: 'TMIcon',
});

const uiComponent = getConfig('components').icon;
</script>
