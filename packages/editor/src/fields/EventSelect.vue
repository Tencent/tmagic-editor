<template>
  <div class="m-fields-event-select">
    <MTable
      v-if="isOldVersion"
      name="events"
      :size="size"
      :disabled="disabled"
      :model="model"
      :last-values="lastValues"
      :is-compare="isCompareMode"
      :config="tableConfig"
      @change="onChangeHandler"
    ></MTable>

    <div v-else class="fullWidth event-select-container">
      <div class="event-select-header">
        <div class="event-select-title">事件配置</div>
        <TMagicButton
          v-if="!isCompareMode && displayList.length > 0"
          class="create-button"
          text
          type="primary"
          :icon="Plus"
          :size="size"
          :disabled="disabled"
          @click="addEvent()"
          >添加事件</TMagicButton
        >
      </div>
      <MPanel
        v-for="entry in displayList"
        :key="entry.index"
        :disabled="disabled"
        :size="size"
        :prop="`${prop}.${entry.index}`"
        :config="actionsConfig"
        :model="entry.cardItem"
        :last-values="entry.lastCardItem"
        :is-compare="isCompareMode"
        :hide-expand="true"
        :label-width="config.labelWidth || '100px'"
        @change="onChangeHandler"
      >
        <template #header>
          <div class="event-item-header">
            <div class="event-item-title">事件{{ Number(entry.index) + 1 }}</div>
            <MFormContainer
              class="fullWidth"
              :config="eventNameConfig"
              :model="entry.cardItem"
              :last-values="entry.lastCardItem"
              :is-compare="isCompareMode"
              :disabled="disabled"
              :size="size"
              :prop="`${prop}.${entry.index}`"
              @change="eventNameChangeHandler"
            ></MFormContainer>
            <TMagicButton
              class="event-item-delete-button"
              v-if="!isCompareMode"
              link
              :icon="Delete"
              :disabled="disabled"
              :size="size"
              @click="removeEvent(Number(entry.index))"
            ></TMagicButton>
          </div>
        </template>
      </MPanel>

      <TMagicButton
        v-if="!isCompareMode"
        class="create-button fullWidth"
        :icon="Plus"
        :disabled="disabled"
        @click="addEvent()"
        >添加事件</TMagicButton
      >
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { Delete } from '@element-plus/icons-vue';
import { Plus } from '@element-plus/icons-vue';
import { has } from 'lodash-es';

import { ActionType } from '@tmagic/core';
import { TMagicButton } from '@tmagic/design';
import type {
  CodeSelectColConfig,
  ContainerChangeEventData,
  DataSourceMethodSelectConfig,
  DynamicTypeConfig,
  EventSelectConfig,
  FieldProps,
  FormState,
  PanelConfig,
  TableConfig,
  UISelectConfig,
} from '@tmagic/form';
import { defineFormItem, MContainer as MFormContainer, MPanel, MTable } from '@tmagic/form';

import { useServices } from '@editor/hooks/use-services';
import {
  getCompActionAllowedValues,
  getCompActionOptions,
  getEventNameAllowedValues,
  getEventNameOptions,
  normalizeCompActionValue,
} from '@editor/utils';

defineOptions({
  name: 'MFieldsEventSelect',
});

const props = defineProps<FieldProps<EventSelectConfig>>();

const emit = defineEmits<{
  change: [v: any, eventData?: ContainerChangeEventData];
}>();

const { editorService, dataSourceService, eventsService, codeBlockService, propsService } = useServices();

// 事件名称下拉框表单配置
const eventNameConfig = computed(() => {
  const defaultEventNameConfig = {
    name: 'name',
    text: '事件类型',
    type: (mForm: FormState | undefined, { formValue }: any) => {
      if (
        props.config.src !== 'component' ||
        (formValue.type === 'page-fragment-container' && formValue.pageFragmentId)
      ) {
        return 'cascader';
      }
      return 'select';
    },
    labelWidth: '70px',
    checkStrictly: () => props.config.src !== 'component',
    valueSeparator: '.',
    options: (_mForm: FormState, { formValue }: any) => getEventNameOptions(props.config.src, formValue),
    rules: [
      {
        validator: ({ value, callback }: any, { formValue }: any) => {
          const allowedNames = getEventNameAllowedValues(props.config as any, formValue);
          if (allowedNames && allowedNames.size > 0 && value && !allowedNames.has(value)) {
            return callback(`事件名(${value})不存在`);
          }
          callback();
        },
        trigger: 'blur',
      },
    ],
  };
  return { ...defaultEventNameConfig, ...props.config.eventNameConfig };
});

const actionTypeOptions = computed(() => {
  const o: {
    text: string;
    label: string;
    value: string;
    disabled?: boolean;
  }[] = [
    {
      text: '组件',
      label: '组件',
      value: ActionType.COMP,
    },
  ];

  if (!propsService.getDisabledCodeBlock()) {
    o.push({
      text: '代码',
      label: '代码',
      disabled: !Object.keys(codeBlockService.getCodeDsl() || {}).length,
      value: ActionType.CODE,
    });
  }

  if (!propsService.getDisabledDataSource()) {
    o.push({
      text: '数据源',
      label: '数据源',
      value: ActionType.DATA_SOURCE,
    });
  }

  return o;
});

// 联动类型
const actionTypeConfig = computed(() => {
  const defaultActionTypeConfig = {
    name: 'actionType',
    text: '联动类型',
    type: 'select',
    labelPosition: 'left',
    defaultValue: ActionType.COMP,
    options: actionTypeOptions.value,
    rules: [
      {
        required: true,
        message: '联动类型不能为空',
      },
      {
        typeMatch: true,
        trigger: 'blur',
      },
    ],
  };
  return { ...defaultActionTypeConfig, ...props.config.actionTypeConfig };
});

// 联动组件配置
const targetCompConfig = computed(() => {
  const defaultTargetCompConfig: UISelectConfig = {
    name: 'to',
    text: '联动组件',
    type: 'ui-select',
    labelPosition: 'left',
    display: (_mForm, { model }) => model.actionType === ActionType.COMP,
    onChange: (_MForm, _v, { setModel }) => {
      setModel('method', '');
    },
    rules: [
      {
        typeMatch: true,
        trigger: 'blur',
      },
    ],
  };
  return { ...defaultTargetCompConfig, ...props.config.targetCompConfig };
});

// 联动组件动作配置
const compActionConfig = computed(() => {
  const defaultCompActionConfig: DynamicTypeConfig = {
    name: 'method',
    text: '动作',
    labelPosition: 'left',
    type: (mForm: FormState | undefined, { model }: any) => {
      const to = editorService.getNodeById(model.to);

      if (to && to.type === 'page-fragment-container' && to.pageFragmentId) {
        return 'cascader';
      }

      return 'select';
    },
    checkStrictly: () => props.config.src !== 'component',
    display: (mForm: FormState | undefined, { model }: any) => model.actionType === ActionType.COMP,
    options: (_mForm: FormState, { model }: any) => getCompActionOptions(model.to),
    rules: [
      {
        trigger: 'blur',
        validator: ({ value, callback }: any, { model }: any) => {
          const allowedMethods = getCompActionAllowedValues(props.config as any, model);
          const normalized = normalizeCompActionValue(value);
          if (allowedMethods && allowedMethods.size > 0 && normalized && !allowedMethods.has(normalized)) {
            return callback(`动作名(${normalized})不存在`);
          }
          callback();
        },
      },
    ],
  };
  return { ...defaultCompActionConfig, ...props.config.compActionConfig };
});

// 代码联动配置
const codeActionConfig = computed(() => {
  const defaultCodeActionConfig: CodeSelectColConfig = {
    type: 'code-select-col',
    text: '代码块',
    name: 'codeId',
    notEditable: () => !codeBlockService.getEditStatus(),
    display: (mForm, { model }) => model.actionType === ActionType.CODE,
  };
  return { ...defaultCodeActionConfig, ...props.config.codeActionConfig };
});

// 数据源联动配置
const dataSourceActionConfig = computed(() => {
  const defaultDataSourceActionConfig: DataSourceMethodSelectConfig = {
    type: 'data-source-method-select',
    text: '数据源方法',
    name: 'dataSourceMethod',
    notEditable: () => !dataSourceService.get('editable'),
    display: (mForm, { model }) => model.actionType === ActionType.DATA_SOURCE,
  };
  return { ...defaultDataSourceActionConfig, ...props.config.dataSourceActionConfig };
});

// 兼容旧的数据格式
const tableConfig = computed(
  () =>
    defineFormItem({
      type: 'table',
      name: 'events',
      items: [
        {
          name: 'name',
          label: '事件名',
          type: eventNameConfig.value.type,
          options: (mForm: FormState, { formValue }: any) =>
            eventsService.getEvent(formValue.type).map((option: any) => ({
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
            const node = editorService.getNodeById(model.to);
            if (!node?.type) return [];

            return eventsService.getMethod(node.type, model.to).map((option: any) => ({
              text: option.label,
              value: option.value,
            }));
          },
        },
      ],
    }) as TableConfig,
);

// 组件动作组表单配置
const actionsConfig = computed(
  () =>
    defineFormItem({
      type: 'panel',
      labelPosition: 'left',
      items: [
        {
          type: 'group-list',
          name: 'actions',
          expandAll: true,
          enableToggleMode: false,
          titlePrefix: '动作',
          labelPosition: 'left',
          items: [
            actionTypeConfig.value,
            targetCompConfig.value,
            compActionConfig.value,
            codeActionConfig.value,
            dataSourceActionConfig.value,
          ],
        },
      ],
    }) as PanelConfig,
);

// 是否为旧的数据格式
const isOldVersion = computed(() => {
  if (props.model[props.name].length === 0) return false;
  return !has(props.model[props.name][0], 'actions');
});

/**
 * 对比模式判定：
 *
 * event-select 内部由「事件列表 + 嵌套子表单」组成，属于复合字段。父级 `MFormContainer` 已将其
 * 归入「自接管对比字段」（见 Container.vue 的 `SELF_DIFF_FIELD_TYPES`），即对比时只渲染一次本组件，
 * 并把当前值 `model` 与历史值 `lastValues` 一并传入，由本组件把 `is-compare`/`lastValues` 透传给
 * 内部的 MPanel / MFormContainer，逐项（事件名、动作）展示前后差异。
 *
 * 仅当存在历史值时才启用对比，避免 lastValues 缺失时退化为「全部新增」的空对比。
 */
const isCompareMode = computed(() => Boolean(props.isCompare && props.lastValues));

/**
 * 待渲染的事件卡片列表。
 *
 * - 非对比模式：直接映射当前事件列表，`lastCardItem` 为空；
 * - 对比模式：按索引对齐当前值与历史值，取两者长度的最大值，使得「新增」（仅当前有）与
 *   「删除」（仅历史有）的事件都能被渲染出来；缺失的一侧用空对象兜底，从而让子级正确高亮差异。
 */
const displayList = computed<{ cardItem: any; lastCardItem: any; index: number }[]>(() => {
  const current = props.model[props.name] || [];

  if (!isCompareMode.value) {
    return current.map((cardItem: any, index: number) => ({ cardItem, lastCardItem: undefined, index }));
  }

  const last = props.lastValues?.[props.name] || [];
  const length = Math.max(current.length, last.length);

  return Array.from({ length }, (_, index) => ({
    cardItem: current[index] ?? {},
    lastCardItem: last[index] ?? {},
    index,
  }));
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

  emit('change', defaultEvent, {
    modifyKey: props.model[props.name].length,
  });
};

// 删除事件
const removeEvent = (index: number) => {
  if (!props.name) return;
  props.model[props.name].splice(index, 1);
  emit('change', props.model[props.name]);
};

const eventNameChangeHandler = (v: any, eventData: ContainerChangeEventData) => {
  emit('change', props.model[props.name], eventData);
};

const onChangeHandler = (v: any, eventData: ContainerChangeEventData) =>
  emit('change', props.model[props.name], eventData);
</script>
