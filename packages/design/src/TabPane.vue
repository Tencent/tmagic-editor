<template>
  <component class="tmagic-design-tab-pane" :is="uiComponent" v-bind="uiProps">
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

const ui = getConfig('components')?.tabPane;

const uiComponent = ui?.component || 'el-tab-pane';

const uiProps = computed(() => ui?.props(props) || props);
</script>
