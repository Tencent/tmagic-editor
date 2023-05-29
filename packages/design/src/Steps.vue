<template>
  <component class="tmagic-design-steps" :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { StepsProps } from './types';

defineOptions({
  name: 'TMSteps',
});

const props = defineProps<StepsProps>();

const uiComponent = getConfig('components').steps;

const uiProps = computed(() => uiComponent.props(props));
</script>
