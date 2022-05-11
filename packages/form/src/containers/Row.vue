<template>
  <el-row :gutter="10">
    <Col
      v-for="(col, index) in config.items"
      :key="col[mForm?.keyProp || '__key'] ?? index"
      :span="col.span || config.span || 24 / config.items.length"
      :config="col"
      :labelWidth="config.labelWidth || labelWidth"
      :expandMore="expandMore"
      :model="name ? model[name] : model"
      :prop="prop"
      :size="size"
      @change="changeHandler"
    />
  </el-row>
</template>

<script lang="ts">
import { defineComponent, inject, PropType } from 'vue';

import { FormState, RowConfig } from '../schema';

import Col from './Col.vue';

export default defineComponent({
  name: 'm-form-row',

  components: { Col },

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
      changeHandler,
    };
  },
});
</script>
