<template>
  <component class="tmagic-design-radio" :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { RadioProps } from './types';

defineOptions({
  name: 'TMRadio',
});

const props = defineProps<RadioProps>();

const uiComponent = getConfig('components').radio;

const uiProps = computed(() => uiComponent.props(props));
</script>
