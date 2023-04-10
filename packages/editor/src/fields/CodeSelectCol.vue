<template>
  <div class="m-fields-code-select-col">
    <!-- 代码块下拉框 -->
    <m-form-container :config="selectConfig" :model="model" @change="onParamsChangeHandler"></m-form-container>
    <!-- 参数填写框 -->
    <m-form-container :config="codeParamsConfig" :model="model" @change="onParamsChangeHandler"></m-form-container>
  </div>
</template>

<script lang="ts" setup name="MEditorCodeSelectCol">
import { computed, defineEmits, defineProps, inject, ref, watch } from 'vue';
import { isEmpty, map } from 'lodash-es';

import { createValues, FieldsetConfig, FormState } from '@tmagic/form';
import { Id } from '@tmagic/schema';

import type { CodeParamStatement, Services } from '@editor/type';

const services = inject<Services>('services');
const mForm = inject<FormState>('mForm');
const emit = defineEmits(['change']);

const props = withDefaults(
  defineProps<{
    config: any;
    model: any;
    prop: string;
    name: string;
    size: 'small' | 'default' | 'large';
  }>(),
  {},
);
const codeDsl = computed(() => services?.codeBlockService.getCodeDsl());
const codeParamsConfig = ref<FieldsetConfig>({
  type: 'fieldset',
  items: [],
  legend: '参数',
  labelWidth: '70px',
  name: 'params',
  display: false,
});
const selectConfig = {
  type: 'select',
  text: '代码块',
  name: 'codeId',
  labelWidth: '70px',
  options: () => {
    if (codeDsl.value) {
      return map(codeDsl.value, (value, key) => ({
        text: `${value.name}（${key}）`,
        label: `${value.name}（${key}）`,
        value: key,
      }));
    }
    return [];
  },
  onChange: (formState: any, codeId: Id, { model }: any) => {
    // 通过下拉框选择的codeId变化后修正model的值，避免写入其他codeId的params
    model.params = {};
  },
};

/**
 * 根据代码块id获取代码块参数配置
 * @param codeId 代码块ID
 */
const getParamItemsConfig = (codeId: Id): CodeParamStatement[] => {
  if (!codeDsl.value) return [];
  const paramStatements = codeDsl.value[codeId]?.params;
  if (isEmpty(paramStatements)) return [];
  return paramStatements.map((paramState: CodeParamStatement) => ({
    labelWidth: '100px',
    text: paramState.name,
    ...paramState,
  }));
};

/**
 * 根据代码块id获取参数fieldset表单配置
 * @param codeId 代码块ID
 */
const getCodeParamsConfig = (codeId: Id) => {
  const paramsConfig = getParamItemsConfig(codeId);
  // 如果参数没有填值，则使用createValues补全空值
  if (!props.model.params || isEmpty(props.model.params)) {
    props.model.params = {};
    createValues(mForm, paramsConfig, {}, props.model.params);
  }
  codeParamsConfig.value = {
    type: 'fieldset',
    items: paramsConfig,
    legend: '参数',
    labelWidth: '70px',
    name: 'params',
    display: !isEmpty(paramsConfig),
  };
};

/**
 * 参数值修改更新
 */
const onParamsChangeHandler = () => {
  emit('change', props.model);
};

// 监听代码块顺序变化以及下拉选择的变化，并更新参数配置
// TODO onchange在watch之前触发
watch(
  () => props.model.codeId,
  (codeId: Id) => {
    if (!codeId) return;
    getCodeParamsConfig(codeId);
  },
  {
    immediate: true,
  },
);
</script>
