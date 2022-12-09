<template>
  <component class="tmagic-design-card" :is="uiComponent.component" v-bind="uiProps">
    <template #header>
      <slot name="header" class="header"></slot>
    </template>

    <template #default>
      <slot name="default"></slot>
    </template>
  </component>
</template>

<script setup lang="ts" name="TMCard">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  bodyStyle?: Record<string, any>;
  shadow?: string;
  header?: string;
}>();

const uiComponent = getConfig('components').card;

const uiProps = computed(() => uiComponent.props(props));
</script>
