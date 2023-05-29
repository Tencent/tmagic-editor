<template>
  <component class="tmagic-design-tab-pane" :is="uiComponent.component" v-bind="uiProps">
    <template #default>
      <slot></slot>
    </template>

    <template #label v-if="$slots.label">
      <slot name="label"></slot>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { TabPaneProps } from './types';

defineOptions({
  name: 'TMTabPane',
});

const props = defineProps<TabPaneProps>();
const uiComponent = getConfig('components').tabPane;

const uiProps = computed(() => uiComponent.props(props));
</script>
