<template>
  <component
    class="tmagic-design-table"
    ref="table"
    :is="uiComponent"
    v-bind="uiProps"
    row-class-name="tmagic-design-table-row"
    cell-class-name="tmagic-design-table-cell"
    @select="selectHandler"
    @sort-change="sortChangeHandler"
    @expand-change="expandChangeHandler"
    @cell-click="cellClickHandler"
  >
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';

import { getDesignConfig } from './config';
import type { TableProps } from './types';

defineOptions({
  name: 'TMTable',
});

const props = withDefaults(defineProps<TableProps>(), {
  data: () => [],
});

const ui = getDesignConfig('components')?.table;

const uiComponent = ui?.component || 'el-table';

const uiProps = computed<TableProps>(() => ui?.props(props) || props);

const emit = defineEmits(['select', 'sort-change', 'expand-change', 'cell-click']);

const tableRef = useTemplateRef('table');

const selectHandler = (...args: any[]) => {
  emit('select', ...args);
};

const sortChangeHandler = (...args: any[]) => {
  emit('sort-change', ...args);
};

const expandChangeHandler = (...args: any[]) => {
  emit('expand-change', ...args);
};

const cellClickHandler = (...args: any[]) => {
  emit('cell-click', ...args);
};

defineExpose({
  getEl: () => tableRef.value?.getTableRef().$el,

  getTableRef: () => tableRef.value.getTableRef(),

  clearSelection(...args: any[]) {
    return tableRef.value?.clearSelection(...args);
  },

  toggleRowSelection(...args: any[]) {
    return tableRef.value?.toggleRowSelection(...args);
  },

  toggleRowExpansion(...args: any[]) {
    return tableRef.value?.toggleRowExpansion(...args);
  },
});
</script>
