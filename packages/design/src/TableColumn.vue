<template>
  <component :is="uiComponent" v-bind="uiProps">
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

const ui = getConfig('components')?.tableColumn;

const uiComponent = ui?.component || 'el-table-column';

const uiProps = computed(() => ui?.props(props) || props);
</script>
