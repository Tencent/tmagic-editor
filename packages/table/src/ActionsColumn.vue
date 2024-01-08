<template>
  <TMagicTableColumn :label="config.label" :width="config.width" :fixed="config.fixed">
    <template v-slot="scope">
      <TMagicTooltip
        v-for="(action, actionIndex) in config.actions"
        :placement="action.tooltipPlacement || 'top'"
        :key="actionIndex"
        :disabled="!Boolean(action.tooltip)"
        :content="action.tooltip"
      >
        <TMagicButton
          v-show="display(action.display, scope.row) && !editState[scope.$index]"
          class="action-btn"
          link
          size="small"
          :type="action.buttonType || 'primary'"
          :icon="action.icon"
          @click="actionHandler(action, scope.row, scope.$index)"
          ><span v-html="formatter(action.text, scope.row)"></span
        ></TMagicButton>
      </TMagicTooltip>
      <TMagicButton
        class="action-btn"
        v-show="editState[scope.$index]"
        link
        type="primary"
        size="small"
        @click="save(scope.$index, config)"
        >保存</TMagicButton
      >
      <TMagicButton
        class="action-btn"
        v-show="editState[scope.$index]"
        link
        type="primary"
        size="small"
        @click="editState[scope.$index] = undefined"
        >取消</TMagicButton
      >
    </template>
  </TMagicTableColumn>
</template>

<script lang="ts" setup>
import { TMagicButton, tMagicMessage, TMagicTableColumn, TMagicTooltip } from '@tmagic/design';

import { ColumnActionConfig, ColumnConfig } from './schema';

defineOptions({
  name: 'MTableActionsColumn',
});

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

const emit = defineEmits(['after-action']);

const display = (fuc: boolean | Function | undefined, row: any) => {
  if (typeof fuc === 'function') {
    return fuc(row);
  }
  return true;
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
    props.editState[index] = row;
  } else {
    await action.handler?.(row, index);
  }
  action.after?.(row, index);
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
      emit('after-action');
    } else {
      tMagicMessage.error(res.msg || '保存失败');
    }
  } else {
    props.editState[index] = undefined;
    emit('after-action');
  }
};
</script>
