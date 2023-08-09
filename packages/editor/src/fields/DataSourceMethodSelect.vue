<template>
  <div class="m-fields-data-source-method-select">
    <div class="data-source-method-select-container">
      <m-form-container
        class="select"
        :config="cascaderConfig"
        :model="model"
        @change="onChangeHandler"
      ></m-form-container>
      <Icon v-if="model[name]" class="icon" :icon="!disabled ? Edit : View" @click="editCodeHandler"></Icon>
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
      :disabled="disabled"
      :content="codeConfig"
      @submit="submitCodeBlockHandler"
    ></CodeBlockEditor>
  </div>
</template>

<script lang="ts" setup name="">
import { computed, inject, ref } from 'vue';
import { Edit, View } from '@element-plus/icons-vue';

import { createValues, FieldProps } from '@tmagic/form';
import type { CodeBlockContent, Id } from '@tmagic/schema';

import CodeBlockEditor from '@editor/components/CodeBlockEditor.vue';
import CodeParams from '@editor/components/CodeParams.vue';
import Icon from '@editor/components/Icon.vue';
import { useDataSourceMethod } from '@editor/hooks/use-data-source-method';
import type { CodeParamStatement, DataSourceMethodSelectConfig, Services } from '@editor/type';

defineOptions({
  name: 'MEditorDataSourceMethodSelect',
});

const services = inject<Services>('services');
const emit = defineEmits(['change']);

const props = withDefaults(defineProps<FieldProps<DataSourceMethodSelectConfig>>(), {
  disabled: false,
});

const dataSources = computed(() => services?.dataSourceService.get('dataSources'));

const getParamItemsConfig = ([dataSourceId, medthodName]: [Id, string] = ['', '']): CodeParamStatement[] => {
  if (!dataSourceId) return [];

  const paramStatements = dataSources.value
    ?.find((item) => item.id === dataSourceId)
    ?.methods?.find((item) => item.name === medthodName)?.params;

  if (!paramStatements) return [];

  return paramStatements.map((paramState: CodeParamStatement) => ({
    labelWidth: '100px',
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

const cascaderConfig = {
  type: 'cascader',
  text: '数据源方法',
  name: props.name,
  labelWidth: '80px',
  options: () =>
    dataSources.value
      ?.filter((ds) => ds.methods?.length)
      ?.map((ds) => ({
        label: ds.title || ds.id,
        value: ds.id,
        children: ds.methods?.map((method) => ({
          label: method.name,
          value: method.name,
        })),
      })) || [],
  onChange: (formState: any, dataSourceMethod: [Id, string]) => {
    setParamsConfig(dataSourceMethod, formState);

    return dataSourceMethod;
  },
};

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

  const dataSource = services?.dataSourceService.getDataSourceById(id);

  if (!dataSource) return;

  editCode(dataSource, name);

  setParamsConfig([id, name]);
};

const submitCodeBlockHandler = (value: CodeBlockContent) => {
  submitCode(value);
};
</script>
