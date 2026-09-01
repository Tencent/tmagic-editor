<template>
  <div class="m-fields-group-list">
    <div v-if="config.extra" v-html="config.extra" style="color: rgba(0, 0, 0, 0.45)"></div>
    <div v-if="!displayItems.length" class="el-table__empty-block">
      <span class="el-table__empty-text t-table__empty">暂无{{ config.titlePrefix || '' }}数据</span>
    </div>

    <MFieldsGroupListItem
      v-else
      v-for="entry in displayItems"
      :key="entry.index"
      :model="entry.item"
      :lastValues="entry.last"
      :is-compare="isCompare"
      :config="config"
      :prop="prop"
      :index="entry.index"
      :label-width="labelWidth"
      :label-position="labelPosition"
      :size="size"
      :disabled="disabled"
      :group-model="currentList"
      @remove-item="removeHandler"
      @copy-item="copyHandler"
      @swap-item="swapHandler"
      @change="changeHandler"
      @addDiffCount="onAddDiffCount()"
    >
      <template #title="slotProps" v-if="$slots.title">
        <slot name="title" v-bind="slotProps"></slot>
      </template>
    </MFieldsGroupListItem>

    <div
      class="m-fields-group-list-footer"
      :class="{ 'is-sticky-full': Boolean(config.addButtonConfig?.sticky) }"
      v-if="!isCompare && ($slots['toggle-button'] || $slots['add-button'])"
    >
      <slot name="toggle-button"></slot>
      <div style="display: flex; justify-content: flex-end; flex: 1">
        <slot name="add-button"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { cloneDeep } from 'lodash-es';

import type { ContainerChangeEventData, GroupListConfig } from '../schema';

import MFieldsGroupListItem from './GroupListItem.vue';

defineOptions({
  name: 'MFormGroupList',
});

const props = defineProps<{
  model: any;
  lastValues?: any;
  isCompare?: boolean;
  config: GroupListConfig;
  name: string;
  labelWidth?: string;
  labelPosition?: 'top' | 'left' | 'right';
  prop?: string;
  size?: string;
  disabled?: boolean;
  showIndex?: boolean;
}>();

const emit = defineEmits<{
  change: [v: any, eventData?: ContainerChangeEventData];
  addDiffCount: [];
}>();

const changeHandler = (v: any, eventData: ContainerChangeEventData) => {
  emit('change', props.model, eventData);
};

const removeHandler = (index: number) => {
  if (!props.name) return false;

  props.model[props.name].splice(index, 1);
  emit('change', props.model[props.name]);
};

const copyHandler = (index: number) => {
  props.model[props.name].push(cloneDeep(props.model[props.name][index]));
};

const swapHandler = (idx1: number, idx2: number) => {
  if (!props.name) return false;

  const { length } = props.model[props.name];

  const [currRow] = props.model[props.name].splice(idx1, 1);
  props.model[props.name].splice(Math.min(Math.max(idx2, 0), length - 1), 0, currRow);
  emit('change', props.model[props.name]);
};

const onAddDiffCount = () => emit('addDiffCount');

const asList = (value: unknown): any[] => (Array.isArray(value) ? value : []);

const currentList = computed(() => asList(props.model[props.name]));

/** 对比时按当前/历史较长一侧对齐，已删除的项也能渲染出来 */
const displayItems = computed(() => {
  const current = currentList.value;

  if (!props.isCompare) {
    return current.map((item, index) => ({ item: item ?? {}, last: {}, index }));
  }

  const last = asList(props.lastValues?.[props.name]);

  return Array.from({ length: Math.max(current.length, last.length) }, (_, index) => ({
    item: current[index] ?? {},
    last: last[index] ?? {},
    index,
  }));
});
</script>
