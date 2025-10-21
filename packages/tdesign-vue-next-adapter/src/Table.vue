<template>
  <TTable
    ref="table"
    :data="data"
    :bordered="border"
    :max-height="maxHeight"
    :default-expand-all="defaultExpandAll"
    :show-header="showHeader"
    :row-key="rowKey"
    :tree="treeProps"
    :empty="emptyText"
    :columns="tableColumns"
    @sort-change="sortChange"
    @select-change="selectHandler"
    @cell-click="cellClickHandler"
    @expand-change="expandChange"
  />
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import { Table as TTable } from 'tdesign-vue-next';

import type { TableProps } from '@tmagic/design';

defineOptions({
  name: 'TTDesignAdapterTable',
});

const emit = defineEmits(['sort-change', 'select', 'select-all', 'selection-change', 'expand-change', 'cell-click']);

const props = defineProps<TableProps>();

const tableRef = useTemplateRef('table');

// 将列配置转换为 TDesign 格式
const tableColumns = computed(() => {
  if (!props.columns) return [];

  const columns = [];
  for (const item of props.columns) {
    if (item.props.type === 'expand') {
      continue;
    }

    let colKey = item.props?.prop || item.props?.type;

    if (!colKey) {
      colKey = 'tmagic_table_operation';
    }

    const column: any = {
      thClassName: item.props?.class,
      colKey,
      title: item.props?.label,
      width: item.props?.width,
      fixed: item.props?.fixed === true ? 'left' : item.props?.fixed || undefined,
      ellipsis: props.showOverflowTooltip,
      sorter: item.props?.sortable,
      align: item.props?.align,
    };

    // 处理自定义单元格渲染
    if (item.cell) {
      column.cell = (h: any, { row, rowIndex }: any) => {
        return item.cell?.({ row, $index: rowIndex });
      };
    }

    columns.push(column);
  }

  return columns;
});

const sortChange = (data: any) => {
  emit('sort-change', data);
};

const selectHandler = (selectedRowKeys: any[], options: any) => {
  const { selectedRowData, type } = options;

  if (type === 'check') {
    emit('select', selectedRowData);
  } else if (type === 'uncheck') {
    emit('select', selectedRowData);
  }

  emit('selection-change', selectedRowData);
};

const cellClickHandler = (context: any) => {
  const { row, col, e } = context;
  emit('cell-click', row, col, undefined, e);
};

const expandChange = (expandedRowKeys: any[], options: any) => {
  emit('expand-change', options.expandedRowData, options.currentRowData);
};

const toggleRowSelection = (_row: any, _selected: boolean) => {
  // TDesign 的选择方法需要通过 selectedRowKeys 来控制
  // 这里需要根据实际情况调整
  console.warn('toggleRowSelection needs to be implemented based on TDesign API');
};

const toggleRowExpansion = (_row: any, _expanded: boolean) => {
  // TDesign 的展开方法需要通过 expandedRowKeys 来控制
  console.warn('toggleRowExpansion needs to be implemented based on TDesign API');
};

const clearSelection = () => {
  // TDesign 需要通过更新 selectedRowKeys 来清空选择
  console.warn('clearSelection needs to be implemented based on TDesign API');
};

defineExpose({
  getEl: () => tableRef.value?.$el,
  getTableRef: () => tableRef.value,
  clearSelection,
  toggleRowSelection,
  toggleRowExpansion,
});
</script>
