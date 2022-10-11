<template>
  <TMagicTableColumn :label="config.label" :width="config.width" :fixed="config.fixed">
    <template v-slot="scope">
      <TMagicButton
        v-for="(action, actionIndex) in config.actions"
        v-show="display(action.display, scope.row) && !editState[scope.$index]"
        v-html="action.text"
        class="action-btn"
        text
        type="primary"
        size="small"
        :key="actionIndex"
        @click="actionHandler(action, scope.row, scope.$index)"
      ></TMagicButton>
      <TMagicButton
        class="action-btn"
        v-show="editState[scope.$index]"
        text
        type="primary"
        size="small"
        @click="save(scope.$index, config)"
        >保存</TMagicButton
      >
      <TMagicButton
        class="action-btn"
        v-show="editState[scope.$index]"
        text
        type="primary"
        size="small"
        @click="editState[scope.$index] = undefined"
        >取消</TMagicButton
      >
    </template>
  </TMagicTableColumn>
</template>

<script lang="ts" setup>
import { TMagicButton, tMagicMessage, tMagicMessageBox, TMagicTableColumn } from '@tmagic/design';

import { ColumnActionConfig, ColumnConfig } from './schema';

const props = withDefaults(
  defineProps<{
    columns: any[];
    config: ColumnConfig;
    rowkeyName?: string;
    editState?: any;
  }>(),
  {
    columns: () => [],
    config: () => ({}),
    rowkeyName: 'c_id',
    editState: () => [],
  },
);

const emit = defineEmits(['afterAction']);

const display = (fuc: boolean | Function | undefined, row: any) => {
  if (typeof fuc === 'function') {
    return fuc(row);
  }
  return true;
};

const success = (msg: string, action: ColumnActionConfig, row: any) => {
  tMagicMessage.success(msg);
  action.after?.(row);
};

const error = (msg: string) => tMagicMessage.error(msg);

const deleteAction = async (action: ColumnActionConfig, row: any) => {
  await tMagicMessageBox.confirm(`确认删除${row[action.name || 'c_name']}(${row[props.rowkeyName]})?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  });

  const res = await action.handler?.(row);

  if (res.ret === 0) {
    success('删除成功!', action, row);
  } else {
    error(res.msg || '删除失败');
  }
};

const copyHandler = async (action: ColumnActionConfig, row: any) => {
  await tMagicMessageBox.confirm(`确定复制${row[action.name || 'c_name']}(${row.c_id})?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  });

  try {
    const res = await action.handler?.(row);

    if (res.ret === 0) {
      success('复制成功!', action, row);
    } else {
      error(`复制失败!${res.msg}`);
    }
  } catch (e) {
    error('复制失败!');
  }
};

const actionHandler = async (action: ColumnActionConfig, row: any, index: number) => {
  await action.before?.(row);
  if (action.type === 'delete') {
    await deleteAction(action, row);
  } else if (action.type === 'copy') {
    await copyHandler(action, row);
  } else if (action.type === 'edit') {
    props.editState[index] = row;
  } else {
    await action.handler?.(row);
  }
  action.after?.(row);
};

const save = async (index: number, config: ColumnConfig) => {
  const action = config.actions?.find((item) => item.type === 'edit')?.action;
  if (!action) return;

  const data: any = {};
  const row = props.editState[index];
  props.columns
    .filter((item) => item.type)
    .forEach((column) => {
      data[column.prop] = row[column.prop];
    });

  const res: any = await action({
    data,
  });

  if (res) {
    if (res.ret === 0) {
      tMagicMessage.success('保存成功');
      props.editState[index] = undefined;
      emit('afterAction');
    } else {
      tMagicMessage.error(res.msg || '保存失败');
    }
  } else {
    props.editState[index] = undefined;
    emit('afterAction');
  }
};
</script>
