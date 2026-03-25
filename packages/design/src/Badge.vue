<template>
  <component class="tmagic-design-badge" :is="uiComponent" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getDesignConfig } from './config';
import type { BadgeProps } from './types';

defineOptions({
  name: 'TMBadge',
});

const props = defineProps<BadgeProps>();

const ui = getDesignConfig('components')?.badge;
const uiComponent = ui?.component || 'el-badge';

const uiProps = computed<BadgeProps>(() => ui?.props(props) || props);
</script>
