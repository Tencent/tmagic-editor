<template>
  <component class="tmagic-design-option" :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { OptionProps } from './types';

defineOptions({
  name: 'TMOption',
});

const props = defineProps<OptionProps>();

const uiComponent = getConfig('components').option;

const uiProps = computed(() => uiComponent.props(props));
</script>
