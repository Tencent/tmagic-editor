import { computed, inject } from 'vue';

import { tMagicMessage } from '@tmagic/design';
import type { FormState } from '@tmagic/form-schema';

import { initValue } from '../utils/form';

import type { TableProps } from './type';

export const useAdd = (
  props: TableProps,
  emit: (event: 'select' | 'change' | 'addDiffCount', ...args: any[]) => void,
) => {
  const mForm = inject<FormState | undefined>('mForm');

  const addable = computed(() => {
    const modelName = props.name || props.config.name || '';
    if (!props.model[modelName].length) {
      return true;
    }
    if (typeof props.config.addable === 'function') {
      return props.config.addable(mForm, {
        model: props.model[modelName],
        formValue: mForm?.values,
        prop: props.prop,
      });
    }
    return typeof props.config.addable === 'undefined' ? true : props.config.addable;
  });

  const newHandler = async (row?: any) => {
    const modelName = props.name || props.config.name || '';

    if (props.config.max && props.model[modelName].length >= props.config.max) {
      tMagicMessage.error(`最多新增配置不能超过${props.config.max}条`);
      return;
    }

    if (typeof props.config.beforeAddRow === 'function') {
      const beforeCheckRes = props.config.beforeAddRow(mForm, {
        model: props.model[modelName],
        formValue: mForm?.values,
        prop: props.prop,
      });
      if (!beforeCheckRes) return;
    }

    const columns = props.config.items;
    const enumValues = props.config.enum || [];
    let enumV = [];
    const { length } = props.model[modelName];
    const key = props.config.key || 'id';
    let inputs: any = {};

    if (enumValues.length) {
      if (length >= enumValues.length) {
        return;
      }
      enumV = enumValues.filter((item) => {
        let i = 0;
        for (; i < length; i++) {
          if (item[key] === props.model[modelName][i][key]) {
            break;
          }
        }
        return i === length;
      });

      if (enumV.length > 0) {
        // eslint-disable-next-line prefer-destructuring
        inputs = enumV[0];
      }
    } else if (Array.isArray(row)) {
      columns.forEach((column, index) => {
        column.name && (inputs[column.name] = row[index]);
      });
    } else {
      if (typeof props.config.defaultAdd === 'function') {
        inputs = await props.config.defaultAdd(mForm, {
          model: props.model[modelName],
          formValue: mForm?.values,
        });
      } else if (props.config.defaultAdd) {
        inputs = props.config.defaultAdd;
      }

      inputs = await initValue(mForm, {
        config: columns,
        initValues: inputs,
      });
    }

    if (props.sortKey && length) {
      inputs[props.sortKey] = props.model[modelName][length - 1][props.sortKey] - 1;
    }

    emit('change', [...props.model[modelName], inputs], {
      changeRecords: [
        {
          propPath: `${props.prop}.${props.model[modelName].length}`,
          value: inputs,
        },
      ],
    });
  };

  return {
    addable,
    newHandler,
  };
};
