<template>
  <component
    :is="uiComponent.component"
    v-bind="uiProps"
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
  ></component>
</template>

<script setup lang="ts" name="TMPagination">
import { computed } from 'vue';

import { getConfig } from './config';

const props = defineProps<{
  layout?: string;
  hideOnSinglePage?: boolean;
  curPage?: number;
  pageSizes?: number[];
  pagesize?: number;
  total?: number;
}>();

const uiComponent = getConfig('components').pagination;

const uiProps = computed(() => uiComponent.props(props));

const emit = defineEmits(['size-change', 'current-change']);

const handleSizeChange = (...args: any[]) => {
  emit('size-change', ...args);
};
const handleCurrentChange = (...args: any[]) => {
  emit('current-change', ...args);
};
</script>
