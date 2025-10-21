<template>
  <ElTable
    ref="table"
    :data="data"
    :border="border"
    :max-height="maxHeight"
    :default-expand-all="defaultExpandAll"
    :show-header="showHeader"
    :row-key="rowKey"
    :tree-props="treeProps"
    :empty-text="emptyText"
    :show-overflow-tooltip="showOverflowTooltip"
    :tooltip-effect="tooltipEffect"
    :tooltip-options="tooltipOptions"
    :span-method="spanMethod"
    @sort-change="sortChange"
    @select="selectHandler"
    @select-all="selectAllHandler"
    @selection-change="selectionChangeHandler"
    @cell-click="cellClickHandler"
    @expand-change="expandChange"
  >
    <template v-for="(item, columnIndex) in columns" :key="columnIndex">
      <ElTableColumn v-bind="item.props || {}">
        <template #default="scope" v-if="item.cell">
          <component :is="item.cell(scope)"></component>
        </template>
      </ElTableColumn>
    </template>
  </ElTable>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { ElTable, ElTableColumn } from 'element-plus';

import type { TableProps } from '@tmagic/design';

defineOptions({
  name: 'TElAdapterTable',
});

const emit = defineEmits(['sort-change', 'select', 'select-all', 'selection-change', 'expand-change', 'cell-click']);

defineProps<TableProps>();

const tableRef = useTemplateRef('table');

const sortChange = (data: any) => {
  emit('sort-change', data);
};

const selectHandler = (...args: any[]) => {
  emit('select', ...args);
};

const selectAllHandler = (...args: any[]) => {
  emit('select-all', ...args);
};

const selectionChangeHandler = (...args: any[]) => {
  emit('selection-change', ...args);
};

const cellClickHandler = (...args: any[]) => {
  emit('cell-click', ...args);
};

const expandChange = (...args: any[]) => {
  emit('expand-change', ...args);
};

const toggleRowSelection = (row: any, selected: boolean) => {
  tableRef.value?.toggleRowSelection(row, selected);
};

const toggleRowExpansion = (row: any, expanded: boolean) => {
  tableRef.value?.toggleRowExpansion(row, expanded);
};

const clearSelection = () => {
  tableRef.value?.clearSelection();
};

defineExpose({
  getEl: () => tableRef.value?.$el,
  getTableRef: () => tableRef.value,
  clearSelection,
  toggleRowSelection,
  toggleRowExpansion,
});
</script>
