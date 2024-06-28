<template>
  <TMagicSelect
    v-model="model[name]"
    clearable
    filterable
    :size="size"
    :disabled="disabled"
    @change="fieldChangeHandler"
  >
    <component
      v-for="option in options"
      class="tmagic-design-option"
      :key="option.value"
      :is="optionComponent?.component || 'el-option'"
      v-bind="
        optionComponent?.props({
          label: option.text,
          value: option.value,
        }) || {
          label: option.text,
          value: option.value,
        }
      "
    >
    </component>
  </TMagicSelect>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';

import { getConfig as getDesignConfig, TMagicSelect } from '@tmagic/design';
import type { FieldProps } from '@tmagic/form';

import type { CondOpSelectConfig, Services } from '@editor/type';
import { arrayOptions, eqOptions, numberOptions } from '@editor/utils';

defineOptions({
  name: 'MFieldsCondOpSelect',
});

const emit = defineEmits(['change']);
const { dataSourceService } = inject<Services>('services') || {};

const props = defineProps<FieldProps<CondOpSelectConfig>>();

const optionComponent = getDesignConfig('components')?.option;

const options = computed(() => {
  const [id, ...fieldNames] = [...(props.config.parentFields || []), ...props.model.field];

  const ds = dataSourceService?.getDataSourceById(id);

  let fields = ds?.fields || [];
  let type = '';
  (fieldNames || []).forEach((fieldName: string) => {
    const field = fields.find((f) => f.name === fieldName);
    fields = field?.fields || [];
    type = field?.type || '';
  });

  if (type === 'array') {
    return arrayOptions;
  }

  if (type === 'boolean') {
    return [
      { text: '是', value: 'is' },
      { text: '不是', value: 'not' },
    ];
  }

  if (type === 'number') {
    return [...eqOptions, ...numberOptions];
  }

  if (type === 'string') {
    return [...arrayOptions, ...eqOptions];
  }

  return [...arrayOptions, ...eqOptions, ...numberOptions];
});

const fieldChangeHandler = (v: string[]) => {
  emit('change', v);
};
</script>
