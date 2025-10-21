import { computed, inject, useTemplateRef } from 'vue';

import type { TMagicUpload } from '@tmagic/design';
import type { FormState } from '@tmagic/form-schema';
import { asyncLoadJs } from '@tmagic/utils';

import type { TableProps } from './type';

export const useImport = (
  props: TableProps,
  emit: (event: 'select' | 'change' | 'addDiffCount', ...args: any[]) => void,
  newHandler: (row: any) => void,
) => {
  const mForm = inject<FormState | undefined>('mForm');
  const modelName = computed(() => props.name || props.config.name || '');
  const importable = computed(() => {
    if (typeof props.config.importable === 'function') {
      return props.config.importable(mForm, {
        formValue: mForm?.values,
        model: props.model[modelName.value],
      });
    }
    return typeof props.config.importable === 'undefined' ? false : props.config.importable;
  });

  const excelBtn = useTemplateRef<InstanceType<typeof TMagicUpload>>('excelBtn');

  const excelHandler = async (file: any) => {
    if (!file?.raw) {
      return false;
    }

    if (!(globalThis as any).XLSX) {
      await asyncLoadJs('https://cdn.bootcdn.net/ajax/libs/xlsx/0.17.0/xlsx.full.min.js');
    }

    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result;
      const pdata = (globalThis as any).XLSX.read(data, { type: 'array' });
      pdata.SheetNames.forEach((sheetName: string) => {
        const arr = (globalThis as any).XLSX.utils.sheet_to_json(pdata.Sheets[sheetName], { header: 1 });
        if (arr?.[0]) {
          arr.forEach((row: any) => {
            newHandler(row);
          });
        }
        setTimeout(() => {
          excelBtn.value?.clearFiles();
        }, 300);
      });
    };
    reader.readAsArrayBuffer(file.raw);

    return false;
  };

  const clearHandler = () => {
    emit('change', []);
    mForm?.$emit('field-change', props.prop, props.model[modelName.value]);
  };

  return {
    importable,
    excelHandler,
    clearHandler,
  };
};
