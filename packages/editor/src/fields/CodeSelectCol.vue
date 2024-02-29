<template>
  <div class="m-fields-code-select-col">
    <div class="code-select-container">
      <!-- 代码块下拉框 -->
      <m-form-container
        class="select"
        :config="selectConfig"
        :model="model"
        :size="size"
        @change="onParamsChangeHandler"
      ></m-form-container>
      <!-- 查看/编辑按钮 -->
      <Icon v-if="model[name]" class="icon" :icon="!notEditable ? Edit : View" @click="editCode(model[name])"></Icon>
    </div>

    <!-- 参数填写框 -->
    <CodeParams
      v-if="paramsConfig.length"
      name="params"
      :key="model[name]"
      :model="model"
      :size="size"
      :params-config="paramsConfig"
      @change="onParamsChangeHandler"
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

<script lang="ts" setup>
import { computed, inject, ref, watch } from 'vue';
import { Edit, View } from '@element-plus/icons-vue';
import { isEmpty, map } from 'lodash-es';

import { createValues, type FieldProps, filterFunction, type FormState } from '@tmagic/form';
import type { Id } from '@tmagic/schema';

import CodeBlockEditor from '@editor/components/CodeBlockEditor.vue';
import CodeParams from '@editor/components/CodeParams.vue';
import Icon from '@editor/components/Icon.vue';
import { useCodeBlockEdit } from '@editor/hooks/use-code-block-edit';
import type { CodeParamStatement, CodeSelectColConfig, Services } from '@editor/type';

defineOptions({
  name: 'MEditorCodeSelectCol',
});

const mForm = inject<FormState | undefined>('mForm');
const services = inject<Services>('services');
const emit = defineEmits(['change']);

const notEditable = computed(() => filterFunction(mForm, props.config.notEditable, props));
const props = withDefaults(defineProps<FieldProps<CodeSelectColConfig>>(), {
  disabled: false,
});

/**
 * 根据代码块id获取代码块参数配置
 * @param codeId 代码块ID
 */
const getParamItemsConfig = (codeId?: Id): CodeParamStatement[] => {
  if (!codeDsl.value || !codeId) return [];

  const paramStatements = codeDsl.value[codeId]?.params;

  if (isEmpty(paramStatements)) return [];

  return paramStatements.map((paramState: CodeParamStatement) => ({
    labelWidth: '100px',
    text: paramState.name,
    ...paramState,
  }));
};

const codeDsl = computed(() => services?.codeBlockService.getCodeDsl());
const paramsConfig = ref<CodeParamStatement[]>(getParamItemsConfig(props.model[props.name]));

watch(
  () => props.model[props.name],
  (v, preV) => {
    if (v !== preV) {
      paramsConfig.value = getParamItemsConfig(v);
    }
  },
);

const selectConfig = {
  type: 'select',
  name: props.name,
  disable: props.disabled,
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
    paramsConfig.value = getParamItemsConfig(codeId);

    if (paramsConfig.value.length) {
      model.params = createValues(formState, paramsConfig.value, {}, model.params);
    } else {
      model.params = {};
    }

    return codeId;
  },
};

/**
 * 参数值修改更新
 */
const onParamsChangeHandler = (value: any) => {
  props.model.params = value.params;
  emit('change', props.model);
};

const { codeBlockEditor, codeConfig, editCode, submitCodeBlockHandler } = useCodeBlockEdit(services?.codeBlockService);
</script>
