<template>
  <div class="m-fields-data-source-method-select">
    <div class="data-source-method-select-container">
      <MContainer
        class="select"
        :config="cascaderConfig"
        :model="model"
        :size="size"
        @change="onChangeHandler"
      ></MContainer>

      <TMagicTooltip
        v-if="model[name] && isCustomMethod && hasDataSourceSidePanel"
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
      :model="model"
      :size="size"
      :disabled="disabled"
      :params-config="paramsConfig"
      @change="onChangeHandler"
    ></CodeParams>
  </div>
</template>

<script lang="ts" setup name="">
import { computed, inject, ref } from 'vue';
import { Edit, View } from '@element-plus/icons-vue';

import { TMagicButton, TMagicTooltip } from '@tmagic/design';
import { createValues, type FieldProps, filterFunction, type FormState, MContainer } from '@tmagic/form';
import type { Id } from '@tmagic/schema';

import CodeParams from '@editor/components/CodeParams.vue';
import MIcon from '@editor/components/Icon.vue';
import type { CodeParamStatement, DataSourceMethodSelectConfig, EventBus, Services } from '@editor/type';
import { SideItemKey } from '@editor/type';

defineOptions({
  name: 'MFieldsDataSourceMethodSelect',
});

const mForm = inject<FormState | undefined>('mForm');
const services = inject<Services>('services');
const eventBus = inject<EventBus>('eventBus');

const emit = defineEmits(['change']);

const dataSourceService = services?.dataSourceService;

const props = withDefaults(defineProps<FieldProps<DataSourceMethodSelectConfig>>(), {
  disabled: false,
});

const hasDataSourceSidePanel = computed(() =>
  (services?.uiService.get('sideBarItems') || []).find((item) => item.$key === SideItemKey.DATA_SOURCE),
);

const notEditable = computed(() => filterFunction(mForm, props.config.notEditable, props));

const dataSources = computed(() => dataSourceService?.get('dataSources'));

const isCustomMethod = computed(() => {
  const [id, name] = props.model[props.name];

  const dataSource = dataSourceService?.getDataSourceById(id);

  return Boolean(dataSource?.methods.find((method) => method.name === name));
});

const getParamItemsConfig = ([dataSourceId, methodName]: [Id, string] = ['', '']): CodeParamStatement[] => {
  if (!dataSourceId) return [];

  const paramStatements = dataSources.value
    ?.find((item) => item.id === dataSourceId)
    ?.methods?.find((item) => item.name === methodName)?.params;

  if (!paramStatements) return [];

  return paramStatements.map((paramState: CodeParamStatement) => ({
    text: paramState.name,
    ...paramState,
  }));
};

const paramsConfig = ref<CodeParamStatement[]>(getParamItemsConfig(props.model[props.name || 'dataSourceMethod']));

const setParamsConfig = (dataSourceMethod: [Id, string], formState: any = {}) => {
  // 通过下拉框选择的codeId变化后修正model的值，避免写入其他codeId的params
  paramsConfig.value = dataSourceMethod ? getParamItemsConfig(dataSourceMethod) : [];

  if (paramsConfig.value.length) {
    props.model.params = createValues(formState, paramsConfig.value, {}, props.model.params);
  } else {
    props.model.params = {};
  }
};

const methodsOptions = computed(
  () =>
    dataSources.value
      ?.filter((ds) => ds.methods?.length || dataSourceService?.getFormMethod(ds.type).length)
      ?.map((ds) => ({
        label: ds.title || ds.id,
        value: ds.id,
        children: [
          ...(dataSourceService?.getFormMethod(ds.type) || []),
          ...(ds.methods || []).map((method) => ({
            label: method.name,
            value: method.name,
          })),
        ],
      })) || [],
);

const cascaderConfig = computed(() => ({
  type: 'cascader',
  name: props.name,
  options: methodsOptions.value,
  disable: props.disabled,
  onChange: (formState: any, dataSourceMethod: [Id, string]) => {
    setParamsConfig(dataSourceMethod, formState);

    return dataSourceMethod;
  },
}));

/**
 * 参数值修改更新
 */
const onChangeHandler = (value: any) => {
  props.model.params = value.params;
  emit('change', props.model);
};

const editCodeHandler = () => {
  const [id] = props.model[props.name];

  const dataSource = dataSourceService?.getDataSourceById(id);

  if (!dataSource) return;

  eventBus?.emit('edit-data-source', id);
};
</script>
