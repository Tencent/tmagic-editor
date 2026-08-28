<template>
  <MGroupList
    style="width: 100%"
    :config="config"
    :name="name"
    :disabled="disabled"
    :model="model"
    :last-values="lastValues"
    :prop="prop"
    :size="size"
    @change="changeHandler"
  ></MGroupList>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';

import type { DisplayCond } from '@tmagic/core';
import {
  type ContainerChangeEventData,
  type DisplayCondsConfig,
  type FieldProps,
  filterFunction,
  type FormState,
  MGroupList,
} from '@tmagic/form';

import { createDisplayCondsConfig } from '@editor/fields/configs/displayConds';

defineOptions({
  name: 'm-fields-display-conds',
});

const emit = defineEmits<{
  change: [value: DisplayCond[], eventData?: ContainerChangeEventData];
}>();

const props = withDefaults(defineProps<FieldProps<DisplayCondsConfig>>(), {
  disabled: false,
});

const mForm = inject<FormState | undefined>('mForm');

const parentFields = computed(() => filterFunction<string[]>(mForm, props.config.parentFields, props) || []);

const config = computed(() => createDisplayCondsConfig(props.config, props.name, parentFields.value));

const changeHandler = (v: DisplayCond[], eventData?: ContainerChangeEventData) => {
  if (!Array.isArray(props.model[props.name])) {
    props.model[props.name] = [];
  }

  emit('change', v, eventData);
};
</script>
