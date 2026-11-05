<template>
  <div class="m-fields-data-source-method-select">
    <div class="data-source-method-select-container">
      <MCascader
        class="select"
        :config="cascaderConfig"
        :model="model"
        :name="name"
        :size="size"
        :disabled="disabled"
        :prop="prop"
        @change="onChangeHandler"
      ></MCascader>

      <TMagicTooltip
        v-if="model[name] && isCustomMethod && dataSourceSidePanel && !isCompare"
        :content="notEditable ? '查看' : '编辑'"
      >
        <TMagicButton class="m-fields-select-action-button" :size="size" @click="editCodeHandler">
          <MIcon :icon="!notEditable ? Edit : View"></MIcon>
        </TMagicButton>
      </TMagicTooltip>
    </div>

    <CodeParams
      v-if="paramsConfig.length"
      name="params"
      :key="model[name]"
      :model="model"
      :size="size"
      :disabled="disabled"
      :params-config="paramsConfig"
      @change="onParamsChangeHandler"
    ></CodeParams>
  </div>
</template>

<script lang="ts" setup name="">
import { computed, inject } from 'vue';
import { Edit, View } from '@element-plus/icons-vue';

import type { Id } from '@tmagic/core';
import { TMagicButton, TMagicTooltip } from '@tmagic/design';
import {
  type CascaderConfig,
  type ContainerChangeEventData,
  createValues,
  type DataSourceMethodSelectConfig,
  type FieldProps,
  filterFunction,
  type FormItemConfig,
  type FormState,
  MCascader,
} from '@tmagic/form';
import { DATA_SOURCE_SET_DATA_METHOD_NAME } from '@tmagic/utils';

import CodeParams from '@editor/components/CodeParams.vue';
import MIcon from '@editor/components/Icon.vue';
import { useServices } from '@editor/hooks/use-services';
import type { CodeParamStatement, EventBus } from '@editor/type';
import { SideItemKey } from '@editor/type';
import { getFieldType } from '@editor/utils';

defineOptions({
  name: 'MFieldsDataSourceMethodSelect',
});

const { dataSourceService, uiService } = useServices();
const mForm = inject<FormState | undefined>('mForm');
const eventBus = inject<EventBus | null>('eventBus', null);

const emit = defineEmits(['change']);

const props = withDefaults(defineProps<FieldProps<DataSourceMethodSelectConfig>>(), {
  disabled: false,
});

const dataSourceSidePanel = computed(() =>
  (uiService.get('sideBarItems') || []).find((item) => item.$key === SideItemKey.DATA_SOURCE),
);

const notEditable = computed(() => filterFunction(mForm, props.config.notEditable, props));

/** 对比模式下隐藏查看/编辑操作按钮，仅保留只读展示。 */
const isCompare = computed(() => Boolean(mForm?.isCompare));

const dataSources = computed(() => dataSourceService.get('dataSources'));
const codeOptions = inject('codeOptions', {});

const isCustomMethod = computed(() => {
  const [id, name] = props.model[props.name];

  const dataSource = dataSourceService.getDataSourceById(id);

  return Boolean(dataSource?.methods.find((method) => method.name === name));
});

const getParamItemsConfig = ([dataSourceId, methodName]: [Id, string] = ['', '']): CodeParamStatement[] => {
  if (!dataSourceId) return [];

  if (methodName === DATA_SOURCE_SET_DATA_METHOD_NAME) {
    return [
      {
        name: 'field',
        text: '字段',
        type: 'data-source-field-select',
        dataSourceId,
        checkStrictly: true,
      },
      {
        name: 'data',
        text: '数据',
        type: (_formState, { model }) => {
          const fieldType = getFieldType(dataSourceService.getDataSourceById(`${dataSourceId}`), model.field);

          let type = 'vs-code';

          if (fieldType === 'number') {
            type = 'number';
          } else if (fieldType === 'string') {
            type = 'text';
          } else if (fieldType === 'boolean') {
            type = 'switch';
          }

          return type;
        },
        language: 'javascript',
        options: codeOptions,
        autosize: {
          minRows: 1,
          maxRows: 10,
        },
      },
    ];
  }

  const paramStatements = dataSources.value
    ?.find((item) => item.id === dataSourceId)
    ?.methods?.find((item) => item.name === methodName)?.params;

  if (!paramStatements) return [];

  return paramStatements.map((paramState: CodeParamStatement) => ({
    text: paramState.name,
    ...paramState,
  }));
};

/**
 * 参数字段配置跟随当前 model 派生，而不是 setup 期的一次性快照。
 *
 * 属性面板在同类型组件之间切换选中时会复用表单字段实例，此时 model 已换成新节点；
 * 快照会让「新节点的方法」配上「旧节点的参数字段」，看起来像两个组件的事件配置混在了一起。
 * 数据源列表异步就绪时也能随 computed 自动补齐参数配置。
 */
const paramsConfig = computed<CodeParamStatement[]>(() =>
  getParamItemsConfig(props.model[props.name || 'dataSourceMethod']),
);

const methodsOptions = computed(
  () =>
    dataSources.value?.map((ds) => ({
      label: ds.title || ds.id,
      value: ds.id,
      children: [
        {
          label: '设置数据',
          value: DATA_SOURCE_SET_DATA_METHOD_NAME,
        },
        ...(dataSourceService?.getFormMethod(ds.type) || []),
        ...(ds.methods || []).map((method) => ({
          label: method.name,
          value: method.name,
        })),
      ],
    })) || [],
);

const cascaderConfig = computed<CascaderConfig>(() => ({
  type: 'cascader',
  options: methodsOptions.value,
}));

/**
 * 参数值修改更新
 */
const onChangeHandler = (value: any) => {
  // model 尚未写入新值（由 MForm 收到 change 后统一写回），参数字段配置先按新选中的方法算
  const nextParamsConfig = getParamItemsConfig(value);

  const changeRecords = [
    {
      propPath: props.prop,
      value,
    },
  ];

  changeRecords.push({
    propPath: props.prop.replace(`${props.name}`, 'params'),
    value: nextParamsConfig.length
      ? createValues(mForm, nextParamsConfig as unknown as FormItemConfig[], {}, props.model.params)
      : {},
  });

  emit('change', value, {
    changeRecords,
  });
};

/**
 * 参数值修改更新
 */
const onParamsChangeHandler = (value: any, eventData: ContainerChangeEventData) => {
  eventData.changeRecords?.forEach((record) => {
    record.propPath = `${props.prop.replace(`${props.name}`, '')}${record.propPath}`;
  });
  emit('change', props.model[props.name], eventData);
};

const editCodeHandler = () => {
  const [id, methodName] = props.model[props.name];

  const dataSource = dataSourceService.getDataSourceById(id);

  if (!dataSource) return;

  const sideBarItem = dataSourceSidePanel.value;
  if (sideBarItem) {
    uiService.set('sideBarActiveTabName', sideBarItem.text || sideBarItem.$key || SideItemKey.DATA_SOURCE);
  }

  eventBus?.emit('edit-data-source-method', id, methodName);
};
</script>
