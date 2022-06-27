<template>
  <div class="m-fields-group-list">
    <div v-if="config.extra" v-html="config.extra" style="color: rgba(0, 0, 0, 0.45)"></div>
    <div v-if="!model[name] || !model[name].length" class="el-table__empty-block">
      <span class="el-table__empty-text">暂无数据</span>
    </div>

    <m-fields-group-list-item
      v-else
      v-for="(item, index) in model[name]"
      :key="index"
      :model="item"
      :config="config"
      :prop="prop"
      :index="index"
      :label-width="labelWidth"
      :size="size"
      :group-model="model[name]"
      @remove-item="removeHandler"
      @swap-item="swapHandler"
      @change="changeHandler"
    ></m-fields-group-list-item>

    <el-button @click="addHandler" size="small" v-if="addable">添加组</el-button>

    <el-button icon="el-icon-s-grid" size="small" @click="toggleMode" v-if="config.enableToggleMode"
      >切换为表格</el-button
    >
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType } from 'vue';

import { FormState, GroupListConfig } from '../schema';
import { initValue } from '../utils/form';

import MFieldsGroupListItem from './GroupListItem.vue';

export default defineComponent({
  name: 'm-form-group-list',

  components: { MFieldsGroupListItem },

  props: {
    labelWidth: String,

    model: {
      type: Object,
      default: () => ({}),
    },

    config: {
      type: Object as PropType<GroupListConfig>,
      default: () => ({}),
    },

    prop: {
      type: String,
      default: '',
    },

    size: String,

    name: {
      type: String,
      default: '',
    },
  },

  emits: ['change'],

  setup(props, { emit }) {
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
    return {
      addable,
      toggleMode,
      removeHandler,
      swapHandler,
      changeHandler,
      addHandler,
    };
  },
});
</script>
