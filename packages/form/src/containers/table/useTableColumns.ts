import { computed, h, inject, type Ref } from 'vue';
import { WarningFilled } from '@element-plus/icons-vue';

import { type TableColumnOptions, TMagicIcon, TMagicTooltip } from '@tmagic/design';
import type { FormItemConfig, FormState } from '@tmagic/form-schema';

import type { ContainerChangeEventData } from '../../schema';
import { isGlobalFlat } from '../../utils/config';
import { appendProp, display as displayFunc, getDataByPage, sortArray } from '../../utils/form';
import { isTableColumnRendered, makeTableColumnConfig } from '../../utils/tableGroupList';
import Container from '../Container.vue';

import ActionsColumn from './ActionsColumn.vue';
import SortColumn from './SortColumn.vue';
import type { TableProps } from './type';

export const useTableColumns = (
  props: TableProps,
  emit: (event: 'select' | 'change' | 'addDiffCount', ...args: any[]) => void,
  currentPage: Ref<number>,
  pageSize: Ref<number>,
  modelName: Ref<string | number>,
) => {
  const mForm = inject<FormState | undefined>('mForm');

  const display = (fuc: any) => displayFunc(mForm, fuc, props);

  const lastData = computed(() =>
    props.config.pagination
      ? getDataByPage(props.lastValues[modelName.value], currentPage.value, pageSize.value)
      : props.lastValues[modelName.value] || [],
  );

  const itemExtra = (fuc: any, index: number) => {
    if (typeof fuc === 'function') {
      return fuc(mForm, {
        values: mForm?.initValues,
        model: props.model,
        formValue: mForm ? mForm.values : props.model,
        prop: props.prop,
        index,
      });
    }

    return fuc;
  };

  const titleTip = (fuc: any) => {
    if (typeof fuc === 'function') {
      return fuc(mForm, {
        values: mForm?.initValues,
        model: props.model,
        formValue: mForm ? mForm.values : props.model,
        prop: props.prop,
      });
    }

    return fuc;
  };

  const selection = computed(() => {
    if (typeof props.config.selection === 'function') {
      return props.config.selection(mForm, { model: props.model[modelName.value] });
    }
    return props.config.selection;
  });

  const getProp = (index: number) => appendProp(props.prop, index + currentPage.value * pageSize.value);

  const changeHandler = (v: any, eventData: ContainerChangeEventData) => {
    emit('change', props.model, eventData);
  };

  const onAddDiffCount = () => emit('addDiffCount');

  const columns = computed<TableColumnOptions[]>(() => {
    const columns: TableColumnOptions[] = [];

    if (props.config.itemExtra && !props.config.dropSort) {
      columns.push({
        props: {
          fixed: 'left',
          width: 30,
          type: 'expand',
        },
        cell: ({ $index }: any) =>
          h('span', {
            innerHTML: itemExtra(props.config.itemExtra, $index),
            class: 'm-form-tip',
          }),
      });
    }

    if (selection.value) {
      columns.push({
        props: {
          align: 'center',
          headerAlign: 'center',
          type: 'selection',
          width: 45,
        },
      });
    }
    const defaultFixed: 'left' | 'right' = isGlobalFlat.value ? 'right' : 'left';
    let actionFixed: 'left' | 'right' | undefined = props.config.fixed === false ? undefined : defaultFixed;
    if (typeof props.config.fixed === 'string' && ['left', 'right'].includes(props.config.fixed)) {
      actionFixed = props.config.fixed;
    }

    const actionFlat = props.config.flat === undefined && isGlobalFlat.value ? true : props.config.flat;

    const actionColumn = {
      props: {
        label: '操作',
        fixed: actionFixed,

        width: props.config.operateColWidth ?? (props.config.dropSortHandle && props.config.dropSort ? 132 : 112),
        align: 'center',
      },
      cell: ({ row, $index }: any) =>
        h(ActionsColumn, {
          row,
          flat: actionFlat,
          index: $index,
          model: props.model,
          config: props.config,
          prop: props.prop,
          disabled: props.disabled,
          sortKey: props.sortKey,
          name: modelName.value,
          currentPage: currentPage.value,
          pageSize: pageSize.value,
          onChange: (v: any) => {
            emit('change', v);
          },
        }),
    };

    if (actionFixed !== 'right') {
      columns.push(actionColumn);
    }

    if (props.sort && props.model[modelName.value] && props.model[modelName.value].length > 1) {
      columns.push({
        props: {
          label: '排序',
          width: 80,
        },
        cell: ({ $index }: any) =>
          h(SortColumn, {
            index: $index,
            model: props.model,
            disabled: props.disabled,
            name: modelName.value,
            currentPage: currentPage.value,
            pageSize: pageSize.value,
            onSwap: (index1: number, index2: number) => {
              const newData = sortArray(props.model[modelName.value], index1, index2, props.sortKey);
              emit('change', newData);
              mForm?.$emit('field-change', newData);
            },
          }),
      });
    }

    if (props.showIndex && props.config.showIndex) {
      columns.push({
        props: {
          label: '序号',
          width: 60,
        },
        cell: ({ $index }: any) => h('span', $index + 1 + currentPage.value * pageSize.value),
      });
    }

    for (const column of props.config.items) {
      if (isTableColumnRendered(column, display)) {
        const titleTipValue = titleTip(column.titleTip);

        columns.push({
          props: {
            prop: column.name,
            label: column.label || column.text,
            width: column.width,
            sortable: column.sortable,
            sortOrders: ['ascending', 'descending'],
            class: props.config.dropSort === true ? 'el-table__column--dropable' : '',
          },
          cell: ({ row, $index }: any) =>
            h(Container, {
              labelWidth: '0',
              disabled: props.disabled,
              prop: getProp($index),
              rules: column.rules,
              config: makeTableColumnConfig(column, row) as FormItemConfig,
              model: row,
              lastValues: lastData.value[$index],
              isCompare: props.isCompare,
              size: props.size,
              onChange: changeHandler,
              onAddDiffCount,
            }),
          title: titleTipValue
            ? () =>
                h(
                  TMagicTooltip,
                  { placement: 'top' },
                  {
                    default: () =>
                      h(
                        'span',
                        {
                          style: {
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          },
                        },
                        [
                          h('span', column.label || column.text),
                          h(TMagicIcon, {}, { default: () => h(WarningFilled) }),
                        ],
                      ),
                    content: () =>
                      h('div', {
                        innerHTML: titleTipValue,
                      }),
                  },
                )
            : undefined,
        });
      }
    }

    if (actionFixed === 'right') {
      columns.push(actionColumn);
    }

    return columns;
  });

  return {
    columns,
  };
};
