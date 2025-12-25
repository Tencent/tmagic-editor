<template>
  <TMagicTooltip
    v-for="(action, actionIndex) in config.actions"
    :placement="action.tooltipPlacement || 'top'"
    :key="actionIndex"
    :disabled="!Boolean(action.tooltip)"
    :content="action.tooltip"
  >
    <TMagicButton
      v-show="display(action.display, row) && !editState[index]"
      class="action-btn"
      link
      size="small"
      :type="action.buttonType || 'primary'"
      :icon="action.icon"
      :disabled="disabled(action.disabled, row)"
      @click="actionHandler(action, row, index)"
      ><span v-html="formatter(action.text, row)"></span
    ></TMagicButton>
  </TMagicTooltip>

  <TMagicButton
    class="action-btn"
    v-show="editState[index]"
    link
    type="primary"
    size="small"
    @click="save(index, config)"
    >保存</TMagicButton
  >
  <TMagicButton
    class="action-btn"
    v-show="editState[index]"
    link
    type="danger"
    size="small"
    @click="cancel(index, config)"
    >取消</TMagicButton
  >
</template>

<script lang="ts" setup>
import { cloneDeep } from 'lodash-es';

import { TMagicButton, tMagicMessage, TMagicTooltip } from '@tmagic/design';

import { ColumnActionConfig, ColumnConfig } from './schema';

defineOptions({
  name: 'MTableActionsColumn',
});

const props = withDefaults(
  defineProps<{
    columns: ColumnConfig[];
    config: ColumnConfig;
    rowkeyName?: string;
    editState?: any;
    row: any;
    index: number;
  }>(),
  {
    columns: () => [],
    config: () => ({}),
    rowkeyName: 'c_id',
    editState: () => [],
  },
);

const emit = defineEmits<{
  'after-action': [{ index: number }];
  'after-action-cancel': [{ index: number }];
}>();

const display = (fuc: boolean | Function | undefined, row: any) => {
  if (typeof fuc === 'function') {
    return fuc(row);
  }
  if (typeof fuc === 'boolean') {
    return fuc;
  }
  return true;
};

const disabled = (fuc: boolean | Function | undefined, row: any) => {
  if (typeof fuc === 'function') {
    return fuc(row);
  }
  if (typeof fuc === 'boolean') {
    return fuc;
  }
  return false;
};

const formatter = (fuc: string | Function | undefined, row: any) => {
  if (typeof fuc === 'function') {
    return fuc(row);
  }
  return fuc;
};

const actionHandler = async (action: ColumnActionConfig, row: any, index: number) => {
  await action.before?.(row, index);
  if (action.type === 'edit') {
    props.editState[index] = cloneDeep(row);
  } else {
    await action.handler?.(row, index);
  }
  action.after?.(row, index);
};

const save = async (index: number, config: ColumnConfig) => {
  const action = config.actions?.find((item) => item.type === 'edit')?.action;
  if (!action) return;

  const res: any = await action({
    data: props.editState[index],
    index,
  });

  if (res) {
    if (res.ret === 0) {
      tMagicMessage.success('保存成功');
      props.editState[index] = undefined;
      emit('after-action', { index });
    } else {
      tMagicMessage.error(res.msg || '保存失败');
    }
  } else {
    props.editState[index] = undefined;
    emit('after-action', { index });
  }
};

const cancel = async (index: number, config: ColumnConfig) => {
  props.editState[index] = undefined;
  const cancel = config.actions?.find((item) => item.type === 'edit')?.cancel;
  if (cancel) {
    await cancel({ index });
  }
  emit('after-action-cancel', { index });
};
</script>
