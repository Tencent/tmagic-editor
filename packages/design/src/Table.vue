<template>
  <component
    ref="table"
    :is="uiComponent.component"
    v-bind="uiProps"
    @select="selectHandler"
    @sort-change="sortChangeHandler"
  >
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { getConfig } from './config';

const props = withDefaults(
  defineProps<{
    data?: any[];
    border?: boolean;
    maxHeight?: number | string;
    defaultExpandAll?: boolean;
  }>(),
  {
    data: () => [],
  },
);

const uiComponent = getConfig('components').table;

const uiProps = computed(() => uiComponent.props(props));

const emit = defineEmits(['select', 'sort-change']);

const table = ref<any>();

const selectHandler = (...args: any[]) => {
  emit('select', ...args);
};

const sortChangeHandler = (...args: any[]) => {
  emit('sort-change', ...args);
};

defineExpose({
  $el: table.value?.$el,

  clearSelection(...args: any[]) {
    return table.value?.clearSelection(...args);
  },

  toggleRowSelection(...args: any[]) {
    return table.value?.toggleRowSelection(...args);
  },

  toggleRowExpansion(...args: any[]) {
    return table.value?.toggleRowExpansion(...args);
  },
});
</script>
