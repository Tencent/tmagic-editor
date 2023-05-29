<template>
  <component :is="uiComponent.component" v-bind="uiProps">
    <template #default="{ $index, row }">
      <!-- eslint-disable-next-line vue/valid-attribute-name -->
      <slot :$index="$index" :row="row"></slot>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { TableColumnProps } from './types';

defineOptions({
  name: 'TMTableColumn',
});

const props = defineProps<TableColumnProps>();

const uiComponent = getConfig('components').tableColumn;

const uiProps = computed(() => uiComponent.props(props));
</script>
