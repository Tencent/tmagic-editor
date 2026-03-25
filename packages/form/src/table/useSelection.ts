import { inject, type ShallowRef } from 'vue';

import type { TMagicTable } from '@tmagic/design';
import type { FormState } from '@tmagic/form-schema';

import type { TableProps } from './type';

export const useSelection = (
  props: TableProps,
  emit: (event: 'select' | 'change' | 'addDiffCount', ...args: any[]) => void,
  tMagicTableRef: ShallowRef<InstanceType<typeof TMagicTable> | null>,
) => {
  const mForm = inject<FormState | undefined>('mForm');

  const selectHandle = (selection: any, row: any) => {
    if (typeof props.config.selection === 'string' && props.config.selection === 'single') {
      tMagicTableRef.value?.clearSelection();
      tMagicTableRef.value?.toggleRowSelection(row, true);
    }
    emit('select', selection, row);
    if (typeof props.config.onSelect === 'function') {
      props.config.onSelect(mForm, { selection, row, config: props.config });
    }
  };

  const toggleRowSelection = (row: any, selected: boolean) => {
    tMagicTableRef.value?.toggleRowSelection.call(tMagicTableRef.value?.getTableRef(), row, selected);
  };

  return {
    selectHandle,
    toggleRowSelection,
  };
};
