<template>
  <TMagicCheckboxGroup v-model="model[name]" :size="size" :disabled="disabled" @change="changeHandler">
    <TMagicCheckbox v-for="option in options" :value="option.value" :key="option.value" :disabled="option.disabled"
      >{{ option.text }}
    </TMagicCheckbox>
  </TMagicCheckboxGroup>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';

import { TMagicCheckbox, TMagicCheckboxGroup } from '@tmagic/design';

import type { CheckboxGroupConfig, CheckboxGroupOption, FieldProps, FormState } from '../schema';
import { filterFunction } from '../utils/form';
import { useAddField } from '../utils/useAddField';

defineOptions({
  name: 'MFormCheckGroup',
});

const props = defineProps<FieldProps<CheckboxGroupConfig>>();

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
  if (typeof props.config.options === 'function')
    return filterFunction<CheckboxGroupOption[]>(mForm, props.config.options, props) || [];
  return [];
});
</script>
