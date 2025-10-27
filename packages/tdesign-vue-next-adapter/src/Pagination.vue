<template>
  <TPagination
    :total="total"
    :current="curPage"
    :size="size === 'small' ? 'small' : 'medium'"
    :page-size="pageSize"
    :page-size-options="pageSizes"
    @current-change="handleCurrentChange"
    @page-size-change="handleSizeChange"
    @update:current="updateCurrentPage"
    @update:page-size="updatePageSize"
  ></TPagination>
</template>

<script setup lang="ts">
import { Pagination as TPagination } from 'tdesign-vue-next';

import type { PaginationProps } from '@tmagic/design';

defineOptions({
  name: 'TTDesignAdapterPagination',
});

defineProps<PaginationProps>();

const emit = defineEmits(['size-change', 'current-change', 'update:current-page', 'update:page-size']);

const handleCurrentChange = (...args: any[]) => {
  emit('current-change', ...args);
};

const handleSizeChange = (...args: any[]) => {
  emit('size-change', ...args);
};

const updateCurrentPage = (...args: any[]) => {
  emit('update:current-page', ...args);
};

const updatePageSize = (...args: any[]) => {
  emit('update:page-size', ...args);
};
</script>
