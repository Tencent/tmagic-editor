import { computed, type Ref, ref } from 'vue';

import { getDataByPage } from '../utils/form';

import type { TableProps } from './type';

export const usePagination = (props: TableProps, modelName: Ref<string | number>) => {
  const pageSize = ref(10);
  /**
   * 当前页码
   */
  const currentPage = ref(0);

  const paginationData = computed(() => getDataByPage(props.model[modelName.value], currentPage.value, pageSize.value));
  const handleSizeChange = (val: number) => {
    pageSize.value = val;
  };

  const handleCurrentChange = (val: number) => {
    currentPage.value = val - 1;
  };

  return {
    pageSize,
    currentPage,
    paginationData,
    handleSizeChange,
    handleCurrentChange,
  };
};
