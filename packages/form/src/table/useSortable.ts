import { inject, type Ref, type ShallowRef, watchEffect } from 'vue';
import Sortable, { type SortableEvent } from 'sortablejs';

import { type TMagicTable } from '@tmagic/design';
import type { FormState } from '@tmagic/form-schema';

import { sortArray } from '../utils/form';

import type { TableProps } from './type';

export const useSortable = (
  props: TableProps,
  emit: (event: 'select' | 'change' | 'addDiffCount', ...args: any[]) => void,
  tMagicTableRef: ShallowRef<InstanceType<typeof TMagicTable> | null>,
  modelName: Ref<string | number>,
) => {
  const mForm = inject<FormState | undefined>('mForm');

  let sortable: Sortable | undefined;
  const rowDrop = () => {
    sortable?.destroy();
    const tableEl = tMagicTableRef.value?.getEl();
    const tBodyEl = tableEl?.querySelector('.el-table__body > tbody');
    if (!tBodyEl) {
      return;
    }
    sortable = Sortable.create(tBodyEl, {
      draggable: '.tmagic-design-table-row',
      filter: 'input', // 表单组件选字操作和触发拖拽会冲突，优先保证选字操作
      preventOnFilter: false, // 允许选字
      direction: 'vertical',
      onEnd: ({ newIndex, oldIndex }: SortableEvent) => {
        if (typeof newIndex === 'undefined') return;
        if (typeof oldIndex === 'undefined') return;
        const newData = sortArray(props.model[modelName.value], newIndex, oldIndex, props.sortKey);

        emit('change', newData);
        mForm?.$emit('field-change', newData);
      },
    });
  };

  watchEffect(() => {
    if (props.config.dropSort) {
      rowDrop();
    }
  });
};
