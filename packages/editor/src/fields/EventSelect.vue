<template>
  <div class="m-fields-event-select">
    <m-form-container
      v-if="isOldVersion"
      ref="eventForm"
      :size="props.size"
      :model="model"
      :config="tableConfig"
      @change="onChangeHandler"
    ></m-form-container>

    <div v-else class="fullWidth">
      <TMagicButton class="create-button" type="primary" size="small" @click="addEvent()">添加事件</TMagicButton>
      <m-form-panel
        v-for="(cardItem, index) in model[name]"
        :key="index"
        :config="actionsConfig"
        :model="cardItem"
        @change="onChangeHandler"
      >
        <template #header>
          <m-form-container
            class="fullWidth"
            :config="eventNameConfig"
            :model="cardItem"
            @change="onChangeHandler"
          ></m-form-container>
          <TMagicButton style="color: #f56c6c" text :icon="Delete" @click="removeEvent(index)"></TMagicButton>
        </template>
      </m-form-panel>
    </div>
  </div>
</template>

<script lang="ts" setup name="MEditorEventSelect">
import { computed, defineProps, inject } from 'vue';
import { Delete } from '@element-plus/icons-vue';
import { has } from 'lodash-es';

import { TMagicButton } from '@tmagic/design';
import { FormState } from '@tmagic/form';
import { ActionType } from '@tmagic/schema';

import type { EventSelectConfig, Services } from '@editor/type';

const services = inject<Services>('services');

const props = defineProps<{
  config: EventSelectConfig;
  model: any;
  prop: string;
  name: string;
  size: 'small' | 'default' | 'large';
}>();
const emit = defineEmits(['change']);

// 事件名称下拉框表单配置
const eventNameConfig = computed(() => {
  const defaultEventNameConfig = {
    name: 'name',
    text: '事件',
    type: 'select',
    labelWidth: '40px',
    options: (mForm: FormState, { formValue }: any) =>
      services?.eventsService.getEvent(formValue.type).map((option: any) => ({
        text: option.label,
        value: option.value,
      })),
  };
  return { ...defaultEventNameConfig, ...props.config.eventNameConfig };
});

// 联动类型
const actionTypeConfig = computed(() => {
  const defaultActionTypeConfig = {
    name: 'actionType',
    text: '联动类型',
    labelWidth: '70px',
    type: 'select',
    defaultValue: ActionType.COMP,
    options: () => [
      {
        text: '组件',
        label: '组件',
        value: ActionType.COMP,
      },
      {
        text: '代码',
        label: '代码',
        value: ActionType.CODE,
      },
    ],
  };
  return { ...defaultActionTypeConfig, ...props.config.actionTypeConfig };
});

// 联动组件配置
const targetCompConfig = computed(() => {
  const defaultTargetCompConfig = {
    name: 'to',
    text: '联动组件',
    labelWidth: '70px',
    type: 'ui-select',
    display: (mForm: FormState, { model }: { model: Record<any, any> }) => model.actionType === ActionType.COMP,
  };
  return { ...defaultTargetCompConfig, ...props.config.targetCompConfig };
});

// 联动组件动作配置
const compActionConfig = computed(() => {
  const defaultCompActionConfig = {
    name: 'method',
    text: '动作',
    labelWidth: '70px',
    type: 'select',
    display: (mForm: FormState, { model }: { model: Record<any, any> }) => model.actionType === ActionType.COMP,
    options: (mForm: FormState, { model }: any) => {
      const node = services?.editorService.getNodeById(model.to);
      if (!node?.type) return [];

      return services?.eventsService.getMethod(node.type).map((option: any) => ({
        text: option.label,
        value: option.value,
      }));
    },
  };
  return { ...defaultCompActionConfig, ...props.config.compActionConfig };
});

// 代码联动配置
const codeActionConfig = computed(() => {
  const defaultCodeActionConfig = {
    type: 'code-select-col',
    display: (mForm: FormState, { model }: { model: Record<any, any> }) => model.actionType === ActionType.CODE,
  };
  return { ...defaultCodeActionConfig, ...props.config.codeActionConfig };
});

// 兼容旧的数据格式
const tableConfig = computed(() => ({
  type: 'table',
  name: 'events',
  items: [
    {
      name: 'name',
      label: '事件名',
      type: eventNameConfig.value.type,
      options: (mForm: FormState, { formValue }: any) =>
        services?.eventsService.getEvent(formValue.type).map((option: any) => ({
          text: option.label,
          value: option.value,
        })),
    },
    {
      name: 'to',
      label: '联动组件',
      type: 'ui-select',
    },
    {
      name: 'method',
      label: '动作',
      type: compActionConfig.value.type,
      options: (mForm: FormState, { model }: any) => {
        const node = services?.editorService.getNodeById(model.to);
        if (!node?.type) return [];

        return services?.eventsService.getMethod(node.type).map((option: any) => ({
          text: option.label,
          value: option.value,
        }));
      },
    },
  ],
}));

// 组件动作组表单配置
const actionsConfig = computed(() => ({
  items: [
    {
      type: 'group-list',
      name: 'actions',
      enableToggleMode: false,
      items: [actionTypeConfig.value, targetCompConfig.value, compActionConfig.value, codeActionConfig.value],
    },
  ],
}));

// 是否为旧的数据格式
const isOldVersion = computed(() => {
  if (props.model[props.name].length === 0) return false;
  return !has(props.model[props.name][0], 'actions');
});

// 添加事件
const addEvent = () => {
  const defaultEvent = {
    name: '',
    actions: [],
  };
  if (!props.model[props.name]) {
    props.model[props.name] = [];
  }
  props.model[props.name].push(defaultEvent);
  onChangeHandler();
};

// 删除事件
const removeEvent = (index: number) => {
  if (!props.name) return;
  props.model[props.name].splice(index, 1);
  onChangeHandler();
};

const onChangeHandler = () => {
  emit('change', props.model);
};
</script>
