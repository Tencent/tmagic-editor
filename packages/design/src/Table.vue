<template>
  <component
    ref="table"
    :is="uiComponent.component"
    v-bind="uiProps"
    @select="selectHandler"
    @sort-change="sortChangeHandler"
    @expand-change="expandChangeHandler"
    @cell-click="cellClickHandler"
  >
    <slot></slot>
  </component>
</template>

<script setup lang="ts" name="TMTable">
import { computed, ref, watchEffect } from 'vue';

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

const emit = defineEmits(['select', 'sort-change', 'expand-change', 'cell-click']);

const table = ref<any>();

const selectHandler = (...args: any[]) => {
  emit('select', ...args);
};

const sortChangeHandler = (...args: any[]) => {
  emit('sort-change', ...args);
};

const expandChangeHandler = (...args: any[]) => {
  emit('expand-change', ...args);
};

const cellClickHandler = (...args: any[]) => {
  emit('cell-click', ...args);
};

let $el: HTMLDivElement | undefined;

watchEffect(() => {
  $el = table.value?.$el;
});

defineExpose({
  instance: table,

  $el,

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
