<template>
  <component :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts" name="TMScrollbar">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps();

const uiComponent = getConfig('components').scrollbar;

const uiProps = computed(() => uiComponent.props(props));
</script>
