<template>
  <component class="tmagic-design-col" :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { ColProps } from './types';

defineOptions({
  name: 'TMCol',
});

const props = defineProps<ColProps>();

const uiComponent = getConfig('components').col;

const uiProps = computed(() => uiComponent.props(props));
</script>
