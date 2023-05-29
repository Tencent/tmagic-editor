<template>
  <component class="tmagic-design-tag" :is="uiComponent.component" v-bind="uiProps">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { TagProps } from './types';

defineOptions({
  name: 'TMTag',
});

const props = defineProps<TagProps>();

const uiComponent = getConfig('components').tag;

const uiProps = computed(() => uiComponent.props(props));
</script>
