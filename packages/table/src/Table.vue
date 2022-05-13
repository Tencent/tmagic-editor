<template>
  <el-table
    :data="tableData"
    :show-header="showHeader"
    :max-height="bodyHeight"
    tooltip-effect="dark"
    class="m-table"
    ref="table"
    :default-expand-all="defaultExpandAll"
    :border="hasBorder"
    :row-key="rowkeyName || 'c_id'"
    :tree-props="{ children: 'children' }"
    :empty-text="emptyText || '暂无数据'"
    :span-method="objectSpanMethod"
    @sort-change="sortChange"
    @select="selectHandler"
    @select-all="selectAllHandler"
    @selection-change="selectionChangeHandler"
  >
    <template v-for="(item, columnIndex) in columns">
      <template v-if="item.type === 'expand'">
        <expand-column :config="item" :key="columnIndex"></expand-column>
      </template>

      <template v-else-if="item.selection">
        <el-table-column type="selection" :key="columnIndex" width="40" :selectable="item.selectable"></el-table-column>
      </template>

      <template v-else-if="item.actions">
        <actions-column
          :columns="columns"
          :config="item"
          :rowkey-name="rowkeyName"
          :edit-state="editState"
          :key="columnIndex"
          @afterAction="$emit('afterAction')"
        ></actions-column>
      </template>

      <template v-else-if="item.type === 'popover'">
        <popover-column :key="columnIndex" :config="item"></popover-column>
      </template>

      <template v-else>
        <text-column :key="columnIndex" :config="item" :edit-state="editState"></text-column>
      </template>
    </template>
  </el-table>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ElTable } from 'element-plus';
import { cloneDeep } from 'lodash-es';

import ActionsColumn from './ActionsColumn.vue';
import ExpandColumn from './ExpandColumn.vue';
import PopoverColumn from './PopoverColumn.vue';
import TextColumn from './TextColumn.vue';

export default defineComponent({
  name: 'm-table',

  components: { ExpandColumn, ActionsColumn, PopoverColumn, TextColumn },

  props: {
    data: {
      type: Array,
      require: true,
    },

    columns: {
      type: Array as PropType<any[]>,
      require: true,
      default: () => [],
    },

    /** 合并行或列的计算方法 */
    spanMethod: {
      type: Function as PropType<
        (data: { row: any; column: any; rowIndex: number; columnIndex: number }) => [number, number]
      >,
    },

    fetch: {
      type: Boolean,
      default: false,
    },

    /** Table 的最大高度。合法的值为数字或者单位为 px 的高度 */
    bodyHeight: {
      type: [String, Number],
    },

    /** 是否显示表头 */
    showHeader: {
      type: Boolean,
      default: true,
    },

    /** 空数据时显示的文本内容 */
    emptyText: {
      type: String,
    },

    /** 是否默认展开所有行，当 Table 包含展开行存在或者为树形表格时有效 */
    defaultExpandAll: {
      type: Boolean,
      default: false,
    },

    rowkeyName: {
      type: String,
    },

    /** 是否带有纵向边框 */
    border: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['sort-change', 'afterAction', 'select', 'select-all', 'selection-change'],

  data(): {
    editState: any[];
  } {
    return {
      editState: [],
    };
  },

  computed: {
    tableData() {
      if (this.selectionColumn) {
        return this.data || [];
      }

      return cloneDeep(this.data) || [];
    },

    selectionColumn() {
      const column = this.columns.filter((item) => item.selection);
      return column.length ? column[0] : null;
    },

    hasBorder() {
      return typeof this.border !== 'undefined' ? this.border : true;
    },
  },

  methods: {
    sortChange(data: any) {
      this.$emit('sort-change', data);
    },

    selectHandler(selection: any, row: any) {
      const column = this.selectionColumn;
      if (!column) {
        return;
      }

      if (column.selection === 'single') {
        // this.clearSelection()
        // this.toggleRowSelection(row, true)
      }
      this.$emit('select', selection, row);
    },

    selectAllHandler(selection: any) {
      this.$emit('select-all', selection);
    },

    selectionChangeHandler(selection: any) {
      this.$emit('selection-change', selection);
    },

    toggleRowSelection(row: any, selected: boolean) {
      const table = this.$refs.table as InstanceType<typeof ElTable>;
      table.toggleRowSelection.bind(table)(row, selected);
    },

    toggleRowExpansion(row: any, expanded: boolean) {
      const table = this.$refs.table as InstanceType<typeof ElTable>;
      table.toggleRowExpansion.bind(table)(row, expanded);
    },

    clearSelection() {
      const table = this.$refs.table as InstanceType<typeof ElTable>;
      table.clearSelection.bind(table)();
    },

    objectSpanMethod(data: any) {
      if (typeof this.spanMethod === 'function') {
        return this.spanMethod(data);
      }
      return () => ({
        rowspan: 0,
        colspan: 0,
      });
    },
  },
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
