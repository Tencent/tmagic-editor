<template>
  <div class="m-fields-display-conds">
    <MGroupList
      :config="config"
      :name="name"
      :disabled="disabled"
      :model="model"
      :last-values="lastValues"
      :is-compare="isCompareMode"
      :prop="prop"
      :size="size"
      @change="changeHandler"
    ></MGroupList>
  </div>
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
  change: [value: DisplayCond | DisplayCond[], eventData?: ContainerChangeEventData];
}>();

const props = withDefaults(defineProps<FieldProps<DisplayCondsConfig>>(), {
  disabled: false,
});

const mForm = inject<FormState | undefined>('mForm');

const parentFields = computed(() => filterFunction<string[]>(mForm, props.config.parentFields, props) || []);

const config = computed(() => createDisplayCondsConfig(props.config, props.name, parentFields.value));

const isCompareMode = computed(() => Boolean(props.isCompare && props.lastValues));

const changeHandler = (v: DisplayCond[], eventData?: ContainerChangeEventData) => {
  emit('change', v, eventData);
};
</script>
