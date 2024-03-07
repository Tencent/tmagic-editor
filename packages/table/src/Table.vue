<template>
  <TMagicTable
    tooltip-effect="dark"
    :tooltip-options="{ popperOptions: { strategy: 'absolute' } }"
    class="m-table"
    ref="tMagicTable"
    v-loading="loading"
    :data="tableData"
    :show-header="showHeader"
    :max-height="bodyHeight"
    :default-expand-all="defaultExpandAll"
    :border="hasBorder"
    :row-key="rowkeyName || 'id'"
    :tree-props="{ children: 'children' }"
    :empty-text="emptyText || '暂无数据'"
    :span-method="objectSpanMethod"
    @sort-change="sortChange"
    @select="selectHandler"
    @select-all="selectAllHandler"
    @selection-change="selectionChangeHandler"
    @cell-click="cellClickHandler"
    @expand-change="expandChange"
  >
    <template v-for="(item, columnIndex) in columns">
      <template v-if="item.type === 'expand'">
        <ExpandColumn :config="item" :key="columnIndex"></ExpandColumn>
      </template>

      <template v-else-if="item.type === 'component'">
        <ComponentColumn :config="item" :key="columnIndex"></ComponentColumn>
      </template>

      <template v-else-if="item.selection">
        <component
          width="40"
          type="selection"
          :is="tableColumnComponent?.component || 'el-table-column'"
          :key="columnIndex"
          :selectable="item.selectable"
        ></component>
      </template>

      <template v-else-if="item.actions">
        <ActionsColumn
          :columns="columns"
          :config="item"
          :rowkey-name="rowkeyName"
          :edit-state="editState"
          :key="columnIndex"
          @after-action="$emit('after-action')"
        ></ActionsColumn>
      </template>

      <template v-else-if="item.type === 'popover'">
        <PopoverColumn :key="columnIndex" :config="item"></PopoverColumn>
      </template>

      <template v-else>
        <TextColumn :key="columnIndex" :config="item" :edit-state="editState"></TextColumn>
      </template>
    </template>
  </TMagicTable>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { cloneDeep } from 'lodash-es';

import { getConfig, TMagicTable } from '@tmagic/design';

import ActionsColumn from './ActionsColumn.vue';
import ComponentColumn from './ComponentColumn.vue';
import ExpandColumn from './ExpandColumn.vue';
import PopoverColumn from './PopoverColumn.vue';
import type { ColumnConfig } from './schema';
import TextColumn from './TextColumn.vue';

defineOptions({
  name: 'MTable',
});

const props = withDefaults(
  defineProps<{
    data: any[];
    columns?: ColumnConfig[];
    /** 合并行或列的计算方法 */
    spanMethod?: (data: { row: any; column: any; rowIndex: number; columnIndex: number }) => [number, number];
    loading?: boolean;
    /** Table 的最大高度。合法的值为数字或者单位为 px 的高度 */
    bodyHeight?: string | number;
    /** 是否显示表头 */
    showHeader?: boolean;
    /** 空数据时显示的文本内容 */
    emptyText?: string;
    /** 是否默认展开所有行，当 Table 包含展开行存在或者为树形表格时有效 */
    defaultExpandAll?: boolean;
    rowkeyName?: string;
    /** 是否带有纵向边框 */
    border?: boolean;
  }>(),
  {
    columns: () => [],
    loading: false,
    showHeader: true,
    defaultExpandAll: false,
    border: false,
  },
);

const emit = defineEmits([
  'sort-change',
  'after-action',
  'select',
  'select-all',
  'selection-change',
  'expand-change',
  'cell-click',
]);

const tMagicTable = ref<InstanceType<typeof TMagicTable>>();

const editState = ref([]);

const tableColumnComponent = getConfig('components')?.tableColumn;
const selectionColumn = computed(() => {
  const column = props.columns.filter((item) => item.selection);
  return column.length ? column[0] : null;
});

const tableData = computed(() => {
  if (selectionColumn.value) {
    return props.data || [];
  }

  return cloneDeep(props.data) || [];
});

const hasBorder = computed(() => (typeof props.border !== 'undefined' ? props.border : true));

const sortChange = (data: any) => {
  emit('sort-change', data);
};

const selectHandler = (selection: any, row: any) => {
  const column = selectionColumn.value;
  if (!column) {
    return;
  }

  if (column.selection === 'single') {
    // this.clearSelection()
    // this.toggleRowSelection(row, true)
  }
  emit('select', selection, row);
};

const selectAllHandler = (selection: any) => {
  emit('select-all', selection);
};

const selectionChangeHandler = (selection: any) => {
  emit('selection-change', selection);
};

const cellClickHandler = (...args: any[]) => {
  emit('cell-click', ...args);
};

const expandChange = (...args: any[]) => {
  emit('expand-change', ...args);
};

const toggleRowSelection = (row: any, selected: boolean) => {
  tMagicTable.value?.toggleRowSelection(row, selected);
};

const toggleRowExpansion = (row: any, expanded: boolean) => {
  tMagicTable.value?.toggleRowExpansion(row, expanded);
};

const clearSelection = () => {
  tMagicTable.value?.clearSelection();
};

const objectSpanMethod = (data: any) => {
  if (typeof props.spanMethod === 'function') {
    return props.spanMethod(data);
  }
  return () => ({
    rowspan: 0,
    colspan: 0,
  });
};

defineExpose({
  toggleRowSelection,
  toggleRowExpansion,
  clearSelection,
});
</script>

<style lang="scss">
.m-table {
  .el-button.action-btn + .el-button.action-btn {
    margin-left: 0;
  }
  .keep-all {
    word-break: keep-all;
  }
  .el-table .cell > div {
    display: inline-block;
    vertical-align: middle;
  }
  .el-table__row.el-table__row--level-1 {
    color: #999;
  }
}
</style>
