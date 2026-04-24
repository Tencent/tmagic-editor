<template>
  <component
    :is="displayMode === 'table' ? MFormTable : MFormGroupList"
    ref="tableGroupList"
    v-bind="$attrs"
    :model="model"
    :name="`${name}`"
    :config="currentConfig"
    :disabled="disabled"
    :size="size"
    :is-compare="isCompare"
    :last-values="lastValues"
    :prop="prop"
    :label-width="labelWidth"
    :show-index="showIndex"
    :sort-key="sortKey"
    :sort="sort"
    @change="onChange"
    @select="onSelect"
    @addDiffCount="onAddDiffCount"
    @add="onAdd"
  >
    <template #toggle-button>
      <TMagicButton
        v-if="config.enableToggleMode || enableToggleMode"
        :icon="Grid"
        size="small"
        @click="toggleDisplayMode"
      >
        {{ displayMode === 'table' ? '展开配置' : '切换为表格' }}
      </TMagicButton>
    </template>

    <template #add-button v-if="addable">
      <TMagicButton
        :class="displayMode === 'table' ? 'm-form-table-add-button' : ''"
        :size="addButtonSize"
        :plain="displayMode === 'table'"
        :icon="Plus"
        :disabled="disabled"
        v-bind="currentConfig.addButtonConfig?.props || { type: 'primary' }"
        @click="newHandler"
      >
        {{ currentConfig.addButtonConfig?.text || (displayMode === 'table' ? '新增一行' : '新增') }}
      </TMagicButton>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';
import { Grid, Plus } from '@element-plus/icons-vue';

import { TMagicButton } from '@tmagic/design';
import type { GroupListConfig, TableConfig } from '@tmagic/form-schema';

import type { ContainerChangeEventData } from '../../schema';
import MFormGroupList from '../GroupList.vue';
import MFormTable from '../table/Table.vue';

import { useAdd } from './useAdd';

defineOptions({
  name: 'MFormTableGroupList',
  inheritAttrs: false,
});

const props = defineProps<{
  model: any;
  lastValues?: any;
  isCompare?: boolean;
  config: TableConfig | GroupListConfig;
  name: string;
  prop?: string;
  labelWidth?: string;
  disabled?: boolean;
  size?: string;
  enableToggleMode?: true;
  showIndex?: boolean;
  sortKey?: string;
  sort?: boolean;
}>();

const emit = defineEmits(['change', 'select', 'addDiffCount']);

const { addable, newHandler } = useAdd(props, emit);

const isGroupListType = (type: string | undefined) => type === 'groupList' || type === 'group-list';

const displayMode = ref<'table' | 'groupList'>(isGroupListType(props.config.type) ? 'groupList' : 'table');

const calcLabelWidth = (label: string) => {
  if (!label) return '0px';
  const zhLength = label.match(/[^\x00-\xff]/g)?.length || 0;
  const chLength = label.length - zhLength;
  return `${Math.max(chLength * 8 + zhLength * 20, 80)}px`;
};

// 当原始 config 是 table 形态时，table 模式直接透传；
// 若原始是 groupList，则基于它派生出 table 所需的 config
const tableConfig = computed<TableConfig>(() => {
  if (!isGroupListType(props.config.type)) {
    return props.config as TableConfig;
  }

  const source = props.config as GroupListConfig;
  return {
    ...props.config,
    type: 'table',
    groupItems: source.items,
    items:
      source.tableItems ||
      (source.items as any[]).map((item: any) => ({
        ...item,
        label: item.label || item.text,
        text: null,
      })),
  } as any as TableConfig;
});

// 反向派生 groupList 所需的 config
const groupListConfig = computed<GroupListConfig>(() => {
  if (isGroupListType(props.config.type)) {
    return props.config as GroupListConfig;
  }

  const source = props.config as TableConfig;
  return {
    ...props.config,
    type: 'groupList',
    tableItems: source.items,
    items:
      source.groupItems ||
      (source.items as any[]).map((item: any) => {
        const text = item.text || item.label;
        return {
          ...item,
          text,
          labelWidth: calcLabelWidth(text),
          span: item.span || 12,
        };
      }),
  } as any as GroupListConfig;
});

// 运行时类型由 displayMode 决定，`<component :is>` 无法做联合类型收窄，统一转 any 交给子组件处理
const currentConfig = computed<any>(() => (displayMode.value === 'table' ? tableConfig.value : groupListConfig.value));

// 保持原 Table/GroupList 模式下新增按钮的不同尺寸策略
const addButtonSize = computed(() => {
  if (displayMode.value === 'table') return 'small';
  return props.config.enableToggleMode !== false ? 'small' : 'default';
});

const toggleDisplayMode = () => {
  displayMode.value = displayMode.value === 'table' ? 'groupList' : 'table';
};

const onChange = (v: any, eventData?: ContainerChangeEventData) => emit('change', v, eventData);
const onSelect = (...args: any[]) => emit('select', ...args);
const onAddDiffCount = () => emit('addDiffCount');
const onAdd = (rows: any[]) => {
  rows.forEach((row: any) => {
    newHandler(row);
  });
};

const tableGroupListRef = useTemplateRef<InstanceType<typeof MFormTable>>('tableGroupList');

defineExpose({
  toggleRowSelection: (row: any, selected: boolean) => tableGroupListRef.value?.toggleRowSelection?.(row, selected),
});
</script>
