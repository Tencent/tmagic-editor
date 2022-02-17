<template>
  <div>
    <el-steps :active="active" align-center :space="config.space">
      <el-step
        v-for="(item, index) in config.items"
        :key="item.__key"
        :title="item.title"
        :active="active"
        @click="stepClick(index)"
      ></el-step>
    </el-steps>

    <template v-for="(step, index) in config.items">
      <template v-for="item in step.items">
        <m-form-container
          v-if="item"
          v-show="active - 1 === index"
          :key="item[mForm?.keyProp || '__key']"
          :config="item"
          :model="step.name ? model[step.name] : model"
          :prop="step.name"
          :size="size"
          :label-width="config.labelWidth || labelWidth"
          @change="changeHandler"
        ></m-form-container>
      </template>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, PropType, ref, watchEffect } from 'vue';

import { FormState, StepConfig } from '../schema';

export default defineComponent({
  name: 'm-form-step',

  props: {
    model: {
      type: Object,
      default: () => ({}),
    },

    config: {
      type: Object as PropType<StepConfig>,
      default: () => ({}),
    },

    stepActive: {
      type: Number,
      default: () => 1,
    },

    size: String,

    labelWidth: String,
  },

  emits: ['change'],

  setup(props, { emit }) {
    const mForm = inject<FormState | undefined>('mForm');
    const active = ref(1);

    watchEffect(() => {
      active.value = props.stepActive;
    });

    const stepClick = (index: number) => {
      active.value = index + 1;
      mForm?.$emit('update:stepActive', active.value);
    };

    const changeHandler = () => {
      emit('change', props.model);
    };

    return { mForm, active, stepClick, changeHandler };
  },
});
</script>
