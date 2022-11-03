<template>
  <TMagicCheckboxGroup v-model="model[name]" :size="size" :disabled="disabled" @change="changeHandler">
    <TMagicCheckbox v-for="option in options" :label="option.value" :key="option.value" :disabled="option.disabled"
      >{{ option.text }}
    </TMagicCheckbox>
  </TMagicCheckboxGroup>
</template>

<script lang="ts" setup name="MFormCheckGroup">
import { computed, inject } from 'vue';

import { TMagicCheckbox, TMagicCheckboxGroup } from '@tmagic/design';

import { CheckboxGroupConfig, FormState } from '../schema';
import { useAddField } from '../utils/useAddField';
import { filterFunction } from '..';

const props = defineProps<{
  config: CheckboxGroupConfig;
  model: any;
  initValues?: any;
  values?: any;
  name: string;
  prop: string;
  disabled?: boolean;
  size: 'mini' | 'small' | 'medium';
}>();

const emit = defineEmits(['change']);

useAddField(props.prop);

// 初始化选项
if (props.model && !props.model[props.name]) {
  props.model[props.name] = [];
}

const changeHandler = (v: Array<string | number | boolean>) => {
  emit('change', v);
};

const mForm = inject<FormState | undefined>('mForm');
const options = computed(() => {
  if (Array.isArray(props.config.options)) return props.config.options;
  if (typeof props.config.options === 'function') return filterFunction(mForm, props.config.options, props);
  return [];
});
</script>
