<template>
  <component
    class="tmagic-design-pagination"
    :is="uiComponent"
    v-bind="uiProps"
    @size-change="handleSizeChange"
    @page-size-change="handleSizeChange"
    @current-change="handleCurrentChange"
  ></component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getConfig } from './config';
import type { PaginationProps } from './types';

defineOptions({
  name: 'TMPagination',
});

const props = defineProps<PaginationProps>();

const emit = defineEmits(['size-change', 'current-change']);

const ui = getConfig('components')?.pagination;

const uiComponent = ui?.component || 'el-pagination';

const uiProps = computed(() => ui?.props(props) || props);

const handleSizeChange = (...args: any[]) => {
  emit('size-change', ...args);
};
const handleCurrentChange = (...args: any[]) => {
  emit('current-change', ...args);
};
</script>
