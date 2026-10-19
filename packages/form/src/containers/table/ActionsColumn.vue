<template>
  <slot name="operateCol" :scope="{ $index: index, row: row }"></slot>
  <TMagicTooltip
    v-if="config.dropSort && config.dropSortHandle"
    :content="actionButtonText(config.dropSortButtonConfig, 'dropSort')"
    placement="left-start"
  >
    <TMagicButton
      size="small"
      link
      :class="{ 'tmagic-form-table-drag-target': config.dropSortHandle }"
      :icon="config.dropActionButtonIcon || Sort"
      v-bind="config.dropSortButtonConfig?.props"
    >
    </TMagicButton>
  </TMagicTooltip>

  <TMagicButton
    v-show="showDelete(index + 1 + currentPage * pageSize - 1)"
    size="small"
    type="danger"
    link
    :title="actionButtonText(config.deleteButtonConfig, 'delete')"
    :icon="flat ? undefined : config.deleteActionButtonIcon || Delete"
    v-bind="config.deleteButtonConfig?.props"
    @click="removeHandler(index + 1 + currentPage * pageSize - 1)"
  >
    <template v-if="flat">{{ actionButtonText(config.deleteButtonConfig, 'delete') }}</template>
  </TMagicButton>

  <TMagicButton
    v-if="copyable(index + 1 + currentPage * pageSize - 1)"
    link
    size="small"
    type="primary"
    :title="actionButtonText(config.copyButtonConfig, 'copy')"
    :icon="flat ? undefined : config.copyActionButtonIcon || DocumentCopy"
    :disabled="disabled"
    v-bind="config.copyButtonConfig?.props"
    @click="copyHandler(index + 1 + currentPage * pageSize - 1)"
  >
    <template v-if="flat">{{ actionButtonText(config.copyButtonConfig, 'copy') }}</template>
  </TMagicButton>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { Delete, DocumentCopy, Sort } from '@element-plus/icons-vue';
import { cloneDeep } from 'lodash-es';

import { TMagicButton, TMagicTooltip } from '@tmagic/design';

import type { FormState, TableConfig } from '@form/schema';
import { actionButtonText } from '@form/utils/actionButton';

const emit = defineEmits(['change']);

const props = defineProps<{
  config: TableConfig;
  model: any;
  name: string | number;
  disabled?: boolean;
  currentPage: number;
  pageSize: number;
  index: number;
  row: any;
  prop?: string;
  sortKey?: string;
  flat?: boolean;
}>();

const mForm = inject<FormState | undefined>('mForm');

const removeHandler = (index: number) => {
  if (props.disabled) return;
  emit('change', props.model[props.name].toSpliced(index, 1));
};

const copyHandler = (index: number) => {
  let inputs = cloneDeep(props.model[props.name][index]);

  if (typeof props.config.copyHandler === 'function') {
    const modelName = props.name || props.config.name || '';
    inputs = props.config.copyHandler(mForm, {
      model: props.model[modelName],
      prop: props.prop,
      formValue: mForm?.values,
      inputs,
    });
  }

  const { length } = props.model[props.name];
  if (props.sortKey && length) {
    inputs[props.sortKey] = props.model[props.name][length - 1][props.sortKey] - 1;
  }

  emit('change', [...props.model[props.name], inputs], {
    changeRecords: [
      {
        propPath: `${props.prop}.${props.model[props.name].length}`,
        value: inputs,
      },
    ],
  });
};

// 希望支持单行可控制是否显示删除按钮，不会影响现有逻辑
const showDelete = (index: number) => {
  const deleteFunc = props.config.delete;
  if (deleteFunc && typeof deleteFunc === 'function') {
    return deleteFunc(props.model[props.name], index, mForm?.values);
  }
  return props.config.delete ?? true;
};

const copyable = (index: number) => {
  const copyableFunc = props.config.copyable;
  if (copyableFunc && typeof copyableFunc === 'function') {
    return copyableFunc(mForm, {
      values: mForm?.initValues || {},
      model: props.model,
      parent: mForm?.parentValues || {},
      formValue: mForm?.values || props.model,
      prop: props.prop,
      config: props.config,
      index,
    });
  }
  return props.config.copyable ?? true;
};
</script>
