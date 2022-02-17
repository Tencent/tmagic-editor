<template>
  <fieldset
    v-if="name ? model[name] : model"
    class="m-fieldset"
    :style="show ? 'padding: 15px 15px 0 5px;' : 'border: 0'"
  >
    <el-checkbox
      v-if="!show && name"
      v-model="model[name].value"
      :prop="`${prop}${prop ? '.' : ''}${config.name}.value`"
      :true-label="1"
      :false-label="0"
      @change="change"
      ><span v-html="config.legend"></span><span v-if="config.extra" v-html="config.extra" class="m-form-tip"></span
    ></el-checkbox>
    <legend v-else-if="config.checkbox && name">
      <el-checkbox
        v-model="model[name].value"
        :prop="`${prop}${prop ? '.' : ''}${config.name}.value`"
        :true-label="1"
        :false-label="0"
        @change="change"
        ><span v-html="config.legend"></span><span v-if="config.extra" v-html="config.extra" class="m-form-tip"></span
      ></el-checkbox>
    </legend>
    <legend v-else>
      <span v-html="config.legend"></span>
      <span v-if="config.extra" v-html="config.extra" class="m-form-tip"></span>
    </legend>

    <div v-if="config.schematic && show" style="display: flex">
      <div style="flex: 1">
        <m-form-container
          v-for="(item, index) in config.items"
          :key="key(item, index)"
          :model="name ? model[name] : model"
          :rules="name ? rules[name] : []"
          :config="item"
          :prop="prop"
          :labelWidth="lWidth"
          :size="size"
          @change="change"
        ></m-form-container>
      </div>

      <img class="m-form-schematic" :src="config.schematic" />
    </div>

    <template v-else-if="show">
      <m-form-container
        v-for="(item, index) in config.items"
        :key="key(item, index)"
        :model="name ? model[name] : model"
        :rules="name ? rules[name] : []"
        :config="item"
        :prop="prop"
        :labelWidth="lWidth"
        :size="size"
        @change="change"
      ></m-form-container>
    </template>
  </fieldset>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType } from 'vue';

import { FieldsetConfig, FormState } from '../schema';

export default defineComponent({
  name: 'm-form-fieldset',

  props: {
    labelWidth: String,

    model: {
      type: Object,
      default: () => ({}),
    },

    config: {
      type: Object as PropType<FieldsetConfig>,
      default: () => ({}),
    },

    rules: {
      type: Object,
      default: () => ({}),
    },

    prop: {
      type: String,
      default: () => '',
    },

    size: String,
  },

  emits: ['change'],

  setup(props, { emit }) {
    const mForm = inject<FormState | undefined>('mForm');

    const name = computed(() => props.config.name || '');

    const show = computed(() => {
      if (props.config.expand && name.value) {
        return props.model[name.value]?.value;
      }
      return true;
    });

    const lWidth = computed(() => {
      if (props.config.items) {
        return props.config.labelWidth || props.labelWidth;
      }
      return props.config.labelWidth || props.labelWidth || (props.config.text ? null : '0');
    });

    const change = () => {
      emit('change', props.model);
    };

    const key = (item: any, index: number) => item[mForm?.keyProp || '__key'] ?? index;

    return {
      show,
      name,
      mForm,
      lWidth,
      key,
      change,
    };
  },
});
</script>

<style lang="scss"></style>
