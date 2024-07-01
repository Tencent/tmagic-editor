<template>
  <div class="m-fields-group-list">
    <div v-if="config.extra" v-html="config.extra" style="color: rgba(0, 0, 0, 0.45)"></div>
    <div v-if="!model[name] || !model[name].length" class="el-table__empty-block">
      <span class="el-table__empty-text">暂无数据</span>
    </div>

    <MFieldsGroupListItem
      v-else
      v-for="(item, index) in model[name]"
      :key="index"
      :model="item"
      :lastValues="getLastValues(lastValues[name], index)"
      :is-compare="isCompare"
      :config="config"
      :prop="prop"
      :index="index"
      :label-width="labelWidth"
      :size="size"
      :disabled="disabled"
      :group-model="model[name]"
      @remove-item="removeHandler"
      @swap-item="swapHandler"
      @change="changeHandler"
      @addDiffCount="onAddDiffCount()"
    ></MFieldsGroupListItem>

    <TMagicButton @click="addHandler" size="small" :disabled="disabled" v-if="addable">新增</TMagicButton>

    <TMagicButton :icon="Grid" size="small" @click="toggleMode" v-if="config.enableToggleMode">切换为表格</TMagicButton>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { Grid } from '@element-plus/icons-vue';

import { TMagicButton } from '@tmagic/design';

import { FormState, GroupListConfig } from '../schema';
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

const emit = defineEmits(['change', 'addDiffCount']);

const mForm = inject<FormState | undefined>('mForm');

const addable = computed(() => {
  if (!props.name) return false;

  if (typeof props.config.addable === 'function') {
    return props.config.addable(mForm, {
      model: props.model[props.name],
      formValue: mForm?.values,
      prop: props.prop,
      config: props.config,
    });
  }

  return typeof props.config.addable === 'undefined' ? true : props.config.addable;
});

const changeHandler = () => {
  if (!props.name) return false;

  emit('change', props.model[props.name]);
};

const addHandler = async () => {
  if (!props.name) return false;

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
  changeHandler();
};

const removeHandler = (index: number) => {
  if (!props.name) return false;

  props.model[props.name].splice(index, 1);
  changeHandler();
};

const swapHandler = (idx1: number, idx2: number) => {
  if (!props.name) return false;

  const [currRow] = props.model[props.name].splice(idx1, 1);
  props.model[props.name].splice(idx2, 0, currRow);
  changeHandler();
};

const toggleMode = () => {
  props.config.type = 'table';
  props.config.groupItems = props.config.items;
  props.config.items = (props.config.tableItems ||
    props.config.items.map((item: any) => ({
      ...item,
      label: item.label || item.text,
      text: null,
    }))) as any;
};

const onAddDiffCount = () => emit('addDiffCount');

const getLastValues = (item: any, index: number) => item?.[index] || {};
</script>
