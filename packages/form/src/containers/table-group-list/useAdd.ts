import { computed, inject } from 'vue';

import { tMagicMessage } from '@tmagic/design';
import type { FormConfig, FormState, TableConfig, TableGroupListCommonConfig } from '@tmagic/form-schema';

import { applyMountValueEffects } from '@form/utils/collectFields';
import { initValue } from '@form/utils/form';

import type { TableProps } from '../table/type';

export const useAdd = (
  props: Pick<TableProps, 'name' | 'model' | 'prop' | 'sortKey'> & {
    config: Pick<TableGroupListCommonConfig, 'addable' | 'max' | 'beforeAddRow' | 'defaultAdd' | 'enum'> &
      Pick<TableConfig, 'key' | 'name'> & {
        items: { name?: string | number }[];
      };
  },
  emit: (event: 'change', ...args: any[]) => void,
) => {
  const mForm = inject<FormState | undefined>('mForm');

  const addable = computed(() => {
    const modelName = props.name || props.config.name || '';

    if (!modelName) return false;

    if (typeof props.config.addable === 'function') {
      return Boolean(
        props.config.addable(mForm, {
          model: props.model[modelName],
          formValue: mForm?.values,
          prop: props.prop,
          config: props.config,
        }),
      );
    }

    if (!props.model[modelName]?.length) {
      return true;
    }

    return typeof props.config.addable === 'undefined' ? true : Boolean(props.config.addable);
  });

  /**
   * 新增一项，返回新增后列表应有的长度；没有新增（超上限 / 被 beforeAddRow 拦下 / enum 用尽）返回 null。
   *
   * 只抛 change，不直接改 `props.model`：写回由 `MForm` 按 changeRecords 的 propPath 完成。
   * 返回长度是给调用方用的——新项要等写回后才出现在 DOM 里，靠它才能判断等到了没有。
   */
  const newHandler = async (row?: any): Promise<number | null> => {
    const modelName = `${props.name || props.config.name || ''}`;
    const list: any[] = Array.isArray(props.model[modelName]) ? props.model[modelName] : [];

    if (props.config.max && list.length >= props.config.max) {
      tMagicMessage.error(`最多新增配置不能超过${props.config.max}条`);
      return null;
    }

    if (typeof props.config.beforeAddRow === 'function') {
      const beforeCheckRes = await props.config.beforeAddRow(mForm, {
        model: list,
        formValue: mForm?.values,
        prop: props.prop,
      });
      if (!beforeCheckRes) return null;
    }

    const columns = props.config.items;
    const enumValues = props.config.enum || [];
    let enumV = [];
    const { length } = list;
    const key = props.config.key || 'id';
    let inputs: any = {};

    if (enumValues.length) {
      if (length >= enumValues.length) {
        return null;
      }
      enumV = enumValues.filter((item) => {
        let i = 0;
        for (; i < length; i++) {
          if (item[key] === list[i][key]) {
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
          model: list,
          prop: props.prop,
          formValue: mForm?.values,
        });
      } else if (props.config.defaultAdd) {
        inputs = props.config.defaultAdd;
      }

      inputs = await initValue(mForm, {
        config: columns as FormConfig,
        initValues: inputs,
      });
    }

    // enum / Excel 导入的数组行与默认新增共用同一份规整，字段组件不再在 setup 里改 model
    applyMountValueEffects(mForm, columns as FormConfig, inputs);

    if (props.sortKey && length) {
      inputs[props.sortKey] = list[length - 1][props.sortKey] - 1;
    }

    emit('change', [...list, inputs], {
      changeRecords: [
        {
          propPath: `${props.prop}.${length}`,
          value: inputs,
        },
      ],
    });
    return length + 1;
  };

  return {
    addable,
    newHandler,
  };
};
