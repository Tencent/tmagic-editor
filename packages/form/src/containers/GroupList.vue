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
        <slot name="add-button" :trigger="addHandler"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { cloneDeep } from 'lodash-es';

import { tMagicMessage } from '@tmagic/design';

import type { ContainerChangeEventData, FormState, GroupListConfig } from '../schema';
import { initValue } from '../utils/form';

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
}>();

const emit = defineEmits<{
  change: [v: any, eventData?: ContainerChangeEventData];
  addDiffCount: [];
}>();

const mForm = inject<FormState | undefined>('mForm');

const changeHandler = (v: any, eventData: ContainerChangeEventData) => {
  emit('change', props.model, eventData);
};

const addHandler = async () => {
  if (!props.name) return false;

  if (props.config.max && props.model[props.name].length >= props.config.max) {
    tMagicMessage.error(`最多新增配置不能超过${props.config.max}条`);
    return;
  }

  if (typeof props.config.beforeAddRow === 'function') {
    const beforeCheckRes = await props.config.beforeAddRow(mForm, {
      model: props.model[props.name],
      formValue: mForm?.values,
      prop: props.prop,
    });
    if (!beforeCheckRes) return;
  }

  let initValues = {};

  if (typeof props.config.defaultAdd === 'function') {
    initValues = await props.config.defaultAdd(mForm, {
      model: props.model[props.name],
      formValue: mForm?.values,
      prop: props.prop,
      config: props.config,
    });
  } else if (props.config.defaultAdd) {
    initValues = props.config.defaultAdd;
  }

  const groupValue = await initValue(mForm, {
    config: props.config.items,
    initValues,
  });

  props.model[props.name].push(groupValue);

  emit('change', props.model[props.name], {
    changeRecords: [
      {
        propPath: `${props.prop}.${props.model[props.name].length - 1}`,
        value: groupValue,
      },
    ],
  });
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
