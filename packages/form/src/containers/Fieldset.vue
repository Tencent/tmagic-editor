<template>
  <fieldset
    v-if="name ? model[name] : model"
    class="m-fieldset"
    :style="show ? 'padding: 15px 15px 0 5px;' : 'border: 0'"
  >
    <component v-if="name && config.checkbox" :is="!show ? 'div' : 'legend'">
      <el-checkbox
        v-model="model[name].value"
        :prop="`${prop}${prop ? '.' : ''}${config.name}.value`"
        :true-label="1"
        :false-label="0"
        ><span v-html="config.legend"></span><span v-if="config.extra" v-html="config.extra" class="m-form-tip"></span
      ></el-checkbox>
    </component>
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

<script lang="ts" setup>
import { computed, inject, watch } from 'vue';

import { FieldsetConfig, FormState } from '../schema';

const props = withDefaults(
  defineProps<{
    labelWidth?: string;
    prop: string;
    size?: string;
    model: Record<string, any>;
    config: FieldsetConfig;
    rules?: any;
  }>(),
  {
    rules: {},
    prop: '',
  },
);

const emit = defineEmits(['change']);

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

if (props.config.checkbox && name.value) {
  watch(
    () => props.model[name.value]?.value,
    () => {
      emit('change', props.model);
    },
  );
}
</script>
