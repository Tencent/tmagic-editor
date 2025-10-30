<template>
  <teleport to="body" :disabled="!isFullscreen">
    <div
      v-bind="$attrs"
      class="m-fields-table-wrap"
      :class="{ fixed: isFullscreen }"
      :style="isFullscreen ? `z-index: ${nextZIndex()}` : ''"
    >
      <div class="m-fields-table" :class="{ 'm-fields-table-item-extra': config.itemExtra }">
        <span v-if="config.extra" style="color: rgba(0, 0, 0, 0.45)" v-html="config.extra"></span>
        <TMagicTooltip content="拖拽可排序" placement="left-start" :disabled="config.dropSort !== true">
          <TMagicTable
            v-if="model[modelName]"
            ref="tMagicTable"
            style="width: 100%"
            show-header
            :row-key="config.rowKey || 'id'"
            :columns="columns"
            :data="data"
            :border="config.border"
            :max-height="config.maxHeight"
            :default-expand-all="true"
            :key="updateKey"
            @select="selectHandle"
            @sort-change="sortChangeHandler"
          ></TMagicTable>
        </TMagicTooltip>

        <slot></slot>

        <div style="display: flex; justify-content: space-between; margin: 10px 0">
          <div style="display: flex">
            <TMagicButton
              :icon="Grid"
              size="small"
              @click="toggleMode"
              v-if="enableToggleMode && config.enableToggleMode !== false && !isFullscreen"
              >展开配置</TMagicButton
            >
            <TMagicButton
              :icon="FullScreen"
              size="small"
              @click="toggleFullscreen"
              v-if="config.enableFullscreen !== false"
            >
              {{ isFullscreen ? '退出全屏' : '全屏编辑' }}
            </TMagicButton>
            <TMagicUpload
              v-if="importable"
              style="display: inline-block"
              ref="excelBtn"
              action="/noop"
              :disabled="disabled"
              :on-change="excelHandler"
              :auto-upload="false"
            >
              <TMagicButton size="small" type="success" :disabled="disabled" plain>导入EXCEL</TMagicButton>
            </TMagicUpload>
            <TMagicButton v-if="importable" size="small" type="warning" :disabled="disabled" plain @click="clearHandler"
              >清空</TMagicButton
            >
          </div>
          <TMagicButton v-if="addable" size="small" type="primary" :disabled="disabled" plain @click="newHandler()"
            >新增一行</TMagicButton
          >
        </div>

        <div class="bottom" style="text-align: right" v-if="config.pagination">
          <TMagicPagination
            layout="total, sizes, prev, pager, next, jumper"
            :hide-on-single-page="model[modelName].length < pageSize"
            :current-page="currentPage + 1"
            :page-sizes="[pageSize, 60, 120, 300]"
            :page-size="pageSize"
            :total="model[modelName].length"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          >
          </TMagicPagination>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';
import { FullScreen, Grid } from '@element-plus/icons-vue';

import { TMagicButton, TMagicPagination, TMagicTable, TMagicTooltip, TMagicUpload, useZIndex } from '@tmagic/design';

import type { SortProp } from '../schema';
import { sortChange } from '../utils/form';

import type { TableProps } from './type';
import { useAdd } from './useAdd';
import { useFullscreen } from './useFullscreen';
import { useImport } from './useImport';
import { usePagination } from './usePagination';
import { useSelection } from './useSelection';
import { useSortable } from './useSortable';
import { useTableColumns } from './useTableColumns';

defineOptions({
  name: 'MFormTable',
});

const props = withDefaults(defineProps<TableProps>(), {
  prop: '',
  sortKey: '',
  enableToggleMode: true,
  showIndex: true,
  lastValues: () => ({}),
  isCompare: false,
});

const emit = defineEmits(['change', 'select', 'addDiffCount']);

const modelName = computed(() => props.name || props.config.name || '');
const tMagicTableRef = useTemplateRef<InstanceType<typeof TMagicTable>>('tMagicTable');

const { pageSize, currentPage, paginationData, handleSizeChange, handleCurrentChange } = usePagination(
  props,
  modelName,
);

const { nextZIndex } = useZIndex();

const { addable, newHandler } = useAdd(props, emit);
const { columns } = useTableColumns(props, emit, currentPage, pageSize, modelName);
useSortable(props, emit, tMagicTableRef, modelName);
const { isFullscreen, toggleFullscreen } = useFullscreen();
const { importable, excelHandler, clearHandler } = useImport(props, emit, newHandler);
const { selectHandle, toggleRowSelection } = useSelection(props, emit, tMagicTableRef);

const updateKey = ref(1);

const data = computed(() => (props.config.pagination ? paginationData.value : props.model[modelName.value]));

const toggleMode = () => {
  const calcLabelWidth = (label: string) => {
    if (!label) return '0px';
    const zhLength = label.match(/[^\x00-\xff]/g)?.length || 0;
    const chLength = label.length - zhLength;
    return `${Math.max(chLength * 8 + zhLength * 20, 80)}px`;
  };

  // 切换为groupList的形式
  props.config.type = 'groupList';
  props.config.enableToggleMode = true;
  props.config.tableItems = props.config.items;
  props.config.items =
    props.config.groupItems ||
    props.config.items.map((item: any) => {
      const text = item.text || item.label;
      const labelWidth = calcLabelWidth(text);
      return {
        ...item,
        text,
        labelWidth,
        span: item.span || 12,
      };
    });
};

const sortChangeHandler = (sortOptions: SortProp) => {
  const modelName = props.name || props.config.name || '';
  sortChange(props.model[modelName], sortOptions);
};

defineExpose({
  toggleRowSelection,
});
</script>
