<template>
  <component class="tmagic-design-divider" :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { DividerProps } from './types';

defineOptions({
  name: 'TMDivider',
});

const props = defineProps<DividerProps>();

const uiComponent = getConfig('components').divider;

const uiProps = computed(() => uiComponent.props(props));
</script>
