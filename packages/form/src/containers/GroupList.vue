<template>
  <div class="m-fields-group-list">
    <div v-if="config.extra" v-html="config.extra" style="color: rgba(0, 0, 0, 0.45)"></div>
    <div v-if="!model[name] || !model[name].length" class="el-table__empty-block">
      <span class="el-table__empty-text t-table__empty">暂无数据</span>
    </div>

    <MFieldsGroupListItem
      v-else
      v-for="(item, index) in model[name]"
      :key="index"
      :model="item"
      :lastValues="getLastValues(lastValues?.[name], Number(index))"
      :is-compare="isCompare"
      :config="config"
      :prop="prop"
      :index="Number(index)"
      :label-width="labelWidth"
      :size="size"
      :disabled="disabled"
      :group-model="model[name]"
      @remove-item="removeHandler"
      @copy-item="copyHandler"
      @swap-item="swapHandler"
      @change="changeHandler"
      @addDiffCount="onAddDiffCount()"
    ></MFieldsGroupListItem>

    <div class="m-fields-group-list-footer">
      <slot name="toggle-button"></slot>
      <div style="display: flex; justify-content: flex-end; flex: 1">
        <slot name="add-button"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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

const getLastValues = (item: any, index: number) => item?.[index] || {};
</script>
