<template>
  <component
    class="tmagic-design-pagination"
    :is="uiComponent"
    v-bind="uiProps"
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
    @update:current-page="updateCurrentPage"
    @update:page-size="updatePageSize"
  ></component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getDesignConfig } from './config';
import type { PaginationProps } from './types';

defineOptions({
  name: 'TMPagination',
});

const props = defineProps<PaginationProps>();

const emit = defineEmits(['size-change', 'current-change', 'update:current-page', 'update:page-size']);

const ui = getDesignConfig('components')?.pagination;

const uiComponent = ui?.component || 'el-pagination';

const uiProps = computed<PaginationProps>(() => ui?.props(props) || props);

const handleSizeChange = (...args: any[]) => {
  emit('size-change', ...args);
};
const handleCurrentChange = (...args: any[]) => {
  emit('current-change', ...args);
};
const updateCurrentPage = (...args: any[]) => {
  emit('update:current-page', ...args);
};
const updatePageSize = (...args: any[]) => {
  emit('update:page-size', ...args);
};
</script>
