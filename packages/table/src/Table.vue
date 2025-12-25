<template>
  <TMagicTable
    v-loading="loading"
    class="m-table"
    ref="tMagicTable"
    :show-overflow-tooltip="true"
    tooltip-effect="dark"
    :tooltip-options="{ popperOptions: { strategy: 'absolute' } }"
    :data="tableData"
    :show-header="showHeader"
    :max-height="bodyHeight"
    :default-expand-all="defaultExpandAll"
    :border="hasBorder"
    :row-key="rowkeyName || 'id'"
    :tree-props="{ children: 'children' }"
    :empty-text="emptyText || '暂无数据'"
    :span-method="objectSpanMethod"
    :columns="tableColumns"
    @sort-change="sortChange"
    @select="selectHandler"
    @select-all="selectAllHandler"
    @selection-change="selectionChangeHandler"
    @cell-click="cellClickHandler"
    @expand-change="expandChange"
  ></TMagicTable>
</template>

<script lang="ts" setup>
import { computed, h, ref, useTemplateRef } from 'vue';
import { cloneDeep } from 'lodash-es';

import { TMagicTable } from '@tmagic/design';

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
    spanMethod?: (_data: { row: any; column: any; rowIndex: number; columnIndex: number }) => [number, number];
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
  'after-action-cancel',
  'select',
  'select-all',
  'selection-change',
  'expand-change',
  'cell-click',
]);

const cellRender = (config: ColumnConfig, { row = {}, $index }: any) => {
  if (config.type === 'expand') {
    return h(ExpandColumn, {
      config,
      row,
    });
  }
  if (config.type === 'component') {
    return h(ComponentColumn, {
      config,
      row,
      index: $index,
    });
  }
  if (config.actions) {
    return h(ActionsColumn, {
      config,
      row,
      index: $index,
      rowkeyName: props.rowkeyName,
      editState: editState.value,
      columns: props.columns,
      onAfterAction: (payload: { index: number }) => emit('after-action', payload),
      onAfterActionCancel: (payload: { index: number }) => emit('after-action-cancel', payload),
    });
  }
  if (config.type === 'popover') {
    return h(PopoverColumn, {
      config,
      row,
      index: $index,
    });
  }
  return h(TextColumn, {
    config,
    row,
    index: $index,
    editState: editState.value,
  });
};

const tableColumns = computed(() =>
  props.columns.map((item) => {
    let type: 'default' | 'selection' | 'index' | 'expand' = 'default';
    if (item.type === 'expand') {
      type = 'expand';
    } else if (item.selection) {
      type = 'selection';
    }

    return {
      props: {
        label: item.label,
        fixed: item.fixed,
        width: item.width ?? (item.selection ? 40 : undefined),
        prop: item.prop,
        type,
        selectable: item.selectable,
      },
      cell: type === 'selection' ? undefined : ({ row, $index }: any) => cellRender(item, { row, $index }),
    };
  }),
);

const tMagicTableRef = useTemplateRef('tMagicTable');

const editState = ref([]);

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
  tMagicTableRef.value?.toggleRowSelection(row, selected);
};

const toggleRowExpansion = (row: any, expanded: boolean) => {
  tMagicTableRef.value?.toggleRowExpansion(row, expanded);
};

const clearSelection = () => {
  tMagicTableRef.value?.clearSelection();
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
