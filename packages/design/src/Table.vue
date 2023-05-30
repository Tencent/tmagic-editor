<template>
  <component
    class="tmagic-design-table"
    ref="table"
    :is="uiComponent"
    v-bind="uiProps"
    @select="selectHandler"
    @sort-change="sortChangeHandler"
    @expand-change="expandChangeHandler"
    @cell-click="cellClickHandler"
  >
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';

import { getConfig } from './config';
import type { TableProps } from './types';

defineOptions({
  name: 'TMTable',
});

const props = withDefaults(defineProps<TableProps>(), {
  data: () => [],
});

const ui = getConfig('components')?.table;

const uiComponent = ui?.component || 'el-table';

const uiProps = computed(() => ui?.props(props) || props);

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
