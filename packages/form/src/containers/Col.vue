<template>
  <el-col v-show="display && config.type !== 'hidden'" :span="span">
    <m-form-container
      :model="model"
      :config="config"
      :prop="prop"
      :label-width="config.labelWidth || labelWidth"
      :expand-more="expandMore"
      :size="size"
      @change="changeHandler"
    ></m-form-container>
  </el-col>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType } from 'vue';

import { ChildConfig, FormState } from '../schema';
import { display as displayFunction } from '../utils/form';

export default defineComponent({
  props: {
    labelWidth: String,
    expandMore: Boolean,
    span: Number,

    model: {
      type: Object,
      default: () => ({}),
    },

    config: {
      type: Object as PropType<ChildConfig>,
      default: () => ({}),
    },

    prop: String,

    size: String,
  },

  emits: ['change'],

  setup(props, { emit }) {
    const mForm = inject<FormState | undefined>('mForm');

    const changeHandler = () => emit('change', props.model);

    return {
      mForm,
      display: computed(() => displayFunction(mForm, props.config.display, props)),
      changeHandler,
    };
  },
});
</script>
