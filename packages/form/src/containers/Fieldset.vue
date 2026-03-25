<template>
  <fieldset v-if="name ? model[name] : model" class="m-fieldset" :style="show ? 'padding: 15px' : 'border: 0'">
    <component v-if="name && config.checkbox" :is="!show ? 'div' : 'legend'">
      <TMagicCheckbox
        :model-value="(name ? model[name] : model)[checkboxName]"
        :prop="`${prop}${prop ? '.' : ''}${config.name}.${checkboxName}`"
        :true-value="checkboxTrueValue"
        :false-value="checkboxFalseValue"
        @update:modelValue="valueChangeHandler"
        ><span v-html="config.legend"></span><span v-if="config.extra" v-html="config.extra" class="m-form-tip"></span
      ></TMagicCheckbox>
    </component>
    <legend v-else>
      <span v-html="config.legend"></span>
      <span v-if="config.extra" v-html="config.extra" class="m-form-tip"></span>
    </legend>

    <div v-if="config.schematic && show" style="display: flex">
      <div style="flex: 1">
        <Container
          v-for="(item, index) in config.items"
          :key="key(item, index)"
          :model="name ? model[name] : model"
          :lastValues="name ? lastValues[name] : lastValues"
          :is-compare="isCompare"
          :rules="name ? rules[name] : []"
          :config="item"
          :prop="prop"
          :disabled="disabled"
          :labelWidth="lWidth"
          :size="size"
          @change="changeHandler"
          @add-diff-count="onAddDiffCount()"
        ></Container>
      </div>

      <img class="m-form-schematic" :src="config.schematic" />
    </div>

    <template v-else-if="show">
      <Container
        v-for="(item, index) in config.items"
        :key="key(item, index)"
        :model="name ? model[name] : model"
        :lastValues="name ? lastValues[name] : lastValues"
        :is-compare="isCompare"
        :rules="name ? rules[name] : []"
        :config="item"
        :prop="prop"
        :labelWidth="lWidth"
        :size="size"
        :disabled="disabled"
        @change="changeHandler"
        @addDiffCount="onAddDiffCount()"
      ></Container>
    </template>
  </fieldset>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';

import { TMagicCheckbox } from '@tmagic/design';

import { ContainerChangeEventData, FieldsetConfig, FormState } from '../schema';

import Container from './Container.vue';

defineOptions({
  name: 'MFormFieldset',
});

const props = withDefaults(
  defineProps<{
    labelWidth?: string;
    prop: string;
    size?: string;
    model: Record<string, any>;
    lastValues?: Record<string, any>;
    isCompare?: boolean;
    config: FieldsetConfig;
    rules?: any;
    disabled?: boolean;
  }>(),
  {
    rules: {},
    prop: '',
    lastValues: () => ({}),
    isCompare: false,
  },
);

const emit = defineEmits<{
  change: [v: any, eventData: ContainerChangeEventData];
  addDiffCount: [];
}>();

const mForm = inject<FormState | undefined>('mForm');

const name = computed(() => props.config.name || '');

const checkboxName = computed(() => {
  if (typeof props.config.checkbox === 'object' && typeof props.config.checkbox.name === 'string') {
    return props.config.checkbox.name;
  }

  return 'value';
});

const checkboxTrueValue = computed(() => {
  if (typeof props.config.checkbox === 'object' && typeof props.config.checkbox.trueValue !== 'undefined') {
    return props.config.checkbox.trueValue;
  }

  return 1;
});

const checkboxFalseValue = computed(() => {
  if (typeof props.config.checkbox === 'object' && typeof props.config.checkbox.falseValue !== 'undefined') {
    return props.config.checkbox.falseValue;
  }

  return 0;
});

const show = computed(() => {
  if (props.config.expand && checkboxName.value) {
    return (name.value ? props.model[name.value] : props.model)?.[checkboxName.value] === checkboxTrueValue.value;
  }
  return true;
});

const lWidth = computed(() => {
  if (props.config.items) {
    return props.config.labelWidth || props.labelWidth;
  }
  return props.config.labelWidth || props.labelWidth || (props.config.text ? undefined : '0');
});

const valueChangeHandler = (value: number | boolean) => {
  emit('change', value, { modifyKey: checkboxName.value });
};

const changeHandler = (v: any, eventData: ContainerChangeEventData) => emit('change', v, eventData);

const key = (item: any, index: number) => item[mForm?.keyProp || '__key'] ?? index;

const onAddDiffCount = () => emit('addDiffCount');
</script>
