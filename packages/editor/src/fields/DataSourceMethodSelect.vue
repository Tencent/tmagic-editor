<template>
  <div class="m-fields-data-source-method-select">
    <div class="data-source-method-select-container">
      <m-form-container
        class="select"
        :config="cascaderConfig"
        :model="model"
        @change="onChangeHandler"
      ></m-form-container>
      <Icon
        v-if="model[name] && isCustomMethod"
        class="icon"
        :icon="!notEditable ? Edit : View"
        @click="editCodeHandler"
      ></Icon>
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

    <CodeBlockEditor
      ref="codeBlockEditor"
      v-if="codeConfig"
      :disabled="notEditable"
      :content="codeConfig"
      @submit="submitCodeBlockHandler"
    ></CodeBlockEditor>
  </div>
</template>

<script lang="ts" setup name="">
import { computed, inject, ref } from 'vue';
import { Edit, View } from '@element-plus/icons-vue';

import { createValues, type FieldProps, filterFunction, type FormState } from '@tmagic/form';
import type { CodeBlockContent, Id } from '@tmagic/schema';

import CodeBlockEditor from '@editor/components/CodeBlockEditor.vue';
import CodeParams from '@editor/components/CodeParams.vue';
import Icon from '@editor/components/Icon.vue';
import { useDataSourceMethod } from '@editor/hooks/use-data-source-method';
import type { CodeParamStatement, DataSourceMethodSelectConfig, Services } from '@editor/type';

defineOptions({
  name: 'MEditorDataSourceMethodSelect',
});

const mForm = inject<FormState | undefined>('mForm');
const services = inject<Services>('services');
const emit = defineEmits(['change']);

const dataSourceService = services?.dataSourceService;

const props = withDefaults(defineProps<FieldProps<DataSourceMethodSelectConfig>>(), {
  disabled: false,
});

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

const paramsConfig = ref<CodeParamStatement[]>(getParamItemsConfig(props.model.dataSourceMethod));

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

const { codeBlockEditor, codeConfig, editCode, submitCode } = useDataSourceMethod();

const editCodeHandler = () => {
  const [id, name] = props.model[props.name];

  const dataSource = dataSourceService?.getDataSourceById(id);

  if (!dataSource) return;

  editCode(dataSource, name);

  setParamsConfig([id, name]);
};

const submitCodeBlockHandler = (value: CodeBlockContent) => {
  submitCode(value);
};
</script>
