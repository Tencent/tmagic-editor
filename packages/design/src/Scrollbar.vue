<template>
  <component class="tmagic-design-scrollbar" :is="uiComponent.component">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { getConfig } from './config';

defineOptions({
  name: 'TMScrollbar',
});

const uiComponent = getConfig('components').scrollbar;
</script>
