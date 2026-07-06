<template>
  <template v-for="(action, actionIndex) in config.actions" :key="actionIndex">
    <ActionPopconfirm
      v-if="action.popconfirm"
      :action="action"
      :row="row"
      :index="index"
      :visible="display(action.display, row) && !editState[index]"
      @confirm="actionHandler"
    />

    <TMagicPopover
      v-else-if="action.type === 'sub-actions'"
      v-model:visible="popoverVisible"
      trigger="click"
      :placement="action.subActionConfig?.placement || 'bottom'"
      :width="action.subActionConfig?.popoverWidth"
      :popper-class="action.subActionConfig?.popoverClass"
      :destroy-on-close="action.subActionConfig?.popoverDestroyOnClose"
    >
      <template #reference>
        <TMagicButton
          v-show="action.subActionConfig?.items?.length && display(action.display, row) && !editState[index]"
          class="action-btn"
          link
          size="small"
          :type="action.buttonType || 'primary'"
          :icon="popoverVisible ? ArrowDown : ArrowRight"
          @click.stop="togglePopover"
        ></TMagicButton>
      </template>
      <div class="sub-actions">
        <template v-for="(subAction, subIndex) in action.subActionConfig?.items" :key="subIndex">
          <ActionPopconfirm
            v-if="subAction.popconfirm"
            :action="subAction"
            :row="row"
            :index="index"
            btn-class="sub-action-btn"
            :visible="display(subAction.display, row)"
            @confirm="actionHandler"
          />

          <ActionButton
            v-else
            :action="subAction"
            :row="row"
            :index="index"
            btn-class="sub-action-btn"
            :visible="display(subAction.display, row)"
            @click="actionHandler"
          />
        </template>
      </div>
    </TMagicPopover>

    <ActionButton
      v-else
      :action="action"
      :row="row"
      :index="index"
      :visible="display(action.display, row) && !editState[index]"
      @click="actionHandler"
    />
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
import { ref } from 'vue';
import { ArrowDown, ArrowRight } from '@element-plus/icons-vue';
import { cloneDeep } from 'lodash-es';

import { TMagicButton, tMagicMessage, TMagicPopover } from '@tmagic/design';

import ActionButton from './ActionButton.vue';
import { display } from './actionHelpers';
import ActionPopconfirm from './ActionPopconfirm.vue';
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

const popoverVisible = ref(false);
const togglePopover = () => {
  popoverVisible.value = !popoverVisible.value;
};

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

<style lang="scss">
.sub-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;

  .sub-action-btn {
    width: 100%;
  }

  .tmagic-design-button + .tmagic-design-button {
    margin-left: 0;
  }

  .tmagic-design-button {
    justify-content: flex-start;
  }
}
</style>
