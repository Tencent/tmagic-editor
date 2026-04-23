<template>
  <component
    :is="displayMode === 'table' ? MFormTable : MFormGroupList"
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
    @change="onChange"
    @select="onSelect"
    @addDiffCount="onAddDiffCount"
  >
    <template #toggle-button>
      <TMagicButton v-if="config.enableToggleMode !== false" :icon="Grid" size="small" @click="toggleDisplayMode">
        {{ displayMode === 'table' ? '展开配置' : '切换为表格' }}
      </TMagicButton>
    </template>

    <template #add-button="{ trigger }">
      <TMagicButton
        v-if="addable"
        :class="displayMode === 'table' ? 'm-form-table-add-button' : ''"
        :size="addButtonSize"
        :plain="displayMode === 'table'"
        :icon="Plus"
        :disabled="disabled"
        v-bind="currentConfig.addButtonConfig?.props || { type: 'primary' }"
        @click="trigger"
      >
        {{ currentConfig.addButtonConfig?.text || (displayMode === 'table' ? '新增一行' : '新增') }}
      </TMagicButton>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import { Grid, Plus } from '@element-plus/icons-vue';

import { TMagicButton } from '@tmagic/design';
import type { FormState, GroupListConfig, TableConfig } from '@tmagic/form-schema';

import type { ContainerChangeEventData } from '../schema';
import MFormTable from '../table/Table.vue';

import MFormGroupList from './GroupList.vue';

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
}>();

const emit = defineEmits(['change', 'select', 'addDiffCount']);

const mForm = inject<FormState | undefined>('mForm');

const addable = computed(() => {
  const modelName = props.name || props.config.name || '';

  if (!modelName) return false;

  if (!props.model[modelName].length) {
    return true;
  }

  if (typeof props.config.addable === 'function') {
    return props.config.addable(mForm, {
      model: props.model[modelName],
      formValue: mForm?.values,
      prop: props.prop,
      config: props.config,
    });
  }

  return typeof props.config.addable === 'undefined' ? true : props.config.addable;
});

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
</script>
