<template>
  <component class="tmagic-design-badge" :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { BadgeProps } from './types';

defineOptions({
  name: 'TMBadge',
});

const props = defineProps<BadgeProps>();

const uiComponent = getConfig('components').badge;

const uiProps = computed(() => uiComponent.props(props));
</script>
