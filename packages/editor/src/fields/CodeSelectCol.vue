<template>
  <div class="m-fields-code-select-col">
    <div class="code-select-container">
      <!-- 代码块下拉框 -->
      <m-form-container
        class="select"
        :config="selectConfig"
        :model="model"
        @change="onParamsChangeHandler"
      ></m-form-container>
      <!-- 查看/编辑按钮 -->
      <Icon v-if="model[name]" class="icon" :icon="!disabled ? Edit : View" @click="editCode"></Icon>
    </div>
    <!-- 参数填写框 -->
    <CodeParams
      v-if="paramsConfig.length"
      name="params"
      :model="model"
      :size="size"
      :disabled="disabled"
      :params-config="paramsConfig"
      @change="onParamsChangeHandler"
    ></CodeParams>
  </div>
</template>

<script lang="ts" setup name="">
import { computed, inject, ref } from 'vue';
import { Edit, View } from '@element-plus/icons-vue';
import { isEmpty, map } from 'lodash-es';

import { createValues } from '@tmagic/form';
import type { Id } from '@tmagic/schema';

import CodeParams from '@editor/components/CodeParams.vue';
import Icon from '@editor/components/Icon.vue';
import type { CodeParamStatement, CodeSelectColConfig, Services } from '@editor/type';

defineOptions({
  name: 'MEditorCodeSelectCol',
});

const services = inject<Services>('services');
const emit = defineEmits(['change']);

const props = withDefaults(
  defineProps<{
    config: CodeSelectColConfig;
    model: any;
    prop: string;
    name: string;
    lastValues?: any;
    disabled?: boolean;
    size: 'small' | 'default' | 'large';
  }>(),
  {},
);

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

const selectConfig = {
  type: 'select',
  text: '代码块',
  name: props.name,
  labelWidth: '80px',
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

// 打开代码编辑框
const editCode = () => {
  services?.codeBlockService.setCodeEditorContent(true, props.model[props.name]);
};
</script>
