<template>
  <template v-for="(action, actionIndex) in config.actions" :key="actionIndex">
    <TMagicPopconfirm
      v-if="action.popconfirm"
      placement="top"
      :width="action.popconfirmWidth"
      :title="formatter(action.confirmText, row) || '确定执行此操作？'"
      @confirm="actionHandler(action, row, index)"
    >
      <template #reference>
        <ActionButton
          :action="action"
          :row="row"
          :index="index"
          :visible="display(action.display, row) && !editState[index]"
        />
      </template>
    </TMagicPopconfirm>

    <TMagicPopover
      v-else-if="action.type === 'sub-actions'"
      trigger="click"
      :placement="action.subActionConfig?.placement || 'bottom'"
      :width="action.subActionConfig?.popoverWidth"
      :popper-class="action.subActionConfig?.popoverClass"
      :destroy-on-close="action.subActionConfig?.popoverDestroyOnClose"
    >
      <template #reference>
        <ActionButton
          :action="action"
          :row="row"
          :index="index"
          :visible="display(action.display, row) && !editState[index]"
        />
      </template>
      <div class="sub-actions">
        <template v-for="(subAction, subIndex) in action.subActionConfig?.items" :key="subIndex">
          <TMagicPopconfirm
            v-if="subAction.popconfirm"
            placement="top"
            :width="subAction.popconfirmWidth"
            :title="formatter(subAction.confirmText, row) || '确定执行此操作？'"
            @confirm="actionHandler(subAction, row, index)"
          >
            <template #reference>
              <ActionButton
                :action="subAction"
                :row="row"
                :index="index"
                btn-class="sub-action-btn"
                :visible="display(subAction.display, row)"
              />
            </template>
          </TMagicPopconfirm>

          <TMagicTooltip
            v-else
            :placement="subAction.tooltipPlacement || 'top'"
            :disabled="!Boolean(subAction.tooltip)"
            :content="subAction.tooltip"
          >
            <ActionButton
              :action="subAction"
              :row="row"
              :index="index"
              btn-class="sub-action-btn"
              :visible="display(subAction.display, row)"
              @click="actionHandler"
            />
          </TMagicTooltip>
        </template>
      </div>
    </TMagicPopover>

    <TMagicTooltip
      v-else
      :placement="action.tooltipPlacement || 'top'"
      :disabled="!Boolean(action.tooltip)"
      :content="action.tooltip"
    >
      <ActionButton
        :action="action"
        :row="row"
        :index="index"
        :visible="display(action.display, row) && !editState[index]"
        @click="actionHandler"
      />
    </TMagicTooltip>
  </template>

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

import { TMagicButton, tMagicMessage, TMagicPopconfirm, TMagicPopover, TMagicTooltip } from '@tmagic/design';

import ActionButton from './ActionButton.vue';
import { display, formatActionText as formatter } from './actionHelpers';
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

defineExpose({
  actionHandler,
  save,
  cancel,
});
</script>

<style scoped>
.sub-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sub-actions .sub-action-btn {
  justify-content: flex-start;
  width: 100%;
}
</style>
