<!-- 表格组件 -->
<template>
  <el-table
    :data="tableData?.data"
    :empty-text="tableData?.errorMsg || '暂无数据'"
    @sort-change="sortChange"
    v-loading="!tableData?.fetch"
    border
  >
    <!-- 解析表格配置 -->
    <template v-for="(item, columnIndex) in columns">
      <!-- 操作栏 -->
      <el-table-column
        :key="columnIndex + '1'"
        v-if="item.actions"
        :prop="item.prop"
        :label="item.label"
        :width="item.width"
        :fixed="item.fixed"
      >
        <template #default="{ row, $index }">
          <el-button
            class="action-btn"
            v-for="(action, actionIndex) in item.actions"
            :key="actionIndex"
            @click="actionHandler(action, row, $index)"
            text
            size="small"
            v-html="action.text"
          ></el-button>
        </template>
      </el-table-column>
      <!-- 数据展示栏 -->
      <el-table-column
        v-else
        :key="columnIndex + '2'"
        :prop="item.prop"
        :label="item.label"
        :width="item.width"
        :fixed="item.fixed"
        :sortable="item.sortable ? item.sortable : false"
        show-overflow-tooltip
        :type="item.type"
      >
        <template #default="{ row }">
          <!-- 展示为文字链接 -->
          <el-button v-if="item.action === 'actionLink'" text @click="item.handler(row)">
            {{ formatter(item, row) }}
          </el-button>
          <!-- 展示为标签 -->
          <el-tag v-else-if="item.action === 'tag'" :type="statusTagType[row[item.prop]]" close-transition>
            {{ formatter(item, row) }}
          </el-tag>
          <!-- 扩展表格（子表） -->
          <el-table
            v-else-if="item.table"
            :data="row.pages"
            empty-text="暂无数据"
            border
            size="small"
            class="sub-table"
          >
            <!-- 解析子表 -->
            <el-table-column
              v-for="(column, columnIndex) in item.table"
              :key="columnIndex"
              :prop="column.prop"
              :label="column.label"
            >
              <template #default="page">
                {{ formatter(column, page.row) }}
              </template>
            </el-table-column>
          </el-table>
          <div v-else v-html="formatter(item, row)"></div>
        </template>
      </el-table-column>
    </template>
  </el-table>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';

import { ActListItem, ActListRes } from '@src/api/act';
import type { ActionItem, ColumnItem } from '@src/typings';
import { status } from '@src/use/use-status';

export default defineComponent({
  name: 'm-table',

  props: {
    data: {
      type: Object as PropType<ActListRes>,
      default: () => ({ data: [], fetch: true, errorMsg: '', total: 0 }),
    },
    config: {
      type: Array,
      default: () => [],
    },
  },

  emits: ['sort-change'],

  setup(props, { emit }) {
    const tableData = computed(() => props.data);
    const columns = computed(() => props.config);
    const isValidProp = (row: object, prop: string) => prop && prop in row;
    return {
      tableData,
      columns,
      statusTagType: [...status.statusTagType],

      // 统一处理表格项操作
      actionHandler: async (action: ActionItem, row: ActListItem) => {
        await action.handler?.(row);
        action.after?.();
      },
      // 展示数据格式化
      formatter: (item: ColumnItem, row: ActListItem) => {
        if (!isValidProp(row, item.prop)) {
          return '';
        }
        if (item.formatter) {
          try {
            return item.formatter(row[item.prop], row);
          } catch (e) {
            console.log((e as Error).message);
            return row[item.prop];
          }
        } else {
          return row[item.prop];
        }
      },

      // 排序
      sortChange: (column: { prop: string; order: string }) => {
        emit('sort-change', column);
      },
    };
  },
});
</script>

<style lang="scss">
.sub-table {
  margin-top: 10px;
  margin-bottom: 10px;

  th {
    background-color: #ffffff;
    color: #909399;
  }
}
</style>
