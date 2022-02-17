<template>
  <el-row :gutter="10">
    <el-col
      v-for="(col, index) in config.items"
      :style="!display(col) || col.type === 'hidden' ? 'display: none' : ''"
      :key="col[mForm?.keyProp || '__key'] ?? index"
      :span="col.span || config.span || 24 / config.items.length"
    >
      <m-form-container
        :model="name ? model[name] : model"
        :config="col"
        :prop="prop"
        :label-width="config.labelWidth || labelWidth"
        :expand-more="expandMore"
        :size="size"
        @change="changeHandler"
      ></m-form-container>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent, inject, PropType } from 'vue';

import { FormState, RowConfig } from '../schema';
import { display as displayFunction } from '../utils/form';

export default defineComponent({
  name: 'm-form-row',

  props: {
    labelWidth: String,
    expandMore: Boolean,

    model: {
      type: Object,
      default: () => ({}),
    },

    config: {
      type: Object as PropType<RowConfig>,
      default: () => ({}),
    },

    prop: String,

    name: String,

    size: String,
  },

  emits: ['change'],

  setup(props, { emit }) {
    const mForm = inject<FormState | undefined>('mForm');

    const changeHandler = () => emit('change', props.name ? props.model[props.name] : props.model);

    return {
      mForm,
      display(config: any) {
        return displayFunction(mForm, config.display, props);
      },
      changeHandler,
    };
  },
});
</script>
